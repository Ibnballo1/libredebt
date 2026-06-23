/**
 * components/admin/signup-growth-chart.tsx
 *
 * Reuses Apache ECharts styled for the dark admin surface.
 * Hardened custom type interfaces to eliminate TS2532 and TS2339.
 */

"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { SignupGrowthPoint } from "@/server/services/admin.service";

// ─── STABLE CUSTOM TYPE INTERFACE ───────────────────────────────────────────
// This maps directly to the absolute runtime payload ECharts passes for axis tooltips
interface EChartsTooltipAxisParam {
  axisValue: string;
  value: number;
  data: number;
  seriesName: string;
}

export function SignupGrowthChart({ data }: { data: SignupGrowthPoint[] }) {
  const option = useMemo(
    () => ({
      grid: { left: 40, right: 16, top: 24, bottom: 32 },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "#1E2530",
        borderWidth: 0,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (params: unknown) => {
          // Assert as an array of our specific structural interface
          const items = params as EChartsTooltipAxisParam[];

          // Fix for TS2532 (Object is possibly 'undefined')
          if (!items || items.length === 0 || !items[0]) {
            return "";
          }

          // Fix for TS2339 (Property 'axisValue' does not exist)
          return `${items[0].axisValue}<br/><strong>${items[0].value} signups</strong>`;
        },
      },
      xAxis: {
        type: "category" as const,
        data: data.map((d) => d.dateLabel),
        axisLine: { lineStyle: { color: "#1E2530" } },
        axisTick: { show: false },
        axisLabel: { color: "#475569", fontSize: 10, interval: 4 },
      },
      yAxis: {
        type: "value" as const,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "#1E2530" } },
        axisLabel: { color: "#475569", fontSize: 10 },
      },
      series: [
        {
          type: "line" as const,
          data: data.map((d) => d.count),
          smooth: 0.2,
          symbol: "circle",
          symbolSize: 5,
          lineStyle: { width: 2, color: "#F59E0B" },
          itemStyle: { color: "#F59E0B" },
          areaStyle: {
            color: {
              type: "linear" as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(245,158,11,0.2)" },
                { offset: 1, color: "rgba(245,158,11,0)" },
              ],
            },
          },
        },
      ],
    }),
    [data],
  );

  return (
    <div className="rounded-lg border border-[#1E2530] bg-[#11151F] p-5">
      <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-4">
        Signups — last 30 days
      </p>
      <ReactECharts
        option={option}
        style={{ height: 220 }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
}
