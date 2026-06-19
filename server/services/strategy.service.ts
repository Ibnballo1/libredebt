/**
 * server/services/strategy.service.ts
 *
 * Bridges real debt data to the pure calculation engine.
 *
 * RESPONSIBILITIES:
 *   - Fetch the user's active debts in the shape the calculator expects
 *   - Determine the default monthly budget (sum of minimums + a sensible
 *     extra, or let the user specify one)
 *   - Run compareStrategies() and return a UI-ready result
 *   - Persist the user's chosen strategy (strategyOrder on debts table)
 *     when they commit to a plan
 *
 * This is the ONLY file in Stage 3 that touches the database.
 * strategy.calculator.ts remains pure and untouched.
 */

import { db } from "@/db";
import { debts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getActiveDebtsByUserId } from "@/server/repositories/debt.repository";
import {
  compareStrategies,
  runStrategySimulation,
  type StrategyDebtInput,
  type StrategyResult,
  type StrategyType,
} from "@/server/services/strategy.calculator";

// ─── Build calculator input from real debts ──────────────────────────────────

async function buildStrategyInput(
  userId: string,
): Promise<StrategyDebtInput[]> {
  const activeDebts = await getActiveDebtsByUserId(userId);

  return activeDebts
    .filter((d) => d.currentBalanceMinor > 0) // already-paid debts excluded
    .map((d) => ({
      id: d.id,
      name: d.name,
      currentBalanceMinor: d.currentBalanceMinor,
      minimumPaymentMinor: d.minimumPaymentMinor,
      interestRateBps: d.interestRateBps,
    }));
}

/**
 * The minimum viable monthly budget — sum of all minimum payments.
 * Used as a floor in the UI's budget input and as the default suggestion
 * (minimums + 10%) when no budget has been chosen yet.
 */
export async function getMinimumMonthlyBudget(userId: string): Promise<number> {
  const input = await buildStrategyInput(userId);
  return input.reduce((sum, d) => sum + d.minimumPaymentMinor, 0);
}

// ─── Run comparison for the strategies page ──────────────────────────────────

export type StrategyComparisonResult = {
  hasDebts: boolean;
  minimumBudgetMinor: number;
  suggestedBudgetMinor: number;
  snowball: StrategyResult;
  avalanche: StrategyResult;
};

export async function getStrategyComparison(
  userId: string,
  monthlyBudgetMinor?: number,
): Promise<StrategyComparisonResult> {
  const input = await buildStrategyInput(userId);

  if (input.length === 0) {
    return {
      hasDebts: false,
      minimumBudgetMinor: 0,
      suggestedBudgetMinor: 0,
      snowball: emptyResult("snowball"),
      avalanche: emptyResult("avalanche"),
    };
  }

  const minimumBudgetMinor = input.reduce(
    (sum, d) => sum + d.minimumPaymentMinor,
    0,
  );

  // Suggested default: minimums + 10%, rounded to nearest 1000 minor units
  const suggestedBudgetMinor =
    Math.ceil((minimumBudgetMinor * 1.1) / 1000) * 1000;

  const budget = monthlyBudgetMinor ?? suggestedBudgetMinor;

  const { snowball, avalanche } = compareStrategies(input, budget);

  return {
    hasDebts: true,
    minimumBudgetMinor,
    suggestedBudgetMinor,
    snowball,
    avalanche,
  };
}

/**
 * Runs a single strategy at a specific budget — used by the
 * what-if simulation slider (Stage 4 builds on this).
 */
export async function runSingleStrategy(
  userId: string,
  strategy: StrategyType,
  monthlyBudgetMinor: number,
): Promise<StrategyResult> {
  const input = await buildStrategyInput(userId);
  if (input.length === 0) return emptyResult(strategy);
  return runStrategySimulation(input, monthlyBudgetMinor, strategy);
}

function emptyResult(strategy: StrategyType): StrategyResult {
  return {
    strategy,
    debtResults: [],
    totalMonthsToDebtFree: 0,
    totalInterestPaidMinor: 0,
    totalPaidMinor: 0,
    monthlySnapshots: [],
    budgetInsufficient: false,
  };
}

// ─── Commit to a strategy ────────────────────────────────────────────────────

/**
 * Persists the chosen strategy's payoff order onto the debts table.
 * This is what makes a strategy "active" — strategyOrder is then used
 * elsewhere (e.g. dashboard highlighting "pay this one next").
 */
export async function commitStrategy(
  userId: string,
  result: StrategyResult,
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const debtResult of result.debtResults) {
      await tx
        .update(debts)
        .set({ strategyOrder: debtResult.payoffOrder, updatedAt: new Date() })
        .where(and(eq(debts.id, debtResult.debtId), eq(debts.userId, userId)));
    }
  });
}

/**
 * Clears any committed strategy ordering — used if the user wants to
 * go back to "no active strategy".
 */
export async function clearStrategy(userId: string): Promise<void> {
  await db
    .update(debts)
    .set({ strategyOrder: null, updatedAt: new Date() })
    .where(eq(debts.userId, userId));
}
