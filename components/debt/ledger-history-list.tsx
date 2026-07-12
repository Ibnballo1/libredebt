/**
 * components/debt/ledger-history-list.tsx (UPDATED — adds receipt display)
 *
 * Changes from original:
 *   1. LedgerEntry type now includes receiptUrl
 *   2. Each payment entry shows a ReceiptViewer below the note if a
 *      receipt URL is present
 *   3. The list itself stays a Server Component — ReceiptViewer is a
 *      Client Component imported from components/payment/receipt-viewer
 *
 * The debt detail page passes `entries` from getLedgerEntriesByDebtId()
 * which already selects receiptUrl from the DB — it just wasn't being
 * used here before.
 */

import { Receipt } from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { EmptyState } from "@/components/shared";
import { ReceiptViewer } from "@/components/payment/receipt-viewer";

type LedgerEntry = {
  id: string;
  type: "opening" | "payment" | "adjustment" | "interest" | "fee" | "reversal";
  amountMinor: number;
  note: string | null;
  receiptUrl: string | null; // ← ADDED
  effectiveDate: Date;
  recordedBy: "user" | "system" | "job";
};

type LedgerHistoryListProps = {
  entries: LedgerEntry[];
  currency: string;
  debtId: string; // ← ADDED — needed by ReceiptViewer for revalidatePath
};

function EntryTypeBadge({ type }: { type: LedgerEntry["type"] }) {
  const styles: Record<string, string> = {
    opening: "bg-[#F1F5F9] text-[#64748B]",
    payment: "bg-[#F0FDF9] text-[#10B981]",
    adjustment: "bg-amber-50 text-amber-600",
    interest: "bg-orange-50 text-orange-500",
    fee: "bg-red-50 text-red-400",
    reversal: "bg-purple-50 text-purple-500",
  };
  const labels: Record<string, string> = {
    opening: "Opening",
    payment: "Payment",
    adjustment: "Adjustment",
    interest: "Interest",
    fee: "Fee",
    reversal: "Reversal",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${styles[type] ?? styles.adjustment}`}
    >
      {labels[type] ?? type}
    </span>
  );
}

function entryIcon(type: LedgerEntry["type"], isNegative: boolean) {
  if (type === "payment") return "↓";
  if (type === "opening") return "○";
  if (type === "reversal") return "↩";
  if (type === "interest" || type === "fee") return "+";
  return "⟳";
}

function entryIconColor(type: LedgerEntry["type"]) {
  if (type === "payment") return "#10B981";
  if (type === "opening") return "#94A3B8";
  if (type === "interest" || type === "fee") return "#F59E0B";
  if (type === "reversal") return "#A855F7";
  return "#F59E0B";
}

function entryIconBg(type: LedgerEntry["type"]) {
  if (type === "payment") return "rgba(16,185,129,0.1)";
  if (type === "opening") return "#F1F5F9";
  if (type === "interest" || type === "fee") return "rgba(245,158,11,0.1)";
  if (type === "reversal") return "rgba(168,85,247,0.1)";
  return "rgba(245,158,11,0.1)";
}

export function LedgerHistoryList({
  entries,
  currency,
  debtId,
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
        const isNegative = entry.amountMinor < 0;
        const absAmount = Math.abs(entry.amountMinor);
        const isLast = index === entries.length - 1;

        return (
          <div
            key={entry.id}
            role="listitem"
            className="px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
            style={{ borderBottom: isLast ? "none" : "1px solid #F1F5F9" }}
          >
            <div className="flex items-start gap-4">
              {/* Visual indicator */}
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full mt-0.5"
                style={{ background: entryIconBg(entry.type) }}
                aria-hidden="true"
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: entryIconColor(entry.type) }}
                >
                  {entryIcon(entry.type, isNegative)}
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
                  {/* Receipt indicator badge — visible even before expanding */}
                  {entry.receiptUrl && (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-[#38BDF8]/10 text-[#38BDF8]">
                      <Receipt className="h-2.5 w-2.5" />
                      Receipt
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

                {/* ── Receipt viewer — shown inline below the entry details ── */}
                {entry.receiptUrl && (
                  <ReceiptViewer
                    receiptUrl={entry.receiptUrl}
                    ledgerEntryId={entry.id}
                    debtId={debtId}
                    canDelete={true}
                  />
                )}
              </div>

              {/* Amount */}
              <div className="flex-shrink-0 text-right">
                <p
                  className="text-sm font-bold tabular-nums"
                  style={{ color: isNegative ? "#10B981" : "#0F172A" }}
                >
                  {isNegative ? "−" : "+"}
                  {formatCurrency(absAmount, { currency })}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5 capitalize">
                  {entry.type}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
