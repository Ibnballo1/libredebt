/**
 * app/(dashboard)/overview/page.tsx — Main Dashboard
 */

import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import { getDashboardStats } from "@/server/services/dashboard.service";
import { FREE_PLAN_DEBT_LIMIT } from "@/server/services/access.service";
import { Navbar } from "@/components/layout/navbar";
import { StatCard, EmptyState, DebtLimitBanner } from "@/components/shared";
import { DebtProgressList } from "@/components/dashboard/debt-progress-list";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { formatCurrency, calculateProgressPercent } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const user = await requireUser();
  if (!user) {
    notFound();
  }
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  const stats = await getDashboardStats(user.id);

  const overallProgress = calculateProgressPercent(
    stats.totalOriginalMinor,
    stats.totalCurrentMinor,
  );

  const hasDebts = stats.activeDebtCount > 0;
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <div className="flex flex-col flex-1">
      <Navbar
        title="Overview"
        description={`Welcome back, ${firstName}`}
        tier={tier}
        actions={
          hasDebts &&
          (tier === "pro" || stats.activeDebtCount < FREE_PLAN_DEBT_LIMIT) ? (
            <Link
              href="/debts/new"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add Debt
            </Link>
          ) : null
        }
      />

      <div className="flex-1 p-6 max-w-5xl">
        <div className="space-y-6">
          {/* ── Debt limit banner ── */}
          {tier === "free" && hasDebts && (
            <DebtLimitBanner
              current={stats.activeDebtCount}
              limit={FREE_PLAN_DEBT_LIMIT}
            />
          )}

          {hasDebts ? (
            <>
              {/* ── Stat cards ── */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-3">
                  Your debt summary
                </p>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard
                    label="Total Debt"
                    value={formatCurrency(stats.totalOriginalMinor, {
                      currency,
                      compact: true,
                    })}
                    subtext={`${stats.activeDebtCount} ${stats.activeDebtCount === 1 ? "debt" : "debts"}`}
                    variant="info"
                  />
                  <StatCard
                    label="Amount Repaid"
                    value={formatCurrency(stats.totalRepaidMinor, {
                      currency,
                      compact: true,
                    })}
                    subtext="total paid so far"
                    variant="default"
                  />
                  <StatCard
                    label="Remaining"
                    value={formatCurrency(stats.totalCurrentMinor, {
                      currency,
                      compact: true,
                    })}
                    subtext="still outstanding"
                    variant="warning"
                  />
                  <StatCard
                    label="Progress"
                    value={`${overallProgress}%`}
                    subtext="of total debt repaid"
                    variant="accent"
                  />
                </div>
              </div>

              {/* ── Overall progress bar ── */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
                    Overall repayment progress
                  </p>
                  <span className="text-xs font-bold text-[#10B981] tabular-nums">
                    {overallProgress}% complete
                  </span>
                </div>
                <div
                  className="h-2.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden"
                  role="progressbar"
                  aria-valuenow={overallProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${overallProgress}% of total debt repaid`}
                >
                  <div
                    className="h-full rounded-full bg-[#10B981] transition-all duration-700 ease-out"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-[#94A3B8] tabular-nums">
                    {formatCurrency(stats.totalRepaidMinor, {
                      currency,
                      compact: true,
                    })}{" "}
                    repaid
                  </span>
                  <span className="text-[10px] text-[#94A3B8] tabular-nums">
                    {formatCurrency(stats.totalOriginalMinor, {
                      currency,
                      compact: true,
                    })}{" "}
                    original
                  </span>
                </div>
              </div>

              {/* ── Two-column: debt breakdown + recent activity ── */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <DebtProgressList
                  debts={stats.debtBreakdown}
                  currency={currency}
                />
                <RecentActivityFeed
                  payments={stats.recentPayments}
                  // currency={currency}
                />
              </div>
            </>
          ) : (
            /* ── Empty state ── */
            <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
              <EmptyState
                icon={CreditCard}
                title="No debts tracked yet"
                description="Add your first debt to start tracking your repayment progress. Every payment you record brings you closer to financial freedom."
                action={
                  <Link
                    href="/debts/new"
                    className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add your first debt
                  </Link>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
