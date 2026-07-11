/**
 * components/admin/engagement-metrics.tsx
 * Engagement & Activity metrics panel.
 */

import type { EngagementMetrics } from "@/server/services/admin.service";
import { AdminStatCard } from "./admin-stat-card";
import { AdminMetricSection } from "./admin-metric-section";

export function EngagementMetricsPanel({
  metrics,
}: {
  metrics: EngagementMetrics;
}) {
  return (
    <AdminMetricSection label="Engagement & Activity">
      <AdminStatCard
        label="Active users (30d)"
        value={metrics.activeUsersLast30Days.toLocaleString()}
        sub="logged at least one entry"
        accent="emerald"
      />
      <AdminStatCard
        label="Ghost users"
        value={metrics.ghostUsers.toLocaleString()}
        sub={`${metrics.ghostPercent}% of total — no activity in 30d`}
        accent={metrics.ghostPercent > 50 ? "amber" : "default"}
      />
      <AdminStatCard
        label="Payments today"
        value={metrics.paymentsToday.toLocaleString()}
        sub={`${metrics.paymentsThisWeek.toLocaleString()} this week`}
        accent="emerald"
      />
      <AdminStatCard
        label="Debts added today"
        value={metrics.debtsAddedToday.toLocaleString()}
        sub={`${metrics.debtsAddedThisWeek.toLocaleString()} this week`}
      />
    </AdminMetricSection>
  );
}
