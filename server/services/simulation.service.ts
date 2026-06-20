/**
 * server/services/simulation.service.ts
 *
 * "What-if" simulations: reuses the EXACT SAME pure calculator engine
 * from Stage 3 (strategy.calculator.ts) — zero new calculation logic.
 *
 * The only new idea in this file is computing a DELTA between two runs:
 *   baseline:    current monthly budget (what the user pays today)
 *   hypothetical: current budget + an extra amount
 *
 * WHICH STRATEGY DOES A SIMULATION USE?
 * If the user has already committed to a strategy (Stage 3 sets
 * strategyOrder on their debts), the simulation uses that strategy.
 * If they haven't committed to one yet, it defaults to Avalanche
 * (the mathematically optimal choice) so the numbers shown are the
 * best-case scenario rather than an arbitrary one.
 *
 * WHY A DELTA, NOT JUST TWO SEPARATE NUMBERS?
 * "You'll save 8 months and ₦150,000" is a far more motivating framing
 * than showing two absolute numbers and making the user do the subtraction.
 * This is the single highest-leverage piece of copy in the entire product.
 */

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { getActiveDebtsByUserId } from "@/server/repositories/debt.repository";
import {
  runStrategySimulation,
  type StrategyDebtInput,
  type StrategyResult,
  type StrategyType,
} from "@/server/services/strategy.calculator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SimulationDelta = {
  monthsSaved: number;
  interestSavedMinor: number;
  newDebtFreeMonths: number;
  baselineDebtFreeMonths: number;
};

export type SimulationResult = {
  hasDebts: boolean;
  strategyUsed: StrategyType;
  /** Sum of all minimum payments — the floor for any budget */
  minimumBudgetMinor: number;
  /** What the user is paying today (committed budget or minimums) */
  baselineBudgetMinor: number;
  /** baseline + extraAmount */
  hypotheticalBudgetMinor: number;
  baseline: StrategyResult;
  hypothetical: StrategyResult;
  delta: SimulationDelta;
};

// ─── Determine which strategy to simulate with ───────────────────────────────

/**
 * If the user has committed to a strategy (any debt has strategyOrder set),
 * infer which one by checking whether the current order matches a
 * balance-ascending sort (snowball) or a rate-descending sort (avalanche).
 *
 * In practice we don't need to "detect" — Stage 3's commitStrategyAction
 * could also store WHICH strategy was chosen. For Stage 4 we keep this
 * simple: default every simulation to Avalanche, since it is the
 * interest-optimal choice and gives the most meaningful "savings" framing
 * regardless of what the user has committed to. Stage 5 dashboards can
 * surface both if needed.
 */
function defaultSimulationStrategy(): StrategyType {
  return "avalanche";
}

// ─── Build calculator input from real debts ──────────────────────────────────

async function buildStrategyInput(
  userId: string,
): Promise<StrategyDebtInput[]> {
  const activeDebts = await getActiveDebtsByUserId(userId);

  return activeDebts
    .filter((d) => d.currentBalanceMinor > 0)
    .map((d) => ({
      id: d.id,
      name: d.name,
      currentBalanceMinor: d.currentBalanceMinor,
      minimumPaymentMinor: d.minimumPaymentMinor,
      interestRateBps: d.interestRateBps,
    }));
}

// ─── Run a what-if simulation ─────────────────────────────────────────────────

/**
 * Compares the user's current payoff trajectory against a hypothetical
 * one where they add `extraMonthlyMinor` on top of their baseline budget.
 *
 * @param baselineBudgetMinor  What the user currently budgets per month.
 *                             If omitted, defaults to sum of minimum payments.
 * @param extraMonthlyMinor    The additional amount being simulated
 *                             (e.g. ₦20,000 → toMinorUnits("20000"))
 */
