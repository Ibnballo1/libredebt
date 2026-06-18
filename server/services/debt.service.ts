/**
 * server/services/debt.service.ts
 *
 * Business logic for the debt domain.
 * This layer sits between Server Actions (input/auth) and
 * the Repository (database). It owns:
 *
 *   - Unit conversion (decimal → minor units, % → basis points)
 *   - ID generation
 *   - Transaction orchestration (debt + ledger in one atomic op)
 *   - Business rule enforcement beyond the schema
 *
 * ATOMIC CREATION PATTERN:
 * Creating a debt requires two writes:
 *   1. Insert the debt row
 *   2. Insert the OPENING ledger entry (the starting balance)
 *
 * If step 1 succeeds but step 2 fails, the debt has no balance —
 * a corrupted state. We wrap both in a Drizzle transaction so they
 * either both succeed or both roll back.
 */

import { db } from "@/db";
// import { nanoid } from "nanoid"
import { v4 as uuidv4 } from "uuid";
import { toMinorUnits } from "@/lib/utils";
import {
  insertDebt,
  insertLedgerEntry,
  updateDebt,
  archiveDebt,
  getDebtById,
  getActiveDebtsByUserId,
  getLedgerEntriesByDebtId,
  countActiveDebtsByUserId,
} from "@/server/repositories/debt.repository";
import type {
  CreateDebtInput,
  EditDebtInput,
  RecordPaymentInput,
} from "@/server/validators/debt.schema";

// Re-export for use in Server Actions
export {
  getActiveDebtsByUserId,
  getDebtById,
  getLedgerEntriesByDebtId,
  countActiveDebtsByUserId,
};

// ─── Create Debt ──────────────────────────────────────────────────────────────

export type CreateDebtResult =
  | { success: true; debtId: string }
  | { success: false; error: string };

export async function createDebt(
  userId: string,
  input: CreateDebtInput,
): Promise<CreateDebtResult> {
  try {
    // Convert decimal string inputs to integer minor units
    const originalAmountMinor = toMinorUnits(input.originalAmount);
    const minimumPaymentMinor = input.minimumPayment
      ? toMinorUnits(input.minimumPayment)
      : 0;

    // Convert interest rate percentage to basis points
    // 24.5% → 2450 bps
    const interestRateBps = input.interestRate
      ? Math.round(parseFloat(input.interestRate) * 100)
      : 0;

    const dueDay = input.dueDay ? parseInt(input.dueDay, 10) : null;

    const debtId = uuidv4();
    const ledgerEntryId = uuidv4();

    /**
     * Atomic transaction: debt + opening ledger entry.
     * If either insert fails, both are rolled back.
     */
    await db.transaction(async (tx) => {
      // 1. Insert the debt metadata row
      await insertDebt(
        {
          id: debtId,
          userId,
          name: input.name,
          creditor: input.creditor,
          originalAmountMinor,
          interestRateBps,
          minimumPaymentMinor,
          dueDay,
          currency: input.currency,
          notes: input.notes,
        },
        tx,
      );

      // 2. Insert the OPENING ledger entry
      // The opening entry records the starting balance.
      // It is POSITIVE because it increases the outstanding balance.
      // All subsequent payments will be NEGATIVE (reducing the balance).
      await insertLedgerEntry(
        {
          id: ledgerEntryId,
          debtId,
          userId,
          type: "opening",
          amountMinor: originalAmountMinor, // positive: you owe this amount
          recordedBy: "system",
          note: `Opening balance for ${input.name}`,
          effectiveDate: new Date(),
        },
        tx,
      );
    });

    return { success: true, debtId };
  } catch (error) {
    console.error("[debt.service] createDebt error:", error);
    return {
      success: false,
      error: "Failed to create debt. Please try again.",
    };
  }
}

// ─── Edit Debt ────────────────────────────────────────────────────────────────

export type EditDebtResult =
  | { success: true }
  | { success: false; error: string };

