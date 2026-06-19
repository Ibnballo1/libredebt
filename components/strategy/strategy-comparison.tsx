/**
 * components/strategy/strategy-comparison.tsx
 *
 * The core interactive UI for Stage 3.
 *
 * Shows Snowball vs Avalanche side by side:
 *   - Total months to debt-free
 *   - Total interest paid
 *   - Debt-free date
 *   - Payoff order (which debt gets paid first, second, etc.)
 *
 * A budget input lets the user adjust their monthly payment amount —
 * re-running the comparison live via the Server Action (no full page reload).
 *
 * Committing to a strategy persists strategyOrder on the debts table.
 */

"use client";

import { useState, useTransition } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Zap, TrendingDown, Info, Check } from "lucide-react";
import {
  runStrategyComparisonAction,
  commitStrategyAction,
} from "@/server/actions/strategy.actions";
import type { StrategyComparisonResult } from "@/server/services/strategy.service";
import type { StrategyType } from "@/server/services/strategy.calculator";
import { formatCurrency, fromMinorUnits, toMinorUnits, cn } from "@/lib/utils";

type StrategyComparisonProps = {
  initialComparison: StrategyComparisonResult;
  currency: string;
};

export function StrategyComparison({
  initialComparison,
  currency,
}: StrategyComparisonProps) {
  const [comparison, setComparison] = useState(initialComparison);
  const [budgetInput, setBudgetInput] = useState(
    fromMinorUnits(initialComparison.suggestedBudgetMinor),
  );
  const [isPending, startTransition] = useTransition();

  const { execute: runComparison, isPending: isCalculating } = useAction(
    runStrategyComparisonAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success && data.comparison) {
          setComparison(data.comparison);
        } else {
          toast.error(data?.error ?? "Failed to recalculate");
        }
      },
    },
  );

  const { execute: commit, isPending: isCommitting } = useAction(
    commitStrategyAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Strategy committed", {
            description: "Your payoff order is now active across LibreDebt.",
          });
        } else {
          toast.error(data?.error ?? "Failed to commit strategy");
        }
      },
    },
  );

  function handleBudgetBlur() {
    const minBudget = fromMinorUnits(comparison.minimumBudgetMinor);
    const entered = parseFloat(budgetInput);
    if (isNaN(entered) || entered < parseFloat(minBudget)) {
      toast.error("Budget too low", {
        description: `Your minimum monthly budget is ${formatCurrency(comparison.minimumBudgetMinor, { currency })} to cover all minimum payments.`,
      });
      setBudgetInput(minBudget);
      runComparison({ monthlyBudget: minBudget });
      return;
    }
    runComparison({ monthlyBudget: budgetInput });
  }

  function handleCommit(strategy: StrategyType) {
    commit({ strategy, monthlyBudget: budgetInput });
  }

  return (
    <div className="space-y-6">
      {/* Budget input */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-1">
              Monthly budget
            </p>
            <p className="text-xs text-[#64748B]">
              Total you can put toward debt repayment each month
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8]">
                {currency === "NGN" ? "₦" : "$"}
              </span>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onBlur={handleBudgetBlur}
                disabled={isCalculating}
                className="w-40 rounded-lg border border-[#E2E8F0] pl-7 pr-3 py-2 text-sm font-semibold text-[#0F172A] tabular-nums outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-colors"
              />
            </div>
            {isCalculating && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#10B981]" />
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
          <Info className="h-3 w-3 flex-shrink-0" />
          Minimum required:{" "}
          {formatCurrency(comparison.minimumBudgetMinor, { currency })}/mo to
          cover all minimum payments
        </div>
      </div>

      {/* Comparison cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StrategyCard
          title="Debt Snowball"
          subtitle="Smallest balance first"
          icon={Zap}
          accentColor="#10B981"
          result={comparison.snowball}
          currency={currency}
          onCommit={() => handleCommit("snowball")}
          isCommitting={isCommitting}
          highlight={
            comparison.snowball.totalMonthsToDebtFree <=
            comparison.avalanche.totalMonthsToDebtFree
              ? "Pays off first debt fastest"
              : undefined
          }
        />
        <StrategyCard
          title="Debt Avalanche"
          subtitle="Highest interest first"
          icon={TrendingDown}
          accentColor="#38BDF8"
          result={comparison.avalanche}
          currency={currency}
          onCommit={() => handleCommit("avalanche")}
          isCommitting={isCommitting}
          highlight={
            comparison.avalanche.totalInterestPaidMinor <=
            comparison.snowball.totalInterestPaidMinor
              ? "Saves the most interest"
              : undefined
          }
        />
      </div>

      {/* Comparison summary */}
      <ComparisonSummary comparison={comparison} currency={currency} />
    </div>
  );
}

