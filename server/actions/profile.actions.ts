/**
 * server/actions/profile.actions.ts
 *
 * Account-level Server Actions: update profile info, change password,
 * delete account.
 *
 * PASSWORD CHANGE uses BetterAuth's server API directly (auth.api.*)
 * rather than reimplementing hashing/verification — BetterAuth already
 * owns the `accounts` table where the password hash lives.
 *
 * ACCOUNT DELETION is a hard, irreversible action. It requires the user
 * to type "DELETE" as a confirmation phrase (checked by Zod's z.literal)
 * and cascades through BetterAuth's session/account deletion, then
 * archives (never hard-deletes) the user's debts — ledger entries must
 * survive even account deletion, per our append-only principle. The
 * user row itself transitions to a soft-deleted state rather than being
 * removed, so financial records remain auditable.
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
    redirect("/login"); // ✅ ONLY place redirect happens
  }
  return next({ ctx: { userId: user.id } });
});

// ─── Update profile ────────────────────────────────────────────────────────────

export const updateProfileAction = authAction
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db
      .update(users)
      .set({
        name: parsedInput.name,
        currency: parsedInput.currency,
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
      // Archive all active debts — never delete; ledger history must
      // remain queryable for financial audit purposes even after the
      // account is gone.
      await tx
        .update(debts)
        .set({ status: "archived", updatedAt: new Date() })
        .where(and(eq(debts.userId, userId), eq(debts.status, "active")));

      // Soft-delete: anonymize PII but keep the row so subscriptions/
      // ledger foreign keys remain valid. A real implementation would
      // add a `deletedAt` column; for now we clear identifying fields.
      await tx
        .update(users)
        .set({
          name: "Deleted User",
          email: `deleted-${userId}@libredebt.invalid`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    });

    // Revoke all sessions for this user via BetterAuth
    // BetterAuth's revokeSessions endpoint does not accept a body here;
    // it revokes sessions for the user identified by the authorization
    // headers, so pass only headers.
    await auth.api.revokeSessions({
      headers: await headers(),
    });

    redirect("/login");
  });
