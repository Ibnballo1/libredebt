/**
 * server/actions/admin.actions.ts
 *
 * Single read-only Server Action backing the admin ledger drill-down.
 * Gated by requireSuperAdmin() exactly like every admin page.
 */

"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-session";
import { getAdminUserLedger } from "@/server/services/admin.service";

const adminAction = createSafeActionClient().use(async ({ next }) => {
  await requireSuperAdmin();
  return next({ ctx: {} });
});

export const getAdminUserLedgerAction = adminAction
  .inputSchema(z.object({ userId: z.string(), debtId: z.string() }))
  .action(async ({ parsedInput }) => {
    const entries = await getAdminUserLedger(
      parsedInput.userId,
      parsedInput.debtId,
    );
    return { success: true as const, entries };
  });
