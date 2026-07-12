/**
 * app/(admin)/admin/page.tsx — Admin Overview (ENHANCED)
 *
 * Replaces the original single-section overview with the full set:
 *   1. Top-line metrics (users, pro, MRR, signups)
 *   2. Debt portfolio metrics
 *   3. Business metrics (churn risk, receivables, avg debts)
 *   4. Engagement metrics (active vs ghost, velocity)
 *   5. Strategy distribution
 *   6. System health (DB row count, currency breakdown)
 *   7. Signup growth chart (30d)
 *   8. Webhook / payment event log
 */

import type { Metadata } from "next";
import {
  getSystemOverview,
  getSignupGrowth,
  getBusinessMetrics,
  getEngagementMetrics,
  getStrategyDistribution,
  getSystemHealth,
  getWebhookEventLog,
} from "@/server/services/admin.service";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminMetricSection } from "@/components/admin/admin-metric-section";
import { SignupGrowthChart } from "@/components/admin/signup-growth-chart";
import { BusinessMetricsPanel } from "@/components/admin/business-metrics";
import { EngagementMetricsPanel } from "@/components/admin/engagement-metrics";
import { StrategyDistributionPanel } from "@/components/admin/strategy-distribution";
import { SystemHealthPanel } from "@/components/admin/system-health";
import { WebhookEventLog } from "@/components/admin/webhook-event-log";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const [overview, growth, business, engagement, strategy, health, webhookLog] =
    await Promise.all([
      getSystemOverview(),
      getSignupGrowth(30),
      getBusinessMetrics(),
      getEngagementMetrics(),
      getStrategyDistribution(),
      getSystemHealth(),
      getWebhookEventLog(20),
    ]);

  const conversionRate =
    overview.totalUsers > 0
      ? ((overview.proUsers / overview.totalUsers) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="p-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">System Overview</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Read-only observability across all users and accounts
        </p>
      </div>

      {/* 1. Top-line: Users & Revenue */}
      <AdminMetricSection label="Users & Revenue">
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
      </AdminMetricSection>

      {/* 2. Debt portfolio */}
      <AdminMetricSection label="Debt Portfolio">
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
      </AdminMetricSection>

      {/* 3. Business metrics */}
      <BusinessMetricsPanel metrics={business} />

      {/* 4. Engagement metrics */}
      <EngagementMetricsPanel metrics={engagement} />

      {/* 5. Strategy distribution */}
      <div className="space-y-3">
        <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569]">
          Strategy Adoption
        </p>
        <StrategyDistributionPanel data={strategy} />
      </div>

      {/* 6. Signup growth chart */}
      <SignupGrowthChart data={growth} />

      {/* 7. System health */}
      <div className="space-y-3">
        <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569]">
          System Health
        </p>
        <SystemHealthPanel health={health} />
      </div>

      {/* 8. Webhook / payment event log */}
      <WebhookEventLog events={webhookLog} />
    </div>
  );
}
