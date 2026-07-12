/**
 * server/services/dashboard.service.ts — DEFINITIVE FIX
 *
 * Same root cause as debt.repository.ts: correlated subqueries using
 * Drizzle's sql`` template interpolate column references as bound
 * parameters, causing them to match nothing and return 0.
 *
 * This version uses a single GROUP BY query to get all balances,
 * then merges with debt data in JavaScript.
 */

import { db } from "@/db";
import { debts, ledgerEntries } from "@/db/schema";
import { eq, and, sum, count, desc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardStats = {
  activeDebtCount: number;
  totalOriginalMinor: number;
  totalCurrentMinor: number;
  totalRepaidMinor: number;
  debtBreakdown: DebtBreakdownItem[];
  recentPayments: RecentPayment[];
};

export type DebtBreakdownItem = {
  id: string;
  name: string;
  creditor: string;
  currency: string;
  originalAmountMinor: number;
  currentBalanceMinor: number;
  progressPercent: number;
  dueDay: number | null;
};

export type RecentPayment = {
  id: string;
  debtId: string;
  debtName: string;
  amountMinor: number;
  currency: string;
  note: string | null;
  effectiveDate: Date;
};

// ─── Main aggregation ─────────────────────────────────────────────────────────

export async function getDashboardStats(
  userId: string,
): Promise<DashboardStats> {
  // ── Query 1: All active debts ─────────────────────────────────────────────
  const debtRows = await db
    .select({
      id: debts.id,
      name: debts.name,
      creditor: debts.creditor,
      currency: debts.currency,
      originalAmountMinor: debts.originalAmountMinor,
      dueDay: debts.dueDay,
    })
    .from(debts)
    .where(and(eq(debts.userId, userId), eq(debts.status, "active")))
    .orderBy(desc(debts.createdAt));

  const activeDebtCount = debtRows.length;

  if (activeDebtCount === 0) {
    return {
      activeDebtCount: 0,
      totalOriginalMinor: 0,
      totalCurrentMinor: 0,
      totalRepaidMinor: 0,
      debtBreakdown: [],
      recentPayments: [],
    };
  }

  // ── Query 2: All ledger balances grouped by debt ───────────────────────────
  //
  // This is a simple GROUP BY query — Drizzle handles it correctly.
  // No correlated subqueries, no sql`` template column-reference issues.
  //
  // Returns one row per debt: { debtId, balanceMinor }
  // balanceMinor = SUM of all ledger entries for that debt
  //   (opening: positive, payments: negative, net = current balance)
  const ledgerRows = await db
    .select({
      debtId: ledgerEntries.debtId,
      balanceMinor: sum(ledgerEntries.amountMinor),
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId))
    .groupBy(ledgerEntries.debtId);

  // Build lookup map: debtId → balanceMinor
  const balanceMap = new Map<string, number>();
  for (const row of ledgerRows) {
    balanceMap.set(
      row.debtId,
      row.balanceMinor !== null ? Number(row.balanceMinor) : 0,
    );
  }

  // ── Compute totals and per-debt breakdown in JS ───────────────────────────
  let totalOriginalMinor = 0;
  let totalCurrentMinor = 0;

  const debtBreakdown: DebtBreakdownItem[] = debtRows.map((debt) => {
    const originalAmountMinor = Number(debt.originalAmountMinor);

    // currentBalance = SUM of all ledger entries
    // For a brand new debt: only the opening entry exists (+original)
    // so currentBalance = original → progress = 0%  ✅
    const rawBalance = balanceMap.get(debt.id) ?? 0;
    const currentBalanceMinor = Math.max(0, rawBalance);

    totalOriginalMinor += originalAmountMinor;
    totalCurrentMinor += currentBalanceMinor;

    const progressPercent =
      originalAmountMinor > 0
        ? Math.min(
            100,
            Math.max(
              0,
              Math.round(
                ((originalAmountMinor - currentBalanceMinor) /
                  originalAmountMinor) *
                  1000,
              ) / 10,
            ),
          )
        : 0;

    return {
      id: debt.id,
      name: debt.name,
      creditor: debt.creditor,
      currency: debt.currency,
      originalAmountMinor,
      currentBalanceMinor,
      progressPercent,
      dueDay: debt.dueDay,
    };
  });

  const totalRepaidMinor = Math.max(0, totalOriginalMinor - totalCurrentMinor);

  // ── Query 3: Recent payments ───────────────────────────────────────────────
  const recentEntries = await db
    .select({
      id: ledgerEntries.id,
      debtId: ledgerEntries.debtId,
      debtName: debts.name,
      currency: debts.currency,
      amountMinor: ledgerEntries.amountMinor,
      note: ledgerEntries.note,
      effectiveDate: ledgerEntries.effectiveDate,
    })
    .from(ledgerEntries)
    .innerJoin(debts, eq(ledgerEntries.debtId, debts.id))
    .where(
      and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.type, "payment")),
    )
    .orderBy(desc(ledgerEntries.effectiveDate))
    .limit(5);

  const recentPayments: RecentPayment[] = recentEntries.map((e) => ({
    id: e.id,
    debtId: e.debtId,
    debtName: e.debtName,
    amountMinor: Number(e.amountMinor),
    currency: e.currency,
    note: e.note,
    effectiveDate: e.effectiveDate,
  }));

  return {
    activeDebtCount,
    totalOriginalMinor,
    totalCurrentMinor,
    totalRepaidMinor,
    debtBreakdown,
    recentPayments,
  };
}

// ─── Payment history ──────────────────────────────────────────────────────────

export type PaymentHistoryEntry = {
  id: string;
  debtId: string;
  debtName: string;
  creditor: string;
  currency: string;
  amountMinor: number;
  note: string | null;
  effectiveDate: Date;
  type: "payment" | "opening" | "adjustment";
  receiptUrl?: string | null;
};

export async function getPaymentHistory(
  userId: string,
  limit = 50,
): Promise<PaymentHistoryEntry[]> {
  const rows = await db
    .select({
      id: ledgerEntries.id,
      debtId: ledgerEntries.debtId,
      debtName: debts.name,
      creditor: debts.creditor,
      currency: debts.currency,
      amountMinor: ledgerEntries.amountMinor,
      note: ledgerEntries.note,
      effectiveDate: ledgerEntries.effectiveDate,
      type: ledgerEntries.type,
      receiptUrl: ledgerEntries.receiptUrl,
    })
    .from(ledgerEntries)
    .innerJoin(debts, eq(ledgerEntries.debtId, debts.id))
    .where(
      and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.type, "payment")),
    )
    .orderBy(desc(ledgerEntries.effectiveDate))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    debtId: r.debtId,
    debtName: r.debtName,
    creditor: r.creditor,
    currency: r.currency,
    amountMinor: Number(r.amountMinor),
    note: r.note,
    effectiveDate: r.effectiveDate,
    // query filters to payments only, so narrow the type here
    type: "payment",
    receiptUrl: r.receiptUrl,
  }));
}