export async function editDebt(
  userId: string,
  debtId: string,
  input: EditDebtInput,
): Promise<EditDebtResult> {
  try {
    // Verify the debt exists and belongs to this user
    const existing = await getDebtById(debtId, userId);
    if (!existing) {
      return { success: false, error: "Debt not found." };
    }

    if (existing.status === "archived") {
      return { success: false, error: "Archived debts cannot be edited." };
    }

    const minimumPaymentMinor = input.minimumPayment
      ? toMinorUnits(input.minimumPayment)
      : 0;

    const interestRateBps = input.interestRate
      ? Math.round(parseFloat(input.interestRate) * 100)
      : 0;

    const dueDay = input.dueDay ? parseInt(input.dueDay, 10) : null;

    await updateDebt(debtId, userId, {
      name: input.name,
      creditor: input.creditor,
      interestRateBps,
      minimumPaymentMinor,
      dueDay,
      currency: input.currency,
      notes: input.notes,
    });

    return { success: true };
  } catch (error) {
    console.error("[debt.service] editDebt error:", error);
    return {
      success: false,
      error: "Failed to update debt. Please try again.",
    };
  }
}

// ─── Archive Debt ─────────────────────────────────────────────────────────────

export type ArchiveDebtResult =
  | { success: true }
  | { success: false; error: string };

export async function archiveDebtById(
  userId: string,
  debtId: string,
): Promise<ArchiveDebtResult> {
  try {
    const existing = await getDebtById(debtId, userId);
    if (!existing) {
      return { success: false, error: "Debt not found." };
    }

    if (existing.status === "archived") {
      return { success: false, error: "Debt is already archived." };
    }

    await archiveDebt(debtId, userId);
    return { success: true };
  } catch (error) {
    console.error("[debt.service] archiveDebt error:", error);
    return {
      success: false,
      error: "Failed to archive debt. Please try again.",
    };
  }
}

// ─── Record Payment ───────────────────────────────────────────────────────────

export type RecordPaymentResult =
  | { success: true; ledgerEntryId: string }
  | { success: false; error: string };

export async function recordPayment(
  userId: string,
  input: RecordPaymentInput,
): Promise<RecordPaymentResult> {
  try {
    const existing = await getDebtById(input.debtId, userId);
    if (!existing) {
      return { success: false, error: "Debt not found." };
    }

    if (existing.status === "archived") {
      return {
        success: false,
        error: "Cannot record payment on an archived debt.",
      };
    }

    const paymentAmountMinor = toMinorUnits(input.amount);

    /**
     * SIGN CONVENTION:
     * Payment amounts are stored as NEGATIVE values.
     * This is the ledger principle: payments REDUCE the outstanding balance.
     *
     * Balance formula: SUM(all entries)
     *   Opening: +500000  (you owe ₦5,000)
     *   Payment: -100000  (you paid ₦1,000)
     *   Balance: +400000  (you owe ₦4,000)
     */
    const signedAmount = -Math.abs(paymentAmountMinor);

    /**
     * Guard: prevent a payment that would make the balance negative.
     * A balance below zero would mean you've overpaid — while possible,
     * it should require explicit confirmation (future feature).
     */
    const projectedBalance = existing.currentBalanceMinor + signedAmount;
    if (projectedBalance < 0) {
      const maxPayableMinor = existing.currentBalanceMinor;
      const maxPayable = (maxPayableMinor / 100).toFixed(2);
      return {
        success: false,
        error: `Payment exceeds outstanding balance. Maximum payment is ${existing.currency} ${maxPayable}.`,
      };
    }

    const ledgerEntryId = uuidv4();

    await insertLedgerEntry({
      id: ledgerEntryId,
      debtId: input.debtId,
      userId,
      type: "payment",
      amountMinor: signedAmount,
      recordedBy: "user",
      note: input.note,
      effectiveDate: new Date(input.effectiveDate),
    });

    return { success: true, ledgerEntryId };
  } catch (error) {
    console.error("[debt.service] recordPayment error:", error);
    return {
      success: false,
      error: "Failed to record payment. Please try again.",
    };
  }
}
