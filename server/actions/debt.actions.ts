/**
 * server/actions/debt.actions.ts
 *
 * Next.js Server Actions for all debt mutations.
 *
 * EVERY ACTION FOLLOWS THIS SEQUENCE:
 *   1. Authenticate     — middleware verifies session, provides userId + tier
 *   2. Validate input   — next-safe-action parses with Zod schema
 *   3. Gate feature     — subscription tier check (server-side, unfakeable)
 *   4. Execute service  — business logic + atomic DB writes
 *   5. Revalidate cache — Next.js refreshes affected Server Component pages
 *   6. Return result    — typed { success, error?, data? }
 *
 * next-safe-action v8 API:
 *   createSafeActionClient() → .use() for middleware → .inputSchema() → .action()
 */

"use server";

import { z } from "zod";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-session";
import { checkFeatureAccess } from "@/server/services/access.service";
import {
  createDebt,
  editDebt,
  archiveDebtById,
  recordPayment,
} from "@/server/services/debt.service";
import {
  scheduleRemindersForDebt,
  cancelPendingRemindersForDebt,
} from "@/server/services/reminder.service";
import {
  createDebtSchema,
  editDebtSchema,
  archiveDebtSchema,
  recordPaymentSchema,
} from "@/server/validators/debt.schema";
import { redirect } from "next/navigation";

// ─── Authenticated action client ──────────────────────────────────────────────
// Every action built with this client gets userId + subscriptionTier in ctx.

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

// ─── Create Debt ──────────────────────────────────────────────────────────────

export const createDebtAction = authAction
  .inputSchema(createDebtSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, subscriptionTier } = ctx;

    // Server-side subscription gate — cannot be bypassed via UI manipulation
    const access = await checkFeatureAccess(
      userId,
      subscriptionTier,
      "CREATE_DEBT",
    );
    if (!access.allowed) {
      return {
        success: false as const,
        error: access.reason,
        code: access.code,
      };
    }

    const result = await createDebt(userId, parsedInput);
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    // Pro users with a due day set get reminders scheduled automatically.
    // Free users never get reminders — this is a Pro-gated feature.
    if (subscriptionTier === "pro" && parsedInput.dueDay) {
      await scheduleRemindersForDebt(
        result.debtId,
        userId,
        parseInt(parsedInput.dueDay, 10),
      );
    }

    revalidatePath("/debts");
    revalidatePath("/overview");

    return { success: true as const, debtId: result.debtId };
  });

// ─── Edit Debt ────────────────────────────────────────────────────────────────

// Extend edit schema with debtId (the target to edit)
const editDebtActionSchema = editDebtSchema.extend({
  debtId: z.string().min(1, "Debt ID is required"),
});

export const editDebtAction = authAction
  .inputSchema(editDebtActionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, subscriptionTier } = ctx;
    const { debtId, ...editInput } = parsedInput;

    const result = await editDebt(userId, debtId, editInput);
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    // Re-schedule reminders if the due day changed (Pro only).
    // scheduleRemindersForDebt cancels old pending reminders first,
    // so this is safe to call even if dueDay is unchanged.
    if (subscriptionTier === "pro") {
      if (editInput.dueDay) {
        await scheduleRemindersForDebt(
          debtId,
          userId,
          parseInt(editInput.dueDay, 10),
        );
      } else {
        // Due day was cleared — cancel any pending reminders
        await cancelPendingRemindersForDebt(debtId, userId);
      }
    }

    revalidatePath("/debts");
    revalidatePath(`/debts/${debtId}`);
    revalidatePath("/overview");

    return { success: true as const };
  });

// ─── Archive Debt ─────────────────────────────────────────────────────────────

export const archiveDebtAction = authAction
  .inputSchema(archiveDebtSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    const result = await archiveDebtById(userId, parsedInput.debtId);
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    // Cancel any pending reminders — an archived debt shouldn't nag the user
    await cancelPendingRemindersForDebt(parsedInput.debtId, userId);

    revalidatePath("/debts");
    revalidatePath("/overview");

    return { success: true as const };
  });

// ─── Record Payment ───────────────────────────────────────────────────────────

export const recordPaymentAction = authAction
  .inputSchema(recordPaymentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // recordPayment is always allowed — no subscription gate needed
    const result = await recordPayment(userId, parsedInput);
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    revalidatePath("/debts");
    revalidatePath(`/debts/${parsedInput.debtId}`);
    revalidatePath("/overview");
    revalidatePath("/payments");

    return { success: true as const, ledgerEntryId: result.ledgerEntryId };
  });
