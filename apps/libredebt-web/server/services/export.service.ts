/**
 * server/services/export.service.ts
 *
 * Fetches all data needed for export, scoped to a single user.
 * Returns plain objects ready to be serialised as CSV or PDF.
 *
 * Uses the same GROUP BY balance-map pattern (no correlated subqueries)
 * that was established as the correct pattern in the Step 6 bugfix.
 */

import { db } from "@/db";
import { debts, ledgerEntries } from "@/db/schema";
import { receivables, receivableLedgerEntries } from "@/db/schema/receivables";
import { eq, and, sum, desc } from "drizzle-orm";
import { fromMinorUnits } from "@/lib/utils";

// ─── Debts export ──────────────────────────────────────────────────────────────

export type DebtExportRow = {
  name: string;
  creditor: string;
  currency: string;
  status: string;
  originalAmount: string;
  currentBalance: string;
  amountRepaid: string;
  progressPercent: string;
  interestRatePercent: string;
  minimumPayment: string;
  dueDay: string;
};

export async function getDebtsForExport(
  userId: string,
): Promise<DebtExportRow[]> {
  const debtRows = await db
    .select()
    .from(debts)
    .where(eq(debts.userId, userId))
    .orderBy(desc(debts.createdAt));

  if (debtRows.length === 0) return [];

  // Fetch all balances in one GROUP BY query
  const balanceRows = await db
    .select({
      debtId: ledgerEntries.debtId,
      balance: sum(ledgerEntries.amountMinor),
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId))
    .groupBy(ledgerEntries.debtId);

  const balanceMap = new Map(
    balanceRows.map((r) => [r.debtId, Math.max(0, Number(r.balance ?? 0))]),
  );

  return debtRows.map((d) => {
    const original = Number(d.originalAmountMinor);
    const current = balanceMap.get(d.id) ?? 0;
    const repaid = Math.max(0, original - current);
    const progress =
      original > 0
        ? Math.round(((original - current) / original) * 1000) / 10
        : 0;
    const interestPct =
      d.interestRateBps > 0 ? (d.interestRateBps / 100).toFixed(2) + "%" : "0%";

    return {
      name: d.name,
      creditor: d.creditor,
      currency: d.currency,
      status: d.status,
      originalAmount: fromMinorUnits(original),
      currentBalance: fromMinorUnits(current),
      amountRepaid: fromMinorUnits(repaid),
      progressPercent: progress + "%",
      interestRatePercent: interestPct,
      minimumPayment: fromMinorUnits(Number(d.minimumPaymentMinor)),
      dueDay: d.dueDay ? String(d.dueDay) : "",
    };
  });
}

// ─── Payments export ───────────────────────────────────────────────────────────

export type PaymentExportRow = {
  date: string;
  debtName: string;
  creditor: string;
  currency: string;
  amount: string;
  type: string;
  note: string;
};

export async function getPaymentsForExport(
  userId: string,
): Promise<PaymentExportRow[]> {
  const rows = await db
    .select({
      effectiveDate: ledgerEntries.effectiveDate,
      debtName: debts.name,
      creditor: debts.creditor,
      currency: debts.currency,
      amountMinor: ledgerEntries.amountMinor,
      type: ledgerEntries.type,
      note: ledgerEntries.note,
    })
    .from(ledgerEntries)
    .innerJoin(debts, eq(ledgerEntries.debtId, debts.id))
    .where(eq(ledgerEntries.userId, userId))
    .orderBy(desc(ledgerEntries.effectiveDate));

  return rows.map((r) => ({
    date: new Date(r.effectiveDate).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    debtName: r.debtName,
    creditor: r.creditor,
    currency: r.currency,
    amount: fromMinorUnits(Math.abs(Number(r.amountMinor))),
    type: r.type,
    note: r.note ?? "",
  }));
}

// ─── Receivables export ────────────────────────────────────────────────────────

export type ReceivableExportRow = {
  name: string;
  debtorName: string;
  debtorPhone: string;
  debtorRelationship: string;
  currency: string;
  status: string;
  originalAmount: string;
  currentBalance: string;
  amountRepaid: string;
  progressPercent: string;
  expectedByDate: string;
};

export async function getReceivablesForExport(
  userId: string,
): Promise<ReceivableExportRow[]> {
  const rows = await db
    .select()
    .from(receivables)
    .where(eq(receivables.userId, userId))
    .orderBy(desc(receivables.createdAt));

  if (rows.length === 0) return [];

  const balanceRows = await db
    .select({
      receivableId: receivableLedgerEntries.receivableId,
      balance: sum(receivableLedgerEntries.amountMinor),
    })
    .from(receivableLedgerEntries)
    .where(eq(receivableLedgerEntries.userId, userId))
    .groupBy(receivableLedgerEntries.receivableId);

  const balanceMap = new Map(
    balanceRows.map((r) => [
      r.receivableId,
      Math.max(0, Number(r.balance ?? 0)),
    ]),
  );

  return rows.map((r) => {
    const original = Number(r.originalAmountMinor);
    const current = balanceMap.get(r.id) ?? 0;
    const repaid = Math.max(0, original - current);
    const progress =
      original > 0
        ? Math.round(((original - current) / original) * 1000) / 10
        : 0;

    return {
      name: r.name,
      debtorName: r.debtorName,
      debtorPhone: r.debtorPhone ?? "",
      debtorRelationship: r.debtorRelationship ?? "",
      currency: r.currency,
      status: r.status,
      originalAmount: fromMinorUnits(original),
      currentBalance: fromMinorUnits(current),
      amountRepaid: fromMinorUnits(repaid),
      progressPercent: progress + "%",
      expectedByDate: r.expectedByDate
        ? new Date(r.expectedByDate).toLocaleDateString("en-NG", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "",
    };
  });
}
