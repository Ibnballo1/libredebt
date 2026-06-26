/**
 * components/admin/signup-growth-chart.tsx
 */

"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { SignupGrowthPoint } from "@/server/services/admin.service";

interface EChartsTooltipAxisParam {
  axisValue: string;
  value: number;
  data: number;
  seriesName: string;
}

export function SignupGrowthChart({ data }: { data: SignupGrowthPoint[] }) {
  const option = useMemo(
    () => ({
      // Adjusted grid margins to look pristine on compact width scales
      grid: { left: 36, right: 12, top: 20, bottom: 24 },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "#1E2530",
        borderWidth: 0,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (params: unknown) => {
          const items = params as EChartsTooltipAxisParam[];
          if (!items || items.length === 0 || !items[0]) {
            return "";
          }
          return `${items[0].axisValue}<br/><strong>${items[0].value} signups</strong>`;
        },
      },
      xAxis: {
        type: "category" as const,
        data: data.map((d) => d.dateLabel),
        axisLine: { lineStyle: { color: "#1E2530" } },
        axisTick: { show: false },
        axisLabel: {
          color: "#475569",
          fontSize: 9,
          // Intelligent responsive interval display skip pattern logic
          interval: data.length > 15 ? 6 : 2,
        },
      },
      yAxis: {
        type: "value" as const,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "#1E2530" } },
        axisLabel: { color: "#475569", fontSize: 9 },
      },
      series: [
        {
          type: "line" as const,
          data: data.map((d) => d.count),
          smooth: 0.2,
          symbol: "circle",
          symbolSize: 4,
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
                { offset: 0, color: "rgba(245,158,11,0.15)" },
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
    <div className="rounded-lg border border-[#1E2530] bg-[#11151F] p-4 sm:p-5">
      <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-3 sm:mb-4">
        Signups — last 30 days
      </p>
      {/* Enhanced wrapping container blocks */}
      <div className="h-56 w-full">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "svg" }}
          notMerge={true} // Forces a perfect clear and redraw cycle
        />
      </div>
    </div>
  );
}
