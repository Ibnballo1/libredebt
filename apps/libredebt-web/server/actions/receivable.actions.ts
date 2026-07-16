/**
 * server/actions/receivable.actions.ts
 *
 * Mirrors server/actions/debt.actions.ts's structure. No subscription
 * gating in v1 — receivables are free for all tiers. Add a
 * checkFeatureAccess() call here later if this should become Pro-gated.
 */

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import {
  createReceivable,
  editReceivable,
  archiveReceivable,
  recordRepayment,
} from "@/server/services/receivable.service";
import {
  createReceivableSchema,
  editReceivableSchema,
  archiveReceivableSchema,
  recordRepaymentSchema,
} from "@/server/validators/receivable.schema";

const authAction = createSafeActionClient().use(async ({ next }) => {
  const user = await requireUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return next({ ctx: { userId: user.id } });
});

// ─── Create ───────────────────────────────────────────────────────────────────

export const createReceivableAction = authAction
  .inputSchema(createReceivableSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await createReceivable(ctx.userId, parsedInput);
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    revalidatePath("/receivables");
    revalidatePath("/overview");

    return { success: true as const, receivableId: result.receivableId };
  });

// ─── Edit ─────────────────────────────────────────────────────────────────────

const editReceivableActionSchema = editReceivableSchema.extend({
  receivableId: z.string().min(1, "Receivable ID is required"),
});

export const editReceivableAction = authAction
  .inputSchema(editReceivableActionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { receivableId, ...editInput } = parsedInput;
    const result = await editReceivable(ctx.userId, receivableId, editInput);
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    revalidatePath("/receivables");
    revalidatePath(`/receivables/${receivableId}`);

    return { success: true as const };
  });

// ─── Archive ──────────────────────────────────────────────────────────────────

export const archiveReceivableAction = authAction
  .inputSchema(archiveReceivableSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await archiveReceivable(
      ctx.userId,
      parsedInput.receivableId,
    );
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    revalidatePath("/receivables");
    revalidatePath("/overview");

    return { success: true as const };
  });

// ─── Record Repayment ───────────────────────────────────────────────────────────

export const recordRepaymentAction = authAction
  .inputSchema(recordRepaymentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await recordRepayment(ctx.userId, parsedInput);
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    revalidatePath("/receivables");
    revalidatePath(`/receivables/${parsedInput.receivableId}`);
    revalidatePath("/overview");

    return {
      success: true as const,
      ledgerEntryId: result.ledgerEntryId,
      settled: result.settled,
    };
  });
