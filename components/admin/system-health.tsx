/**
 * components/admin/system-health.tsx
 * System health: ledger row count + currency breakdown.
 */

import type { SystemHealth } from "@/server/services/admin.service";

export function SystemHealthPanel({ health }: { health: SystemHealth }) {
  const maxCount = Math.max(
    ...health.currencyBreakdown.map((c) => c.userCount),
    1,
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Ledger row count */}
      <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-5">
        <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-3">
          Database Health
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B]">
              Ledger entries (debts)
            </span>
            <span className="text-sm font-bold text-white tabular-nums">
              {health.ledgerRowCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B]">
              Ledger entries (receivables)
            </span>
            <span className="text-sm font-bold text-white tabular-nums">
              {health.receivableLedgerRowCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[#1E2530] pt-3">
            <span className="text-xs text-[#64748B]">Total ledger rows</span>
            <span className="text-sm font-bold text-amber-400 tabular-nums">
              {(
                health.ledgerRowCount + health.receivableLedgerRowCount
              ).toLocaleString()}
            </span>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-[#334155]">
          Monitor this count for index health as it scales past 100k rows.
        </p>
      </div>

      {/* Currency breakdown */}
      <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-5">
        <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-3">
          Currency Distribution
        </p>
        {health.currencyBreakdown.length === 0 ? (
          <p className="text-xs text-[#475569]">No data yet</p>
        ) : (
          <div className="space-y-2.5">
            {health.currencyBreakdown.slice(0, 6).map((c) => (
              <div key={c.currency}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">
                    {c.currency}
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    {c.userCount.toLocaleString()} users · {c.percent}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#1E2530] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${(c.userCount / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
