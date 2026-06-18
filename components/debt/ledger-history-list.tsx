/**
 * components/debt/ledger-history-list.tsx
 *
 * Displays the payment history (ledger entries) for a single debt.
 * Shows entries ordered by effective date, newest first.
 *
 * Entry type visual encoding:
 *   opening    → slate bullet  — "Starting balance"
 *   payment    → emerald ↓     — negative amount (reduces balance)
 *   adjustment → amber ⟳       — could be positive or negative
 *
 * This is a Server Component — pure display, no interactivity needed.
 */

import { Receipt } from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { EmptyState } from "@/components/shared";

type LedgerEntry = {
  id: string;
  type: "opening" | "payment" | "interest" | "fee" | "adjustment" | "reversal";
  amountMinor: number;
  note: string | null;
  effectiveDate: Date;
  recordedBy: "user" | "system" | "job";
};

type LedgerHistoryListProps = {
  entries: LedgerEntry[];
  currency: string;
};

function EntryTypeBadge({ type }: { type: LedgerEntry["type"] }) {
  const styles = {
    opening: "bg-[#F1F5F9] text-[#64748B]",
    payment: "bg-[#F0FDF9] text-[#10B981]",
    interest: "bg-[#FEF3C7] text-[#D97706]",
    fee: "bg-[#F3E8FF] text-[#7C3AED]",
    adjustment: "bg-amber-50 text-amber-600",
    reversal: "bg-[#FEE2E2] text-[#DC2626]",
  };

  const labels = {
    opening: "Opening",
    payment: "Payment",
    interest: "Interest",
    fee: "Fee",
    adjustment: "Adjustment",
    reversal: "Reversal",
  };

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

export function LedgerHistoryList({
  entries,
  currency,
}: LedgerHistoryListProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No payments recorded yet"
        description="Record your first payment above to start building your payment history."
        className="py-12"
      />
    );
  }

  return (
    <div role="list" aria-label="Payment history">
      {entries.map((entry, index) => {
        const isPayment = entry.type === "payment";
        const isOpening = entry.type === "opening";
        const isNegative = entry.amountMinor < 0;
        const absAmount = Math.abs(entry.amountMinor);

        return (
          <div
            key={entry.id}
            role="listitem"
            className="flex items-start gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
            style={{
              borderBottom:
                index < entries.length - 1 ? "1px solid #F1F5F9" : "none",
            }}
          >
            {/* Visual indicator */}
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full mt-0.5"
              style={{
                background: isPayment
                  ? "rgba(16,185,129,0.1)"
                  : isOpening
                    ? "#F1F5F9"
                    : "rgba(245,158,11,0.1)",
              }}
              aria-hidden="true"
            >
              <span
                className="text-xs font-bold"
                style={{
                  color: isPayment
                    ? "#10B981"
                    : isOpening
                      ? "#94A3B8"
                      : "#F59E0B",
                }}
              >
                {isPayment ? "↓" : isOpening ? "○" : "⟳"}
              </span>
            </div>

            {/* Entry details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <EntryTypeBadge type={entry.type} />
                {entry.recordedBy === "system" && (
                  <span className="text-[9px] text-[#CBD5E1] font-medium">
                    auto
                  </span>
                )}
                {entry.recordedBy === "job" && (
                  <span className="text-[9px] text-[#CBD5E1] font-medium">
                    scheduled
                  </span>
                )}
              </div>

              {entry.note && (
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                  {entry.note}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1">
                <time
                  dateTime={entry.effectiveDate.toISOString()}
                  className="text-[10px] text-[#94A3B8] font-medium"
                  title={formatDate(entry.effectiveDate, "long")}
                >
                  {formatDate(entry.effectiveDate)}
                </time>
                <span className="text-[#E2E8F0]" aria-hidden="true">
                  ·
                </span>
                <span className="text-[10px] text-[#CBD5E1]">
                  {formatRelativeTime(entry.effectiveDate)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="flex-shrink-0 text-right">
              <p
                className="text-sm font-bold tabular-nums"
                style={{
                  color: isNegative ? "#10B981" : "#0F172A",
                }}
              >
                {isNegative ? "−" : "+"}
                {formatCurrency(absAmount, { currency })}
              </p>
              {isPayment && (
                <p className="text-[10px] text-[#94A3B8] mt-0.5">payment</p>
              )}
              {isOpening && (
                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                  starting balance
                </p>
              )}
              {entry.type === "interest" && (
                <p className="text-[10px] text-[#D97706] mt-0.5">interest</p>
              )}
              {entry.type === "fee" && (
                <p className="text-[10px] text-[#7C3AED] mt-0.5">fee</p>
              )}
              {entry.type === "reversal" && (
                <p className="text-[10px] text-[#DC2626] mt-0.5">reversal</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
