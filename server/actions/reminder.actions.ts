/**
 * server/actions/reminder.actions.ts
 *
 * Server Actions for the reminder system.
 * Both actions are PRO-GATED — free users cannot enable reminders.
 *
 * Follows the same pattern as debt.actions.ts:
 *   authenticate → gate → execute → revalidate → return
 */

"use server";

import { revalidatePath } from "next/cache";
import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import { checkFeatureAccess } from "@/server/services/access.service";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  scheduleRemindersForDebt,
  cancelPendingRemindersForDebt,
} from "@/server/services/reminder.service";
import { getDebtById } from "@/server/repositories/debt.repository";
import {
  toggleDebtReminderSchema,
  updateReminderPreferencesSchema,
} from "@/server/validators/reminder.schema";
import { redirect } from "next/navigation";

const authAction = createSafeActionClient().use(async ({ next }) => {
  const user = await requireUser();
  if (!user) {
    redirect("/login"); // ✅ ONLY place redirect happens
  }
  return next({
    ctx: {
      userId: user.id,
      subscriptionTier: (user.subscriptionTier ?? "free") as "free" | "pro",
    },
  });
});

// ─── Toggle reminders for a specific debt ─────────────────────────────────────

// ─── Toggle reminders for a specific debt ─────────────────────────────────────

export const toggleDebtReminderAction = authAction
  .inputSchema(toggleDebtReminderSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, subscriptionTier } = ctx;
    const { debtId, enabled } = parsedInput;

    const access = await checkFeatureAccess(
      userId,
      subscriptionTier,
      "USE_REMINDERS",
    );
    if (!access.allowed) {
      return {
        success: false as const,
        error: access.reason,
        code: access.code,
      };
    }

    const debt = await getDebtById(debtId, userId);
    if (!debt) {
      return { success: false as const, error: "Debt not found." };
    }

    // Always clean out old states to ensure data cleanliness
    await cancelPendingRemindersForDebt(debtId, userId);

    if (enabled) {
      if (!debt.dueDay) {
        return {
          success: false as const,
          error: "Set a due day on this debt before enabling reminders.",
        };
      }
      // Force schedule future intervals dynamically
      await scheduleRemindersForDebt(debtId, userId, debt.dueDay);
    }

    revalidatePath("/reminders");
    revalidatePath(`/debts/${debtId}`);

    return { success: true as const };
  });

// ─── Update global reminder preferences ───────────────────────────────────────

export const updateReminderPreferencesAction = authAction
  .inputSchema(updateReminderPreferencesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, subscriptionTier } = ctx;

    const access = await checkFeatureAccess(
      userId,
      subscriptionTier,
      "USE_REMINDERS",
    );
    if (!access.allowed) {
      return {
        success: false as const,
        error: access.reason,
        code: access.code,
      };
    }

    await db
      .update(users)
      .set({
        reminderDueSoonEnabled: parsedInput.dueSoonEnabled,
        reminderOverdueEnabled: parsedInput.overdueEnabled,
        reminderWeeklySummaryEnabled: parsedInput.weeklySummaryEnabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath("/reminders");

    return { success: true as const };
  });
