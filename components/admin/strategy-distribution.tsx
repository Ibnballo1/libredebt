/**
 * components/admin/strategy-distribution.tsx
 * Visual breakdown of Snowball vs Avalanche adoption.
 */

import type { StrategyDistribution } from "@/server/services/admin.service";

export function StrategyDistributionPanel({
  data,
}: {
  data: StrategyDistribution;
}) {
  const total = data.snowballCount + data.avalancheCount + data.noStrategyCount;
  const withStrategy = data.snowballCount + data.avalancheCount;
  const withStrategyPct =
    total > 0 ? Math.round((withStrategy / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-5">
      <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-4">
        Payoff Strategy Adoption
      </p>

      <div className="flex items-end gap-4 mb-5">
        <div>
          <p className="text-2xl font-bold text-white">{withStrategyPct}%</p>
          <p className="text-xs text-[#64748B]">
            of users have an active strategy
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-semibold text-white">
            {withStrategy.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#475569]">with strategy</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#475569]">
            {data.noStrategyCount.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#475569]">no strategy</p>
        </div>
      </div>

      <div className="h-3 w-full rounded-full bg-[#1E2530] overflow-hidden flex mb-4">
        {withStrategy > 0 && (
          <>
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${data.snowballPercent}%` }}
            />
            <div
              className="h-full bg-[#38BDF8] transition-all"
              style={{ width: `${data.avalanchePercent}%` }}
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="text-xs text-[#64748B]">
            Snowball — {data.snowballCount} ({data.snowballPercent}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#38BDF8]" />
          <span className="text-xs text-[#64748B]">
            Avalanche — {data.avalancheCount} ({data.avalanchePercent}%)
          </span>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-[#334155] border-t border-[#1E2530] pt-3">
        Note: Snowball/Avalanche split is estimated. For exact data, add a{" "}
        <code className="text-amber-400">preferredStrategy</code> column to the
        users table and set it in{" "}
        <code className="text-amber-400">commitStrategyAction()</code>.
      </p>
    </div>
  );
}
