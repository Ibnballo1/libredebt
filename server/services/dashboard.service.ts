/**
 * server/services/dashboard.service.ts
 *
 * All dashboard statistics are computed directly from the ledger.
 * No cached balance columns — every number here is always accurate.
 */

import { db } from "@/db";
import { debts, ledgerEntries } from "@/db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardStats = {
  /** Number of active debts */
  activeDebtCount: number;
  /** Grouped calculations mapped precisely by individual asset ticker handles */
  currencyTotals: Record<
    string,
    {
      totalOriginalMinor: number;
      totalCurrentMinor: number;
      totalRepaidMinor: number;
    }
  >;
  /** Per-debt breakdown for the progress list */
  debtBreakdown: DebtBreakdownItem[];
  /** Most recent payment entries across all debts */
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

// ─── Main aggregation function ────────────────────────────────────────────────

export async function getDashboardStats(
  userId: string,
): Promise<DashboardStats> {
  // ── Query 1: Active debt counts ──────────────────────────────────────────
  const debtCountRes = await db
    .select({ count: count() })
    .from(debts)
    .where(and(eq(debts.userId, userId), eq(debts.status, "active")));

  const activeDebtCount = debtCountRes[0]?.count ?? 0;

  // Short-circuit: no debts → return zeroes
  if (activeDebtCount === 0) {
    return {
      activeDebtCount: 0,
      currencyTotals: {},
      debtBreakdown: [],
      recentPayments: [],
    };
  }

  // ── Query 2: Per-debt current balances ────────────────────────────────────
  const debtRows = await db
    .select({
      id: debts.id,
      name: debts.name,
      creditor: debts.creditor,
      currency: debts.currency,
      originalAmountMinor: debts.originalAmountMinor,
      dueDay: debts.dueDay,
      currentBalanceMinor: sql<number>`
        COALESCE((
          SELECT SUM(${ledgerEntries.amountMinor})
          FROM ${ledgerEntries}
          WHERE ${ledgerEntries.debtId} = ${debts.id}
            AND ${ledgerEntries.userId} = ${userId}
        ), 0)
      `.mapWith(Number),
    })
    .from(debts)
    .where(and(eq(debts.userId, userId), eq(debts.status, "active")))
    .orderBy(desc(debts.createdAt));

  // ── Aggregations grouped securely by unique asset currencies ──
  const currencyTotals: DashboardStats["currencyTotals"] = {};

  for (const row of debtRows) {
    const cc = row.currency;
    const current = Math.max(0, row.currentBalanceMinor);
    const original = row.originalAmountMinor;

    if (!currencyTotals[cc]) {
      currencyTotals[cc] = {
        totalOriginalMinor: 0,
        totalCurrentMinor: 0,
        totalRepaidMinor: 0,
      };
    }

    currencyTotals[cc].totalOriginalMinor += original;
    currencyTotals[cc].totalCurrentMinor += current;
  }

  // ✨ FIXED: Amount Repaid = Original Debt - Current Balance Outstanding
  for (const cc in currencyTotals) {
    const original = currencyTotals[cc]?.totalOriginalMinor ?? 0;
    const current = currencyTotals[cc]?.totalCurrentMinor ?? 0;

    currencyTotals[cc]!.totalRepaidMinor = Math.max(0, original - current);
  }

  // ── Build per-debt breakdown ──────────────────────────────────────────────
  const debtBreakdown: DebtBreakdownItem[] = debtRows.map((d) => {
    const current = Math.max(0, d.currentBalanceMinor);

    // ✨ FIXED: Repaid Delta value used to measure complete breakdown progress percentages accurately
    const repaidAmount = Math.max(0, d.originalAmountMinor - current);

    const pct =
      d.originalAmountMinor > 0
        ? Math.min(
            100,
            Math.max(
              0,
              Math.round((repaidAmount / d.originalAmountMinor) * 1000) / 10,
            ),
          )
        : 0;

    return {
      id: d.id,
      name: d.name,
      creditor: d.creditor,
      currency: d.currency,
      originalAmountMinor: d.originalAmountMinor,
      currentBalanceMinor: current,
      progressPercent: pct,
      dueDay: d.dueDay,
    };
  });

  // ── Query 3: Recent payment entries (last 5) ──────────────────────────────
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
    amountMinor: e.amountMinor,
    currency: e.currency,
    note: e.note,
    effectiveDate: e.effectiveDate,
  }));

  return {
    activeDebtCount,
    currencyTotals,
    debtBreakdown,
    recentPayments,
  };
}

// ─── Payments history (full list for /payments page) ─────────────────────────

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
};

/**
 * Fetches the complete payment history for a user across all debts.
 * Used on the /payments page.
 */
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
    })
    .from(ledgerEntries)
    .innerJoin(debts, eq(ledgerEntries.debtId, debts.id))
    .where(eq(ledgerEntries.userId, userId))
    .orderBy(desc(ledgerEntries.effectiveDate))
    .limit(limit);

  return rows as PaymentHistoryEntry[];
}
