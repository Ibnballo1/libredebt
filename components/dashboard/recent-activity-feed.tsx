/**
 * components/dashboard/recent-activity-feed.tsx
 *
 * Shows the last 5 payment entries across all debts.
 * Each entry shows: debt name, amount, date, optional note.
 *
 * Payments are always negative in the ledger.
 * We display the absolute value with a green colour
 * to communicate that money was paid (positive action).
 *
 * Server Component — no interactivity needed.
 */

import Link from "next/link";
import { Receipt } from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import type { RecentPayment } from "@/server/services/dashboard.service";

type RecentActivityFeedProps = {
  payments: RecentPayment[];
  currency: string;
};

export function RecentActivityFeed({
  payments,
  currency,
}: RecentActivityFeedProps) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
            Recent activity
          </p>
          <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
            Last {payments.length} payment{payments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/payments"
          className="text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Payment rows */}
      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          <Receipt className="h-8 w-8 text-[#E2E8F0] mb-3" />
          <p className="text-sm text-[#94A3B8]">No payments recorded yet</p>
          <p className="text-xs text-[#CBD5E1] mt-1">
            Record a payment on any debt to see it here
          </p>
        </div>
      ) : (
        <div>
          {payments.map((payment, index) => {
            const absAmount = Math.abs(payment.amountMinor);

            return (
              <Link
                key={payment.id}
                href={`/debts/${payment.debtId}`}
                className="flex items-start gap-3.5 px-5 py-3.5 transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:bg-[#F8FAFC]"
                style={{
                  borderBottom:
                    index < payments.length - 1 ? "1px solid #F1F5F9" : "none",
                }}
              >
                {/* Icon */}
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F0FDF9] mt-0.5"
                  aria-hidden="true"
                >
                  <span className="text-xs font-bold text-[#10B981]">↓</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] truncate">
                    {payment.debtName}
                  </p>
                  {payment.note && (
                    <p className="text-[10px] text-[#64748B] mt-0.5 truncate">
                      {payment.note}
                    </p>
                  )}
                  <time
                    dateTime={payment.effectiveDate.toISOString()}
                    className="text-[10px] text-[#94A3B8] mt-0.5 block"
                    title={formatDate(payment.effectiveDate, "long")}
                  >
                    {formatDate(payment.effectiveDate)} ·{" "}
                    {formatRelativeTime(payment.effectiveDate)}
                  </time>
                </div>

                {/* Amount */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-bold text-[#10B981] tabular-nums">
                    −{formatCurrency(absAmount, { currency: payment.currency })}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">payment</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
