/**
 * server/services/strategy.calculator.ts
 *
 * PURE CALCULATION ENGINE — no database, no I/O, no side effects.
 *
 * This is the single most important file in Stage 3. It takes a snapshot
 * of debts and a monthly budget, and deterministically computes a full
 * payoff plan: which debt to pay first, how many months until each debt
 * (and all debts) reach zero, and total interest paid.
 *
 * WHY PURE FUNCTIONS?
 * 1. Testable in isolation — no mocking a database
 * 2. Safe to run repeatedly for "what-if" simulations (Stage 4)
 *    without ever touching real data
 * 3. The same engine powers both Snowball and Avalanche —
 *    only the sort comparator changes
 *
 * THE ALGORITHM (both strategies):
 *   1. Sort debts by the strategy's comparator
 *      Snowball:  ascending balance (smallest first)
 *      Avalanche: descending interest rate (highest first)
 *   2. Each month:
 *      a. Apply interest to every debt's balance
 *      b. Pay the minimum payment on every debt
 *      c. Take whatever budget remains after minimums and throw it
 *         entirely at the FIRST debt in the sorted order that still
 *         has a balance > 0
 *      d. When a debt reaches 0, its minimum payment amount is freed up
 *         and added to the extra budget for the NEXT month — this is
 *         the "snowball" / "avalanche" rolling effect
 *   3. Repeat until all debts reach 0, or a safety cap of 600 months
 *      (50 years) is hit — prevents an infinite loop if the budget is
 *      too small to ever pay off the debts (interest exceeds payments)
 *
 * MONETARY UNITS:
 * All amounts are integer minor units (kobo/cents) throughout, exactly
 * like the rest of the application. No floating point arithmetic.
 *
 * INTEREST MODEL:
 * Interest accrues monthly using a simple monthly rate derived from the
 * annual rate stored in basis points:
 *   monthlyRate = annualRateBps / 12 / 10000
 * This is a simplification (real loans may compound daily), but it is
 * consistent, transparent, and good enough for payoff strategy guidance —
 * not for legal/financial loan servicing.
 */

export type StrategyDebtInput = {
  id: string;
  name: string;
  currentBalanceMinor: number;
  minimumPaymentMinor: number;
  interestRateBps: number;
};

export type StrategyType = "snowball" | "avalanche";

export type MonthlySnapshot = {
  month: number; // 1-indexed
  totalBalanceMinor: number;
  /** Per-debt balance at the end of this month */
  debtBalances: Record<string, number>;
};

export type DebtPayoffResult = {
  debtId: string;
  debtName: string;
  payoffOrder: number; // 1 = paid off first
  monthsToPayoff: number;
  totalInterestPaidMinor: number;
  totalPaidMinor: number;
};

export type StrategyResult = {
  strategy: StrategyType;
  /** Per-debt results, in the order they get paid off */
  debtResults: DebtPayoffResult[];
  /** Total months until ALL debts reach zero */
  totalMonthsToDebtFree: number;
  /** Sum of all interest paid across all debts over the full payoff period */
  totalInterestPaidMinor: number;
  /** Sum of all minimum payments + extra budget paid over the full period */
  totalPaidMinor: number;
  /** Month-by-month snapshots, for charting (Stage 4/5) */
  monthlySnapshots: MonthlySnapshot[];
  /** True if the safety cap was hit — budget is insufficient to ever pay off */
  budgetInsufficient: boolean;
};

/** Safety cap: 50 years. Prevents infinite loops with insufficient budgets. */
const MAX_MONTHS = 600;

/**
 * Converts annual basis points to a monthly decimal interest rate.
 * 2400 bps (24% p.a.) → 0.02 (2% per month, simplified)
 */
function monthlyRateFromBps(annualRateBps: number): number {
  return annualRateBps / 12 / 10000;
}

/**
 * Sorts debts according to the chosen strategy.
 * Returns a NEW array — never mutates the input.
 */
function sortDebtsByStrategy(
  debts: StrategyDebtInput[],
  strategy: StrategyType,
): StrategyDebtInput[] {
  const copy = [...debts];

  if (strategy === "snowball") {
    // Smallest balance first
    return copy.sort((a, b) => a.currentBalanceMinor - b.currentBalanceMinor);
  }

  // Avalanche: highest interest rate first.
  // Tie-break by smallest balance first (matches Snowball logic for ties,
  // and gives a sensible default when two debts share the same rate).
  return copy.sort((a, b) => {
    if (b.interestRateBps !== a.interestRateBps) {
      return b.interestRateBps - a.interestRateBps;
    }
    return a.currentBalanceMinor - b.currentBalanceMinor;
  });
}

/**
 * Runs the full payoff simulation for a given strategy.
 *
 * @param debts            Active debts with current balance, minimum payment, rate
 * @param monthlyBudget     Total amount available per month across ALL debts
 *                          (must be >= sum of all minimum payments, or the
 *                          simulation returns budgetInsufficient: true immediately)
 * @param strategy          "snowball" | "avalanche"
 */