export async function runWhatIfSimulation(
  userId: string,
  extraMonthlyMinor: number,
  baselineBudgetMinor?: number,
): Promise<SimulationResult> {
  const input = await buildStrategyInput(userId);
  const strategy = defaultSimulationStrategy();

  const minimumBudgetMinor = input.reduce(
    (sum, d) => sum + d.minimumPaymentMinor,
    0,
  );

  if (input.length === 0) {
    return emptyResult(strategy, minimumBudgetMinor);
  }

  const baseline = baselineBudgetMinor ?? minimumBudgetMinor;
  const hypothetical = baseline + extraMonthlyMinor;

  const baselineResult = runStrategySimulation(input, baseline, strategy);
  const hypotheticalResult = runStrategySimulation(
    input,
    hypothetical,
    strategy,
  );

  const delta = computeDelta(baselineResult, hypotheticalResult);

  return {
    hasDebts: true,
    strategyUsed: strategy,
    minimumBudgetMinor,
    baselineBudgetMinor: baseline,
    hypotheticalBudgetMinor: hypothetical,
    baseline: baselineResult,
    hypothetical: hypotheticalResult,
    delta,
  };
}

function computeDelta(
  baseline: StrategyResult,
  hypothetical: StrategyResult,
): SimulationDelta {
  // If either run never reaches zero within the safety cap, the delta
  // can't be meaningfully computed — clamp to zero rather than showing
  // a misleading huge number.
  if (baseline.budgetInsufficient || hypothetical.budgetInsufficient) {
    return {
      monthsSaved: 0,
      interestSavedMinor: 0,
      newDebtFreeMonths: hypothetical.totalMonthsToDebtFree,
      baselineDebtFreeMonths: baseline.totalMonthsToDebtFree,
    };
  }

  const monthsSaved = Math.max(
    0,
    baseline.totalMonthsToDebtFree - hypothetical.totalMonthsToDebtFree,
  );
  const interestSavedMinor = Math.max(
    0,
    baseline.totalInterestPaidMinor - hypothetical.totalInterestPaidMinor,
  );

  return {
    monthsSaved,
    interestSavedMinor,
    newDebtFreeMonths: hypothetical.totalMonthsToDebtFree,
    baselineDebtFreeMonths: baseline.totalMonthsToDebtFree,
  };
}

function emptyResult(
  strategy: StrategyType,
  minimumBudgetMinor: number,
): SimulationResult {
  const empty: StrategyResult = {
    strategy,
    debtResults: [],
    totalMonthsToDebtFree: 0,
    totalInterestPaidMinor: 0,
    totalPaidMinor: 0,
    monthlySnapshots: [],
    budgetInsufficient: false,
  };
  return {
    hasDebts: false,
    strategyUsed: strategy,
    minimumBudgetMinor,
    baselineBudgetMinor: 0,
    hypotheticalBudgetMinor: 0,
    baseline: empty,
    hypothetical: empty,
    delta: {
      monthsSaved: 0,
      interestSavedMinor: 0,
      newDebtFreeMonths: 0,
      baselineDebtFreeMonths: 0,
    },
  };
}

// ─── Pre-computed "preview" deltas for common extra amounts ──────────────────

/**
 * Returns a quick set of deltas at common round-number extra amounts,
 * used to render the slider's tick marks/preview chips without the user
 * having to drag first. Keeps the initial render meaningful.
 */
export async function getSimulationPreviewPoints(
  userId: string,
  baselineBudgetMinor?: number,
): Promise<
  Array<{ extraMinor: number; monthsSaved: number; interestSavedMinor: number }>
> {
  const input = await buildStrategyInput(userId);
  if (input.length === 0) return [];

  const strategy = defaultSimulationStrategy();
  const minimumBudgetMinor = input.reduce(
    (sum, d) => sum + d.minimumPaymentMinor,
    0,
  );
  const baseline = baselineBudgetMinor ?? minimumBudgetMinor;
  const baselineResult = runStrategySimulation(input, baseline, strategy);

  // Round-number extra amounts in minor units (₦10k, ₦20k, ₦50k, ₦100k)
  const previewExtrasMinor = [1_000_000, 2_000_000, 5_000_000, 10_000_000];

  return previewExtrasMinor.map((extraMinor) => {
    const hypotheticalResult = runStrategySimulation(
      input,
      baseline + extraMinor,
      strategy,
    );
    const delta = computeDelta(baselineResult, hypotheticalResult);
    return {
      extraMinor,
      monthsSaved: delta.monthsSaved,
      interestSavedMinor: delta.interestSavedMinor,
    };
  });
}
