/**
 * server/services/receivable.service.ts
 *
 * Mirrors server/services/debt.service.ts. Same atomic-transaction
 * pattern for creation (metadata row + opening ledger entry must both
 * succeed or both roll back), same overpayment guard on repayment.
 */

import { db } from "@/db";
import { nanoid } from "nanoid";
import { toMinorUnits } from "@/lib/utils";
import {
  insertReceivable,
  insertReceivableLedgerEntry,
  updateReceivable,
  setReceivableStatus,
  getReceivableById,
  getActiveReceivablesByUserId,
  getReceivableLedgerEntries,
  countActiveReceivablesByUserId,
} from "@/server/repositories/receivable.repository";
import type {
  CreateReceivableInput,
  EditReceivableInput,
  RecordRepaymentInput,
} from "@/server/validators/receivable.schema";

export {
  getActiveReceivablesByUserId,
  getReceivableById,
  getReceivableLedgerEntries,
  countActiveReceivablesByUserId,
};

// ─── Create ───────────────────────────────────────────────────────────────────

export type CreateReceivableResult =
  | { success: true; receivableId: string }
  | { success: false; error: string };

export async function createReceivable(
  userId: string,
  input: CreateReceivableInput,
): Promise<CreateReceivableResult> {
  try {
    const originalAmountMinor = toMinorUnits(input.originalAmount);
    const receivableId = nanoid();
    const ledgerEntryId = nanoid();
    const expectedByDate = input.expectedByDate
      ? new Date(input.expectedByDate)
      : null;

    await db.transaction(async (tx) => {
      await insertReceivable(
        {
          id: receivableId,
          userId,
          name: input.name,
          debtorName: input.debtorName,
          debtorPhone: input.debtorPhone,
          debtorRelationship: input.debtorRelationship,
          originalAmountMinor,
          currency: input.currency,
          expectedByDate,
          notes: input.notes,
        },
        tx,
      );

      // Opening entry: POSITIVE — they now owe you this much.
      await insertReceivableLedgerEntry(
        {
          id: ledgerEntryId,
          receivableId,
          userId,
          type: "opening",
          amountMinor: originalAmountMinor,
          recordedBy: "system",
          note: `Opening balance for ${input.name}`,
          effectiveDate: new Date(),
        },
        tx,
      );
    });

    return { success: true, receivableId };
  } catch (error) {
    console.error("[receivable.service] createReceivable error:", error);
    return {
      success: false,
      error: "Failed to create receivable. Please try again.",
    };
  }
}

// ─── Edit ─────────────────────────────────────────────────────────────────────

export type EditReceivableResult =
  | { success: true }
  | { success: false; error: string };

export async function editReceivable(
  userId: string,
  receivableId: string,
  input: EditReceivableInput,
): Promise<EditReceivableResult> {
  try {
    const existing = await getReceivableById(receivableId, userId);
    if (!existing) return { success: false, error: "Receivable not found." };
    if (existing.status !== "active") {
      return {
        success: false,
        error: "This receivable can no longer be edited.",
      };
    }

    const expectedByDate = input.expectedByDate
      ? new Date(input.expectedByDate)
      : null;

    await updateReceivable(receivableId, userId, {
      name: input.name,
      debtorName: input.debtorName,
      debtorPhone: input.debtorPhone,
      debtorRelationship: input.debtorRelationship,
      currency: input.currency,
      expectedByDate,
      notes: input.notes,
    });

    return { success: true };
  } catch (error) {
    console.error("[receivable.service] editReceivable error:", error);
    return {
      success: false,
      error: "Failed to update receivable. Please try again.",
    };
  }
}

// ─── Archive ──────────────────────────────────────────────────────────────────

export type ArchiveReceivableResult =
  | { success: true }
  | { success: false; error: string };

export async function archiveReceivable(
  userId: string,
  receivableId: string,
): Promise<ArchiveReceivableResult> {
  const existing = await getReceivableById(receivableId, userId);
  if (!existing) return { success: false, error: "Receivable not found." };
  if (existing.status === "archived") {
    return { success: false, error: "Already archived." };
  }

  await setReceivableStatus(receivableId, userId, "archived");
  return { success: true };
}

// ─── Record Repayment ───────────────────────────────────────────────────────────

export type RecordRepaymentResult =
  | { success: true; ledgerEntryId: string; settled: boolean }
  | { success: false; error: string };

export async function recordRepayment(
  userId: string,
  input: RecordRepaymentInput,
): Promise<RecordRepaymentResult> {
  try {
    const existing = await getReceivableById(input.receivableId, userId);
    if (!existing) return { success: false, error: "Receivable not found." };
    if (existing.status !== "active") {
      return {
        success: false,
        error: "Cannot record a repayment on an inactive receivable.",
      };
    }

    const repaymentAmountMinor = toMinorUnits(input.amount);

    // SIGN CONVENTION: repayments are NEGATIVE — they reduce what's owed,
    // same principle as a debt payment reduces a debt balance.
    const signedAmount = -Math.abs(repaymentAmountMinor);

    const projectedBalance = existing.currentBalanceMinor + signedAmount;
    if (projectedBalance < 0) {
      const maxRepayable = (existing.currentBalanceMinor / 100).toFixed(2);
      return {
        success: false,
        error: `Repayment exceeds the outstanding amount. Maximum is ${existing.currency} ${maxRepayable}.`,
      };
    }

    const ledgerEntryId = nanoid();

    await insertReceivableLedgerEntry({
      id: ledgerEntryId,
      receivableId: input.receivableId,
      userId,
      type: "repayment",
      amountMinor: signedAmount,
      recordedBy: "user",
      note: input.note,
      effectiveDate: new Date(input.effectiveDate),
    });

    // Auto-settle: if this repayment brings the balance to exactly 0,
    // flip status to 'settled' automatically rather than requiring a
    // manual archive action.
    const settled = projectedBalance === 0;
    if (settled) {
      await setReceivableStatus(input.receivableId, userId, "settled");
    }

    return { success: true, ledgerEntryId, settled };
  } catch (error) {
    console.error("[receivable.service] recordRepayment error:", error);
    return {
      success: false,
      error: "Failed to record repayment. Please try again.",
    };
  }
}

// ─── Reminder message generator (v1: copy-to-clipboard text, not SMS) ─────────

/**
 * Generates a friendly, non-confrontational reminder message the user
 * can copy and send themselves via WhatsApp/SMS/etc.
 *
 * We deliberately do NOT send this automatically — that requires SMS
 * infrastructure (Twilio or similar), a separately scoped piece of work.
 * This gives immediate value without that dependency.
 */
export function generateReminderMessage(params: {
  debtorName: string;
  amountFormatted: string;
  lenderName: string;
}): string {
  return `Hi ${params.debtorName}, just a friendly reminder about the ${params.amountFormatted} — whenever you get a chance to settle it would be appreciated. Thanks! — ${params.lenderName}`;
}
