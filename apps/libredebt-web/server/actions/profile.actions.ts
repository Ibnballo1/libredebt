/**
 * server/actions/profile.actions.ts — UPDATED
 *
 * updateProfileAction converts empty phone string → null and enforces
 * the rule: if no phone, both messaging channels are forced off.
 * All other actions unchanged.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { users, debts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "@/server/validators/profile.schema";

const authAction = createSafeActionClient().use(async ({ next }) => {
  const user = await requireUser();

  if (!user) {
    redirect("/login");
  }

  return next({ ctx: { userId: user.id } });
});

// ─── Update profile ────────────────────────────────────────────────────────────

export const updateProfileAction = authAction
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Normalise phone: empty string or whitespace-only → null
    const phone = parsedInput.phone?.trim() || null;

    // If no phone number, force both messaging channels off
    const smsEnabled = phone ? (parsedInput.smsEnabled ?? false) : false;
    const whatsappEnabled = phone
      ? (parsedInput.whatsappEnabled ?? false)
      : false;

    await db
      .update(users)
      .set({
        name: parsedInput.name,
        currency: parsedInput.currency,
        phone,
        smsEnabled,
        whatsappEnabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.userId));

    revalidatePath("/settings");
    revalidatePath("/overview");

    return { success: true as const };
  });

// ─── Change password ────────────────────────────────────────────────────────────

export const changePasswordAction = authAction
  .inputSchema(changePasswordSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.changePassword({
        body: {
          currentPassword: parsedInput.currentPassword,
          newPassword: parsedInput.newPassword,
          revokeOtherSessions: true,
        },
        headers: await headers(),
      });

      return { success: true as const };
    } catch (error) {
      return {
        success: false as const,
        error:
          error instanceof Error
            ? error.message
            : "Current password is incorrect.",
      };
    }
  });

// ─── Delete account ──────────────────────────────────────────────────────────────

export const deleteAccountAction = authAction
  .inputSchema(deleteAccountSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    await db.transaction(async (tx) => {
      await tx
        .update(debts)
        .set({ status: "archived", updatedAt: new Date() })
        .where(and(eq(debts.userId, userId), eq(debts.status, "active")));

      await tx
        .update(users)
        .set({
          name: "Deleted User",
          email: `deleted-${userId}@libredebt.invalid`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    });

    await auth.api.revokeSessions({
      // body: { userId },
      headers: await headers(),
    });

    redirect("/login");
  });
