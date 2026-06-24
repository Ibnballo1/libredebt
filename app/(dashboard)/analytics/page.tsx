/**
 * app/(dashboard)/analytics/page.tsx — Analytics Page
 *
 * The final Pro feature before billing integration.
 * Three charts, all reading from existing data (ledger + Stage 3 engine):
 *   1. Monthly repayment trend (bar)
 *   2. Per-debt balance trend (multi-line)
 *   3. Payoff projection (area, with debt-free marker)
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, BarChart3, CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import {
  getMonthlyRepaymentTrend,
  getDebtBalanceTrend,
  getPayoffProjection,
} from "@/server/services/analytics.service";
import { Navbar } from "@/components/layout/navbar";
import { EmptyState } from "@/components/shared";
import { RepaymentTrendChart } from "@/components/analytics/repayment-trend-chart";
import { BalanceTrendChart } from "@/components/analytics/balance-trend-chart";
import { PayoffProjectionChart } from "@/components/analytics/payoff-projection-chart";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requireUser();
  if (!user) {
    redirect("/login"); // ✅ ONLY place redirect happens
  }
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  if (tier === "free") {
    return <FreeUpgradeGate />;
  }

  const [repaymentTrend, balanceTrend, projection] = await Promise.all([
    getMonthlyRepaymentTrend(user.id, 6),
    getDebtBalanceTrend(user.id, 6),
    getPayoffProjection(user.id),
  ]);

  const hasDebts = balanceTrend.length > 0;

  return (
    <div className="flex flex-col flex-1">
      <Navbar
        title="Analytics"
        description="Visualize your repayment progress over time"
        tier={tier}
      />

      <div className="flex-1 p-6 max-w-5xl space-y-6">
        {!hasDebts ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <EmptyState
              icon={CreditCard}
              title="No active debts to analyze"
              description="Add at least one debt and record a few payments to see your analytics."
              action={
                <Link
                  href="/debts/new"
                  className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors"
                >
                  Add a debt
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <RepaymentTrendChart data={repaymentTrend} currency={currency} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <BalanceTrendChart series={balanceTrend} currency={currency} />
              <PayoffProjectionChart
                points={projection.points}
                totalMonths={projection.totalMonths}
                currency={currency}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Free plan gate ───────────────────────────────────────────────────────────

function FreeUpgradeGate() {
  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Analytics" tier="free" />
      <div className="flex-1 p-6 flex items-start justify-center">
        <div className="max-w-lg w-full mt-8">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/10 mx-auto mb-5">
              <BarChart3
                className="h-5 w-5 text-[#10B981]"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
              See your progress, not just your balance
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
              Visualize your monthly repayment trends, watch each debt&apos;s
              balance decline over time, and see your projected debt-free date
              charted out month by month.
            </p>
            <Link
              href="/settings?tab=billing"
              className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
