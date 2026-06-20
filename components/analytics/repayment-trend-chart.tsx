/**
 * components/analytics/repayment-trend-chart.tsx
 *
 * Bar chart: total amount paid per calendar month, last 6 months.
 * Uses Apache ECharts (echarts-for-react), as specified in the brief.
 *
 * DESIGN: Bars use the brand emerald. Empty months still show a (very
 * faint) bar outline so the absence of a payment is visible, not hidden.
 */

"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { MonthlyRepaymentPoint } from "@/server/services/analytics.service";
import { formatCurrency } from "@/lib/utils";

type RepaymentTrendChartProps = {
  data: MonthlyRepaymentPoint[];
  currency: string;
};

export function RepaymentTrendChart({
  data,
  currency,
}: RepaymentTrendChartProps) {
  const option = useMemo(
    () => ({
      grid: { left: 56, right: 16, top: 24, bottom: 32 },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "#0F172A",
        borderWidth: 0,
        textStyle: { color: "#F8FAFC", fontSize: 12 },
        formatter: (params: { axisValue: string; value: number }[]) => {
          const p = params[0];
          if (!p) return "";
          return `${p.axisValue}<br/><strong>${formatCurrency(p.value, { currency })}</strong>`;
        },
      },
      xAxis: {
        type: "category" as const,
        data: data.map((d) => d.monthLabel),
        axisLine: { lineStyle: { color: "#E2E8F0" } },
        axisTick: { show: false },
        axisLabel: { color: "#94A3B8", fontSize: 11, fontFamily: "Inter" },
      },
      yAxis: {
        type: "value" as const,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "#F1F5F9" } },
        axisLabel: {
          color: "#94A3B8",
          fontSize: 10,
          fontFamily: "monospace",
          formatter: (value: number) =>
            value === 0
              ? "0"
              : formatCurrency(value, { currency, compact: true }),
        },
      },
      series: [
        {
          type: "bar" as const,
          data: data.map((d) => d.totalPaidMinor),
          itemStyle: {
            color: "#10B981",
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: { color: "#059669" },
          },
          barMaxWidth: 36,
        },
      ],
    }),
    [data, currency],
  );

  const totalPaid = data.reduce((sum, d) => sum + d.totalPaidMinor, 0);
  const hasAnyPayments = totalPaid > 0;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
            Monthly repayment trend
          </p>
          <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
            Last {data.length} months
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#94A3B8]">Total paid</p>
          <p className="text-sm font-bold text-[#10B981] tabular-nums">
            {formatCurrency(totalPaid, { currency, compact: true })}
          </p>
        </div>
      </div>

      {hasAnyPayments ? (
        <ReactECharts
          option={option}
          style={{ height: 220 }}
          opts={{ renderer: "svg" }}
        />
      ) : (
        <div className="flex items-center justify-center h-[220px] text-sm text-[#94A3B8]">
          No payments recorded in this period
        </div>
      )}
    </div>
  );
}