// ─── Strategy Card ────────────────────────────────────────────────────────────

function StrategyCard({
  title,
  subtitle,
  icon: Icon,
  accentColor,
  result,
  currency,
  onCommit,
  isCommitting,
  highlight,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  result: StrategyComparisonResult["snowball"];
  currency: string;
  onCommit: () => void;
  isCommitting: boolean;
  highlight?: string;
}) {
  if (result.budgetInsufficient) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold text-amber-800">
          Budget insufficient for {title}
        </p>
        <p className="text-xs text-amber-700 mt-1">
          At this budget, interest may exceed payments. Increase your monthly
          budget to see a payoff plan.
        </p>
      </div>
    );
  }

  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + result.totalMonthsToDebtFree);
  const dateLabel = debtFreeDate.toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden"
      style={{ borderTopWidth: 3, borderTopColor: accentColor }}
    >
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `${accentColor}15` }}
            >
              <Icon className="h-4 w-4" style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F172A]">{title}</p>
              <p className="text-[10px] text-[#94A3B8]">{subtitle}</p>
            </div>
          </div>
          {highlight && (
            <span
              className="text-[9px] font-bold tracking-wide uppercase rounded px-2 py-1"
              style={{ background: `${accentColor}15`, color: accentColor }}
            >
              {highlight}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px bg-[#F1F5F9]">
        <div className="bg-white p-4">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#94A3B8] mb-1">
            Debt-free in
          </p>
          <p className="text-lg font-bold text-[#0F172A] tabular-nums">
            {result.totalMonthsToDebtFree} mo
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">{dateLabel}</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#94A3B8] mb-1">
            Total interest
          </p>
          <p className="text-lg font-bold text-[#0F172A] tabular-nums">
            {formatCurrency(result.totalInterestPaidMinor, {
              currency,
              compact: true,
            })}
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">over full payoff</p>
        </div>
      </div>

      {/* Payoff order */}
      <div className="px-5 py-4">
        <p className="text-[9px] font-bold tracking-widest uppercase text-[#94A3B8] mb-3">
          Payoff order
        </p>
        <div className="space-y-2">
          {result.debtResults.map((debt) => (
            <div key={debt.debtId} className="flex items-center gap-3">
              <span
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  background: debt.payoffOrder === 1 ? accentColor : "#F1F5F9",
                  color: debt.payoffOrder === 1 ? "white" : "#94A3B8",
                }}
              >
                {debt.payoffOrder}
              </span>
              <span className="flex-1 text-xs font-medium text-[#0F172A] truncate">
                {debt.debtName}
              </span>
              <span className="text-[10px] text-[#94A3B8] tabular-nums flex-shrink-0">
                {debt.monthsToPayoff} mo
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Commit button */}
      <div className="px-5 pb-5">
        <button
          onClick={onCommit}
          disabled={isCommitting}
          className={cn(
            "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all",
            "flex items-center justify-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          style={{ background: accentColor }}
        >
          {isCommitting ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Committing…
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Commit to {title}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Comparison Summary ───────────────────────────────────────────────────────

function ComparisonSummary({
  comparison,
  currency,
}: {
  comparison: StrategyComparisonResult;
  currency: string;
}) {
  const { snowball, avalanche } = comparison;

  if (snowball.budgetInsufficient || avalanche.budgetInsufficient) {
    return null;
  }

  const interestDiff = Math.abs(
    snowball.totalInterestPaidMinor - avalanche.totalInterestPaidMinor,
  );
  const monthsDiff = Math.abs(
    snowball.totalMonthsToDebtFree - avalanche.totalMonthsToDebtFree,
  );
  const avalancheWinsInterest =
    avalanche.totalInterestPaidMinor < snowball.totalInterestPaidMinor;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
      <p className="text-sm text-[#475569] leading-relaxed">
        {interestDiff > 0 ? (
          <>
            <strong className="text-[#0F172A]">
              {avalancheWinsInterest ? "Avalanche" : "Snowball"}
            </strong>{" "}
            saves you{" "}
            <strong className="text-[#10B981]">
              {formatCurrency(interestDiff, { currency, compact: true })}
            </strong>{" "}
            in interest compared to the other strategy.
          </>
        ) : (
          "Both strategies result in the same total interest paid."
        )}
        {monthsDiff > 0 && (
          <>
            {" "}
            The faster strategy reaches debt-free{" "}
            <strong className="text-[#0F172A]">
              {monthsDiff} month{monthsDiff === 1 ? "" : "s"}
            </strong>{" "}
            sooner.
          </>
        )}
      </p>
    </div>
  );
}
