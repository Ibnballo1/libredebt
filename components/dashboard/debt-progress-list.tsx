/**
 * components/dashboard/debt-progress-list.tsx
 *
 * Shows each active debt as a compact row with:
 * - Colour-coded left dot (red/amber/green)
 * - Debt name + creditor
 * - Mini progress bar
 * - Current balance
 */

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { DebtBreakdownItem } from "@/server/services/dashboard.service";

type DebtProgressListProps = {
  debts: DebtBreakdownItem[];
  currency: string; // Base user currency fallback if needed
};

// Visual status tracker based on payment fulfillment milestones
function getProgressColor(pct: number): string {
  if (pct >= 75) return "#10B981"; // Green: Substantial completion progress
  if (pct >= 35) return "#F59E0B"; // Amber: Steady payment traction
  return "#64748B"; // Slate: Balanced/New baseline (Replaced anxious flashing red)
}

export function DebtProgressList({ debts }: DebtProgressListProps) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
            Debt breakdown
          </p>
          <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
            {debts.length} active {debts.length === 1 ? "debt" : "debts"}
          </p>
        </div>
        <Link
          href="/debts"
          className="text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Debt rows */}
      {debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          <CreditCard className="h-8 w-8 text-[#E2E8F0] mb-3" />
          <p className="text-sm text-[#94A3B8]">No active debts</p>
        </div>
      ) : (
        <div>
          {debts.map((debt, index) => {
            const color = getProgressColor(debt.progressPercent);
            return (
              <Link
                key={debt.id}
                href={`/debts/${debt.id}`}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:bg-[#F8FAFC]",
                  index < debts.length - 1 && "border-b border-[#F1F5F9]",
                )}
              >
                {/* Status Indicator Dot */}
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ background: color }}
                  aria-hidden="true"
                />

                {/* Name + progress tracking */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-[#0F172A] truncate pr-2">
                      {debt.name}
                    </p>
                    <span
                      className="text-[10px] font-bold tabular-nums flex-shrink-0"
                      style={{ color }}
                    >
                      {debt.progressPercent}%
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${debt.progressPercent}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#94A3B8] mt-1">
                    {debt.creditor}
                    {debt.dueDay ? ` · Due day ${debt.dueDay}` : ""}
                  </p>
                </div>

                {/* Balance Values — ✨ FIXED: Directly targets explicit item currency attributes */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-[#0F172A] tabular-nums">
                    {formatCurrency(debt.currentBalanceMinor, {
                      currency: debt.currency,
                      compact: true,
                    })}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] tabular-nums">
                    of{" "}
                    {formatCurrency(debt.originalAmountMinor, {
                      currency: debt.currency,
                      compact: true,
                    })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
