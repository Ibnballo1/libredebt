/**
 * components/analytics/balance-trend-chart.tsx
 *
 * Multi-line chart: one line per debt, showing its balance decline
 * over the last 6 months.
 *
 * COLOR ASSIGNMENT: cycles through the brand chart palette defined in
 * globals.css (--color-chart-1 through --color-chart-5) so colors stay
 * consistent with the rest of the app's design tokens.
 */

"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { DebtBalanceTrendSeries } from "@/server/services/analytics.service";
import { formatCurrency } from "@/lib/utils";

type BalanceTrendChartProps = {
  series: DebtBalanceTrendSeries[];
  currency: string;
};

const CHART_COLORS = ["#10B981", "#38BDF8", "#8B5CF6", "#F59E0B", "#EF4444"];

export function BalanceTrendChart({
  series,
  currency,
}: BalanceTrendChartProps) {
  const monthLabels = series[0]?.points.map((p) => p.monthLabel) ?? [];

  const option = useMemo(
    () => ({
      grid: { left: 56, right: 16, top: 36, bottom: 32 },
      legend: {
        top: 0,
        left: 0,
        icon: "circle" as const,
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: "#475569", fontSize: 11, fontFamily: "Inter" },
      },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "#0F172A",
        borderWidth: 0,
        textStyle: { color: "#F8FAFC", fontSize: 12 },
        formatter: (
          params: Array<{
            color: string;
            seriesName: string;
            value: number;
            axisValue: string;
          }>,
        ) => {
          const lines = params.map(
            (p) =>
              `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong>${formatCurrency(p.value, { currency, compact: true })}</strong>`,
          );
          return `${params[0]?.axisValue}<br/>${lines.join("<br/>")}`;
        },
      },
      xAxis: {
        type: "category" as const,
        data: monthLabels,
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
      series: series.map((s, i) => ({
        name: s.debtName,
        type: "line" as const,
        data: s.points.map((p) => p.balanceMinor),
        smooth: 0.2,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2.5, color: CHART_COLORS[i % CHART_COLORS.length] },
        itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
      })),
    }),
    [series, currency, monthLabels],
  );

  if (series.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-4">
          Debt balance trend
        </p>
        <div className="flex items-center justify-center h-[240px] text-sm text-[#94A3B8]">
          No active debts to chart
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-4">
        Debt balance trend — last {monthLabels.length} months
      </p>
      <ReactECharts
        option={option}
        style={{ height: 280 }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
}
