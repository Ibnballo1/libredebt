/**
 * server/services/analytics.service.ts
 *
 * All queries needed to power the analytics charts.
 * Reads exclusively from existing tables (debts, ledger_entries) —
 * no new schema required for Stage 5.
 *
 * THREE DATA SHAPES PRODUCED HERE:
 *
 * 1. Monthly repayment trend — how much was paid each calendar month,
 *    across all debts. Powers a bar chart.
 *
 * 2. Per-debt balance trend — the running balance of each debt at the
 *    end of each month, going backward from today. Powers a multi-line
 *    chart showing each debt's decline.
 *
 * 3. Payoff projection — reuses the Stage 3 calculator's monthlySnapshots
 *    output directly. No new calculation logic; this stage is a chart
 *    renderer for data the engine already produces.
 */

import { db } from "@/db";
import { debts, ledgerEntries } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { getActiveDebtsByUserId } from "@/server/repositories/debt.repository";
import {
  runStrategySimulation,
  type StrategyDebtInput,
} from "@/server/services/strategy.calculator";

// ─── Monthly repayment trend ──────────────────────────────────────────────────

export type MonthlyRepaymentPoint = {
  monthKey: string; // "2025-06"
  monthLabel: string; // "Jun 2025"
  totalPaidMinor: number;
};

/**
 * Returns total payments recorded per calendar month, for the last N months.
 * Months with no payments still appear with totalPaidMinor = 0, so the
 * chart x-axis is continuous (no gaps).
 */
export async function getMonthlyRepaymentTrend(
  userId: string,
  monthsBack = 6,
): Promise<MonthlyRepaymentPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (monthsBack - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      amountMinor: ledgerEntries.amountMinor,
      effectiveDate: ledgerEntries.effectiveDate,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, userId),
        eq(ledgerEntries.type, "payment"),
        gte(ledgerEntries.effectiveDate, since),
      ),
    );

  // Build the full month range first, so empty months show as 0
  const points: MonthlyRepaymentPoint[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < monthsBack; i++) {
    const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = cursor.toLocaleDateString("en-NG", {
      month: "short",
      year: "2-digit",
    });
    points.push({ monthKey, monthLabel, totalPaidMinor: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const indexByKey = new Map(points.map((p, i) => [p.monthKey, i]));

  for (const row of rows) {
    const d = new Date(row.effectiveDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const idx = indexByKey.get(key);
    if (idx !== undefined) {
      // Payments are stored negative; flip sign for "amount paid" display
      points[idx]!.totalPaidMinor += Math.abs(Number(row.amountMinor));
    }
  }

  return points;
}

// ─── Per-debt balance trend ───────────────────────────────────────────────────

export type DebtBalanceTrendSeries = {
  debtId: string;
  debtName: string;
  currency: string;
  /** Balance at the end of each month, oldest to newest */
  points: Array<{ monthLabel: string; balanceMinor: number }>;
};

/**
 * Reconstructs each active debt's balance at the end of each of the last
 * N months by replaying ledger entries forward from the earliest entry.
 *
 * This works backward from the CURRENT balance: for each month boundary,
 * we subtract out entries that happened AFTER that boundary to get the
 * balance AS OF that point in time.
 */
export async function getDebtBalanceTrend(
  userId: string,
  monthsBack = 6,
): Promise<DebtBalanceTrendSeries[]> {
  const activeDebts = await getActiveDebtsByUserId(userId);
  if (activeDebts.length === 0) return [];

  const debtIds = activeDebts.map((d) => d.id);

  // Fetch all ledger entries for these debts (full history needed for replay)
  const allEntries = await db
    .select({
      debtId: ledgerEntries.debtId,
      amountMinor: ledgerEntries.amountMinor,
      effectiveDate: ledgerEntries.effectiveDate,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId));

  // Build month boundaries (end of each month, oldest to newest)
  const monthBoundaries: Array<{ label: string; endOfMonth: Date }> = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  cursor.setMonth(cursor.getMonth() - (monthsBack - 1));

  for (let i = 0; i < monthsBack; i++) {
    const endOfMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    monthBoundaries.push({
      label: cursor.toLocaleDateString("en-NG", {
        month: "short",
        year: "2-digit",
      }),
      endOfMonth,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return activeDebts.map((debt) => {
    const entriesForDebt = allEntries.filter((e) => e.debtId === debt.id);
    const currentBalance = debt.currentBalanceMinor;

    const points = monthBoundaries.map(({ label, endOfMonth }) => {
      // Sum of entries that happened AFTER this month boundary
      const entriesAfter = entriesForDebt
        .filter((e) => new Date(e.effectiveDate) > endOfMonth)
        .reduce((sum, e) => sum + Number(e.amountMinor), 0);

      // Balance "as of" this month = current balance minus what happened since
      const balanceAsOf = Math.max(0, currentBalance - entriesAfter);

      return { monthLabel: label, balanceMinor: balanceAsOf };
    });

    return {
      debtId: debt.id,
      debtName: debt.name,
      currency: debt.currency,
      points,
    };
  });
}

// ─── Payoff projection (reuses Stage 3 engine) ───────────────────────────────

export type PayoffProjectionPoint = {
  month: number;
  totalBalanceMinor: number;
};

/**
 * Returns the projected total balance over time at the user's current
 * budget, using the SAME calculator engine from Stage 3/4. No new
 * simulation logic — this just exposes monthlySnapshots for charting.
 */
export async function getPayoffProjection(
  userId: string,
): Promise<{ points: PayoffProjectionPoint[]; totalMonths: number }> {
  const activeDebts = await getActiveDebtsByUserId(userId);
  const input: StrategyDebtInput[] = activeDebts
    .filter((d) => d.currentBalanceMinor > 0)
    .map((d) => ({
      id: d.id,
      name: d.name,
      currentBalanceMinor: d.currentBalanceMinor,
      minimumPaymentMinor: d.minimumPaymentMinor,
      interestRateBps: d.interestRateBps,
    }));

  if (input.length === 0) return { points: [], totalMonths: 0 };

  const budget = input.reduce((sum, d) => sum + d.minimumPaymentMinor, 0);
  const result = runStrategySimulation(input, budget, "avalanche");

  const points = result.monthlySnapshots.map((s) => ({
    month: s.month,
    totalBalanceMinor: s.totalBalanceMinor,
  }));

  return { points, totalMonths: result.totalMonthsToDebtFree };
}