export function runStrategySimulation(
  debts: StrategyDebtInput[],
  monthlyBudgetMinor: number,
  strategy: StrategyType,
): StrategyResult {
  const sortedDebts = sortDebtsByStrategy(debts, strategy);

  const totalMinimums = debts.reduce(
    (sum, d) => sum + d.minimumPaymentMinor,
    0,
  );

  // If the budget can't even cover minimum payments, payoff is impossible.
  if (monthlyBudgetMinor < totalMinimums) {
    return {
      strategy,
      debtResults: [],
      totalMonthsToDebtFree: 0,
      totalInterestPaidMinor: 0,
      totalPaidMinor: 0,
      monthlySnapshots: [],
      budgetInsufficient: true,
    };
  }

  // Mutable working state for the simulation only (not the input data)
  const balances = new Map<string, number>(
    sortedDebts.map((d) => [d.id, d.currentBalanceMinor]),
  );
  const minimums = new Map<string, number>(
    sortedDebts.map((d) => [d.id, d.minimumPaymentMinor]),
  );
  const rates = new Map<string, number>(
    sortedDebts.map((d) => [d.id, monthlyRateFromBps(d.interestRateBps)]),
  );

  const interestPaid = new Map<string, number>(
    sortedDebts.map((d) => [d.id, 0]),
  );
  const totalPaidPerDebt = new Map<string, number>(
    sortedDebts.map((d) => [d.id, 0]),
  );
  const payoffMonth = new Map<string, number>(); // filled in as debts reach 0

  const monthlySnapshots: MonthlySnapshot[] = [];

  let month = 0;
  let remainingDebtIds = sortedDebts.map((d) => d.id);

  while (remainingDebtIds.length > 0 && month < MAX_MONTHS) {
    month++;

    // ── Step 1: accrue interest on every remaining debt ──────────────────
    for (const id of remainingDebtIds) {
      const balance = balances.get(id)!;
      const rate = rates.get(id)!;
      const interest = Math.round(balance * rate);
      balances.set(id, balance + interest);
      interestPaid.set(id, interestPaid.get(id)! + interest);
    }

    // ── Step 2: pay minimums on every remaining debt ──────────────────────
    // Freed-up minimums from already-paid-off debts get redirected as
    // extra budget — this is the snowball/avalanche rolling effect.
    let extraBudget =
      monthlyBudgetMinor -
      remainingDebtIds.reduce((sum, id) => sum + minimums.get(id)!, 0);

    for (const id of remainingDebtIds) {
      const balance = balances.get(id)!;
      const minPayment = Math.min(minimums.get(id)!, balance);
      balances.set(id, balance - minPayment);
      totalPaidPerDebt.set(id, totalPaidPerDebt.get(id)! + minPayment);
    }

    // ── Step 3: apply ALL extra budget to the first debt in sort order ────
    // (sortedDebts order is fixed; remainingDebtIds preserves that order
    // since we only ever remove from it, never reorder)
    for (const id of remainingDebtIds) {
      if (extraBudget <= 0) break;
      const balance = balances.get(id)!;
      if (balance <= 0) continue;

      const extraPayment = Math.min(extraBudget, balance);
      balances.set(id, balance - extraPayment);
      totalPaidPerDebt.set(id, totalPaidPerDebt.get(id)! + extraPayment);
      extraBudget -= extraPayment;
    }

    // ── Step 4: record payoffs and remove zeroed debts ────────────────────
    const stillRemaining: string[] = [];
    for (const id of remainingDebtIds) {
      const balance = balances.get(id)!;
      if (balance <= 0) {
        balances.set(id, 0);
        if (!payoffMonth.has(id)) payoffMonth.set(id, month);
      } else {
        stillRemaining.push(id);
      }
    }
    remainingDebtIds = stillRemaining;

    // ── Step 5: snapshot this month ────────────────────────────────────────
    const debtBalances: Record<string, number> = {};
    for (const d of sortedDebts) {
      debtBalances[d.id] = balances.get(d.id) ?? 0;
    }
    const totalBalanceMinor = Object.values(debtBalances).reduce(
      (a, b) => a + b,
      0,
    );
    monthlySnapshots.push({ month, totalBalanceMinor, debtBalances });
  }

  const budgetInsufficient = remainingDebtIds.length > 0; // hit MAX_MONTHS cap

  // ── Build per-debt results, ordered by payoff order ─────────────────────
  const debtResults: DebtPayoffResult[] = sortedDebts
    .map((d) => ({
      debtId: d.id,
      debtName: d.name,
      monthsToPayoff: payoffMonth.get(d.id) ?? month,
      totalInterestPaidMinor: interestPaid.get(d.id) ?? 0,
      totalPaidMinor: totalPaidPerDebt.get(d.id) ?? 0,
    }))
    .sort((a, b) => a.monthsToPayoff - b.monthsToPayoff)
    .map((result, index) => ({ ...result, payoffOrder: index + 1 }));

  const totalInterestPaidMinor = debtResults.reduce(
    (sum, d) => sum + d.totalInterestPaidMinor,
    0,
  );
  const totalPaidMinor = debtResults.reduce(
    (sum, d) => sum + d.totalPaidMinor,
    0,
  );

  return {
    strategy,
    debtResults,
    totalMonthsToDebtFree: month,
    totalInterestPaidMinor,
    totalPaidMinor,
    monthlySnapshots,
    budgetInsufficient,
  };
}

/**
 * Convenience: runs both strategies and returns them side by side
 * for the comparison UI.
 */
export function compareStrategies(
  debts: StrategyDebtInput[],
  monthlyBudgetMinor: number,
): { snowball: StrategyResult; avalanche: StrategyResult } {
  return {
    snowball: runStrategySimulation(debts, monthlyBudgetMinor, "snowball"),
    avalanche: runStrategySimulation(debts, monthlyBudgetMinor, "avalanche"),
  };
}

/**
 * Computes the debt-free calendar date given a number of months from now.
 */
export function monthsToDateLabel(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}
