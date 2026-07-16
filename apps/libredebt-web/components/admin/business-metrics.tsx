/**
 * components/admin/business-metrics.tsx
 * Business & Revenue metrics panel.
 */

import type { BusinessMetrics } from "@/server/services/admin.service";
import { AdminStatCard } from "./admin-stat-card";
import { AdminMetricSection } from "./admin-metric-section";
import { formatCurrency } from "@/lib/utils";

export function BusinessMetricsPanel({
  metrics,
}: {
  metrics: BusinessMetrics;
}) {
  return (
    <AdminMetricSection label="Business & Revenue">
      <AdminStatCard
        label="Avg debts / user"
        value={metrics.avgDebtsPerUser.toFixed(1)}
        sub="active debts per account"
      />
      <AdminStatCard
        label="Active receivables"
        value={metrics.totalActiveReceivables.toLocaleString()}
        sub={
          formatCurrency(metrics.totalReceivablesMinor, {
            currency: "NGN",
            compact: true,
          }) + " outstanding"
        }
        accent="emerald"
      />
      <AdminStatCard
        label="Churn risk (30d)"
        value={metrics.subsExpiringIn30Days.toLocaleString()}
        sub="subscriptions expiring"
        accent={metrics.subsExpiringIn30Days > 5 ? "amber" : "default"}
      />
      <AdminStatCard
        label="Urgent churn (7d)"
        value={metrics.subsExpiringIn7Days.toLocaleString()}
        sub="expiring this week"
        accent={metrics.subsExpiringIn7Days > 0 ? "amber" : "default"}
      />
    </AdminMetricSection>
  );
}
