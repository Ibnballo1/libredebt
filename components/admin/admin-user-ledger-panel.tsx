/**
 * components/admin/admin-user-ledger-panel.tsx
 *
 * One collapsed-by-default card per debt. Expanding it lazy-loads the
 * full ledger via getAdminUserLedgerAction — avoids fetching every
 * ledger entry for every debt up front when a user has many debts.
 */

"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { ChevronDown } from "lucide-react";
import { getAdminUserLedgerAction } from "@/server/actions/admin.actions";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

type Debt = {
  id: string;
  name: string;
  creditor: string;
  status: string;
  originalAmountMinor: number;
  currentBalanceMinor: number;
  currency: string;
};

type LedgerEntry = {
  id: string;
  type: "payment" | "opening" | string;
  effectiveDate: string | Date;
  amountMinor: number | string;
};

export function AdminUserLedgerPanel({
  userId,
  debt,
  progress,
}: {
  userId: string;
  debt: Debt;
  progress: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<LedgerEntry[] | null>(null);

  const { execute, isPending } = useAction(getAdminUserLedgerAction, {
    onSuccess: ({ data }) => {
      if (data?.success) setEntries(data.entries);
    },
  });

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && entries === null) {
      execute({ userId, debtId: debt.id });
    }
  }

  const color =
    progress >= 75 ? "#10B981" : progress >= 25 ? "#F59E0B" : "#EF4444";

  return (
    <div className="rounded-lg border border-[#1E2530] bg-[#11161F] overflow-hidden">
      <button
        onClick={handleToggle}
        className="flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-[#161B26] transition-colors"
      >
        <div
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{debt.name}</p>
            {debt.status === "archived" && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-[#475569] bg-[#1E2530] rounded px-1.5 py-0.5">
                archived
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">{debt.creditor}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-white tabular-nums">
            {formatCurrency(debt.currentBalanceMinor, {
              currency: debt.currency,
            })}
          </p>
          <p className="text-[10px] text-[#475569] tabular-nums">
            of{" "}
            {formatCurrency(debt.originalAmountMinor, {
              currency: debt.currency,
            })}{" "}
            · {progress}%
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#475569] flex-shrink-0 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-[#1E2530]">
          {isPending && entries === null ? (
            <div className="px-4 py-6 text-center text-xs text-[#475569]">
              Loading ledger…
            </div>
          ) : entries && entries.length > 0 ? (
            entries.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  borderBottom:
                    i < entries.length - 1 ? "1px solid #1A2029" : "none",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5",
                      entry.type === "payment"
                        ? "bg-[#10B981]/10 text-[#10B981]"
                        : entry.type === "opening"
                          ? "bg-[#1E2530] text-[#64748B]"
                          : "bg-amber-400/10 text-amber-400",
                    )}
                  >
                    {entry.type}
                  </span>
                  <span className="text-xs text-[#64748B]">
                    {formatDate(entry.effectiveDate, "medium")}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums",
                    Number(entry.amountMinor) < 0
                      ? "text-[#10B981]"
                      : "text-white",
                  )}
                >
                  {Number(entry.amountMinor) < 0 ? "−" : "+"}
                  {formatCurrency(Math.abs(Number(entry.amountMinor)), {
                    currency: debt.currency,
                  })}
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-xs text-[#475569]">
              No ledger entries
            </div>
          )}
        </div>
      )}
    </div>
  );
}
