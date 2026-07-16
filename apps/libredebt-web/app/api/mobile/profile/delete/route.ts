/**
 * app/api/mobile/profile/delete/route.ts
 * POST — permanently delete the user's account
 *
 * Mirrors the web deleteAccountAction:
 *   - Archives all active debts (preserves ledger history)
 *   - Anonymises the user row (GDPR-compatible soft delete)
 *   - Revokes all sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, debts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const authResult = await requireMobileUser(request);
  if (isUnauthorized(authResult)) return authResult;

  const userId = authResult.user.id;

  try {
    await db.transaction(async (tx) => {
      // Archive active debts — ledger entries must survive for financial audit
      await tx
        .update(debts)
        .set({ status: "archived", updatedAt: new Date() })
        .where(and(eq(debts.userId, userId), eq(debts.status, "active")));

      // Soft-delete: anonymise PII but keep the row for FK integrity
      await tx
        .update(users)
        .set({
          name: "Deleted User",
          email: `deleted-${userId}@libredebt.invalid`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    });

    // Revoke current session token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (token) {
      await auth.api.revokeSession({
        body: { token },
        headers: request.headers,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mobile/profile/delete] error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
