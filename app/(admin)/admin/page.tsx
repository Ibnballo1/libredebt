/**
 * app/(admin)/admin/page.tsx — Admin Overview
 *
 * requireSuperAdmin() already ran in the parent layout — not repeated
 * here, the same way (dashboard) pages trust their layout's
 * requireSession() call.
 */

import type { Metadata } from "next";
import {
  getSystemOverview,
  getSignupGrowth,
} from "@/server/services/admin.service";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { SignupGrowthChart } from "@/components/admin/signup-growth-chart";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const [overview, growth] = await Promise.all([
    getSystemOverview(),
    getSignupGrowth(30),
  ]);

  const conversionRate =
    overview.totalUsers > 0
      ? ((overview.proUsers / overview.totalUsers) * 100).toFixed(1)
      : "0.0";

  return (
    // Removed strict desktop-bound padding ('p-8') and max-width.
    // The AdminShell wrapper now handles structural content spacing fluidly.
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white md:text-2xl">
          System Overview
        </h1>
        <p className="text-xs text-[#64748B] mt-1 md:text-sm">
          Read-only — observability across all users and accounts
        </p>
      </div>

      {/* Group 1 Metrics Card Block */}
      {/* Handled reflow natively: grid-cols-1 on mobile, grid-cols-2 on small devices (sm:), grid-cols-4 on desktops (lg:) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Total users"
          value={overview.totalUsers.toLocaleString()}
          sub={`+${overview.newUsersLast7Days} this week`}
        />
        <AdminStatCard
          label="Pro subscribers"
          value={overview.proUsers.toLocaleString()}
          sub={`${conversionRate}% conversion`}
          accent="amber"
        />
        <AdminStatCard
          label="Est. MRR"
          value={formatCurrency(overview.mrrEstimateMinor, {
            currency: "NGN",
            compact: true,
          })}
          sub="based on active Pro subs"
          accent="emerald"
        />
        <AdminStatCard
          label="New signups (30d)"
          value={overview.newUsersLast30Days.toLocaleString()}
          sub={`${overview.newUsersLast7Days} in last 7 days`}
        />
      </div>

      {/* Group 2 Financial Indicators Block */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Active debts"
          value={overview.totalActiveDebts.toLocaleString()}
          sub={`${overview.totalArchivedDebts.toLocaleString()} archived`}
        />
        <AdminStatCard
          label="Total debt tracked"
          value={formatCurrency(overview.totalOriginalDebtMinor, {
            currency: "NGN",
            compact: true,
          })}
          sub="across all active debts"
        />
        <AdminStatCard
          label="Outstanding now"
          value={formatCurrency(overview.totalCurrentOutstandingMinor, {
            currency: "NGN",
            compact: true,
          })}
          sub="system-wide current balance"
        />
        <AdminStatCard
          label="Total repaid"
          value={formatCurrency(overview.totalAmountRepaidMinor, {
            currency: "NGN",
            compact: true,
          })}
          sub={`${overview.totalPaymentsRecorded.toLocaleString()} payments recorded`}
          accent="emerald"
        />
      </div>

      {/* Overflow wrapper protects the chart container block from container blowouts on mobile screens */}
      <div className="w-full overflow-x-auto rounded-xl border border-[#1E2530] bg-[#0E131F] p-1">
        <SignupGrowthChart data={growth} />
      </div>
    </div>
  );
}
