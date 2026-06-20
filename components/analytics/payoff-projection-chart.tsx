/**
 * components/analytics/payoff-projection-chart.tsx
 *
 * Area chart: projected TOTAL balance across all debts, declining to
 * zero at the projected debt-free month. Data comes directly from the
 * Stage 3 calculator's monthlySnapshots — no new simulation logic.
 *
 * A vertical marker line + label highlights the debt-free month.
 */

"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { PayoffProjectionPoint } from "@/server/services/analytics.service";
import { formatCurrency } from "@/lib/utils";
import { monthsToDateLabel } from "@/server/services/strategy.calculator";

type PayoffProjectionChartProps = {
  points: PayoffProjectionPoint[];
  totalMonths: number;
  currency: string;
};

export function PayoffProjectionChart({
  points,
  totalMonths,
  currency,
}: PayoffProjectionChartProps) {
  const sampled = useMemo(() => {
    if (points.length <= 24) return points;
    const step = Math.ceil(points.length / 24);
    return points.filter((_, i) => i % step === 0 || i === points.length - 1);
  }, [points]);

  const option = useMemo(
    () => ({
      grid: { left: 56, right: 16, top: 24, bottom: 32 },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "#0F172A",
        borderWidth: 0,
        textStyle: { color: "#F8FAFC", fontSize: 12 },
        formatter: (
          params: { axisValue: number | string; value: number }[],
        ) => {
          const p = params[0];
          if (!p) return "";
          return `Month ${p.axisValue}<br/><strong>${formatCurrency(p.value, { currency })}</strong>`;
        },
      },
      xAxis: {
        type: "category" as const,
        data: sampled.map((p) => p.month),
        name: "Months from today",
        nameLocation: "middle" as const,
        nameGap: 28,
        nameTextStyle: { color: "#94A3B8", fontSize: 10, fontFamily: "Inter" },
        axisLine: { lineStyle: { color: "#E2E8F0" } },
        axisTick: { show: false },
        axisLabel: { color: "#94A3B8", fontSize: 10, fontFamily: "monospace" },
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
          type: "line" as const,
          data: sampled.map((p) => p.totalBalanceMinor),
          smooth: 0.15,
          symbol: "none",
          lineStyle: { width: 2.5, color: "#10B981" },
          areaStyle: {
            color: {
              type: "linear" as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(16,185,129,0.18)" },
                { offset: 1, color: "rgba(16,185,129,0)" },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: {
              color: "#0F172A",
              type: "dashed" as const,
              width: 1.5,
            },
            label: {
              formatter: "Debt-free",
              color: "#0F172A",
              fontSize: 10,
              fontWeight: 700,
            },
            data: [{ xAxis: sampled.length - 1 }],
          },
        },
      ],
    }),
    [sampled, currency],
  );

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-4">
          Payoff projection
        </p>
        <div className="flex items-center justify-center h-[240px] text-sm text-[#94A3B8]">
          No active debts to project
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
          Payoff projection
        </p>
        <div className="text-right">
          <p className="text-[10px] text-[#94A3B8]">Projected debt-free</p>
          <p className="text-sm font-bold text-[#0F172A]">
            {monthsToDateLabel(totalMonths)}
          </p>
        </div>
      </div>
      <ReactECharts
        option={option}
        style={{ height: 260 }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
}
