/**
 * app/(dashboard)/overview/page.tsx — Main Dashboard Overview
 *
 * Secure async Server Component serving as the primary entry checkpoint post-authentication.
 * Dynamically evaluates real-time transactional ledger aggregations directly on the server tier,
 * bypassing client-side fetching bottlenecks and rendering an un-stale ledger balance map.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import { Navbar } from "@/components/layout/navbar";
import { StatCard, EmptyState, DebtLimitBanner } from "@/components/shared";
import { getDashboardStats } from "@/server/services/dashboard.service";
import { FREE_PLAN_DEBT_LIMIT } from "@/server/services/access.service";
import { formatCurrency, calculateProgressPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function OverviewPage() {
  const user = await requireUser();
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  // Fetch unified single-pass aggregated metrics directly via service layer
  const stats = await getDashboardStats(user.id);

  // Fallback protection shielding against division by zero errors on clean states
  const rawProgress = calculateProgressPercent(
    stats.totalOriginalMinor,
    stats.totalCurrentMinor,
  );
  const progressPercent =
    isNaN(rawProgress) || !isFinite(rawProgress) ? 0 : rawProgress;

  const hasDebts = stats.activeDebtCount > 0;
  const capitalizedFirstName = user.name.split(" ")[0];

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* ─── Global Application Shell Header ───────────────────────────────── */}
      <Navbar
        title="Overview"
        description={`Welcome back, ${capitalizedFirstName}`}
        tier={tier}
      />

      {/* ─── Core Metric Layout Matrix ─────────────────────────────────────── */}
      <div className="flex-1 p-6 space-y-6 max-w-5xl w-full mx-auto lg:mx-0">
        {/* Dynamic Debt Threshold Warnings for Free Tier Accounts */}
        {tier === "free" && hasDebts && (
          <DebtLimitBanner
            current={stats.activeDebtCount}
            limit={FREE_PLAN_DEBT_LIMIT}
          />
        )}

        {/* Summary Dashboard Scorecards */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
            Your debt summary
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Debt"
              value={formatCurrency(stats.totalOriginalMinor, {
                currency,
                compact: true,
              })}
              subtext={`across ${stats.activeDebtCount} ${stats.activeDebtCount === 1 ? "debt" : "debts"}`}
              variant="info"
            />
            <StatCard
              label="Amount Repaid"
              value={formatCurrency(stats.totalRepaidMinor, {
                currency,
                compact: true,
              })}
              subtext="total payments recorded"
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
              value={`${progressPercent}%`}
              subtext="of total debt repaid"
              variant="accent"
            />
          </div>
        </div>

        {/* ─── Overall Execution Trajectory ─────────────────────────────────── */}
        {hasDebts && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                Overall repayment progress
              </p>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {progressPercent}% complete
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out dark:bg-emerald-400"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
              <span>
                {formatCurrency(stats.totalRepaidMinor, {
                  currency,
                  compact: true,
                })}{" "}
                repaid
              </span>
              <span>
                {formatCurrency(stats.totalOriginalMinor, {
                  currency,
                  compact: true,
                })}{" "}
                original
              </span>
            </div>
          </div>
        )}

        {/* ─── Zero-State Backup Interface Canvas ───────────────────────────── */}
        {!hasDebts && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <EmptyState
              icon={CreditCard}
              title="No debts tracked yet"
              description="Add your first debt to start tracking your repayment progress. Every payment you record brings you closer to financial freedom."
              action={
                <Link
                  href="/debts/new"
                  className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200 transition-colors shadow-sm"
                >
                  Add your first debt
                </Link>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
