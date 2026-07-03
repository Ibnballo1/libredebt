/**
 * app/(dashboard)/payments/page.tsx — Payment History Page
 *
 * Shows the complete payment history across all debts,
 * ordered by effective date (most recent first).
 *
 * This page demonstrates the append-only ledger principle:
 * every payment ever recorded is visible here, permanently,
 * in the order it happened. Nothing is editable, nothing is deleted.
 *
 * Server Component — full server render, no client state needed.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import { getPaymentHistory } from "@/server/services/dashboard.service";
import { Navbar } from "@/components/layout/navbar";
import { EmptyState } from "@/components/shared";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { redirect } from "next/navigation";
import { ExportButtons } from "@/components/export/export-buttons";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const user = await requireUser();
  if (!user) {
    redirect("/login"); // ✅ ONLY place redirect happens
  }
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  const payments = await getPaymentHistory(user.id, 100);
  const activeCount = payments.length;

  // Group payments by month for a cleaner chronological display
  const grouped = groupByMonth(payments);

  return (
    <div className="flex flex-col flex-1 w-full">
      <Navbar
        title="Payments"
        description={
          payments.length > 0
            ? `${payments.length} payment${payments.length === 1 ? "" : "s"} recorded`
            : "No payments yet"
        }
        tier={tier}
        actions={
          <div className="flex items-center gap-3">
            <ExportButtons type="payments" count={activeCount} />
            <Link
              href="/debts"
              className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors"
            >
              Go to Debts
            </Link>
          </div>
        }
      />

      {/* FIXED: Changed max-w-3xl to an explicit responsive container matching standard professional dashboard configurations */}
      <div className="flex-1 p-6 w-full max-w-7xl mx-auto">
        {payments.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <EmptyState
              icon={Receipt}
              title="No payments recorded yet"
              description="Once you record payments against your debts, your complete payment history will appear here — permanently and in order."
              action={
                <Link
                  href="/debts"
                  className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors"
                >
                  Go to Debts
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total summary bar */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-1">
                  Total amount paid
                </p>
                <p className="text-2xl font-bold text-[#0F172A] tabular-nums">
                  {formatCurrency(
                    payments.reduce(
                      (acc, p) => acc + Math.abs(p.amountMinor),
                      0,
                    ),
                    { currency, compact: false },
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-1">
                  Payments recorded
                </p>
                <p className="text-2xl font-bold text-[#0F172A] tabular-nums">
                  {payments.length}
                </p>
              </div>
            </div>

            {/* Grouped by month */}
            {grouped.map(({ monthLabel, entries }) => (
              <div key={monthLabel} className="space-y-3">
                {/* Month header */}
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] whitespace-nowrap">
                    {monthLabel}
                  </p>
                  <div
                    className="h-px flex-1 bg-[#E2E8F0]"
                    aria-hidden="true"
                  />
                  <p className="text-[10px] font-bold tabular-nums text-[#CBD5E1] whitespace-nowrap">
                    {formatCurrency(
                      entries.reduce(
                        (acc, e) => acc + Math.abs(e.amountMinor),
                        0,
                      ),
                      { currency, compact: true },
                    )}
                  </p>
                </div>

                {/* Payment rows */}
                <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
                  {entries.map((payment, index) => {
                    const absAmount = Math.abs(payment.amountMinor);

                    return (
                      <Link
                        key={payment.id}
                        href={`/debts/${payment.debtId}`}
                        className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:bg-[#F8FAFC]"
                        style={{
                          borderBottom:
                            index < entries.length - 1
                              ? "1px solid #F1F5F9"
                              : "none",
                        }}
                      >
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          {/* Payment icon */}
                          <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#F0FDF9] mt-0.5"
                            aria-hidden="true"
                          >
                            <span className="text-sm font-bold text-[#10B981]">
                              ↑
                            </span>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-[#0F172A] truncate">
                                {payment.debtName}
                              </p>
                              <span className="text-[10px] text-[#94A3B8] truncate">
                                {payment.creditor}
                              </span>
                            </div>
                            {payment.note && (
                              <p className="text-xs text-[#64748B] mt-0.5 break-words">
                                {payment.note}
                              </p>
                            )}
                            <time
                              dateTime={payment.effectiveDate.toISOString()}
                              className="text-[10px] text-[#94A3B8] mt-1 flex items-center gap-1.5 whitespace-nowrap"
                            >
                              {formatDate(payment.effectiveDate, "medium")}
                              <span className="text-[#E2E8F0]" aria-hidden>
                                ·
                              </span>
                              {formatRelativeTime(payment.effectiveDate)}
                            </time>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex-shrink-0 text-right self-center">
                          <p className="text-sm font-bold text-[#10B981] tabular-nums">
                            −
                            {formatCurrency(absAmount, {
                              currency: payment.currency,
                            })}
                          </p>
                          <p className="text-[10px] text-[#94A3B8] mt-0.5 uppercase tracking-wider font-semibold">
                            payment
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Ledger integrity note */}
            <div className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
              <div
                className="h-1.5 w-1.5 rounded-full bg-[#CBD5E1] mt-1.5 flex-shrink-0"
                aria-hidden="true"
              />
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                All payments are stored in an{" "}
                <span className="font-semibold text-[#64748B]">
                  append-only ledger
                </span>
                . Entries cannot be modified or deleted — every payment you have
                ever recorded is permanently preserved here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper: group payments by calendar month ─────────────────────────────────

type GroupedMonth = {
  monthLabel: string;
  entries: Awaited<ReturnType<typeof getPaymentHistory>>;
};

function groupByMonth(
  payments: Awaited<ReturnType<typeof getPaymentHistory>>,
): GroupedMonth[] {
  const map = new Map<string, GroupedMonth>();

  for (const payment of payments) {
    const d = new Date(payment.effectiveDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-NG", {
      month: "long",
      year: "numeric",
    });

    if (!map.has(key)) {
      map.set(key, { monthLabel: label, entries: [] });
    }
    map.get(key)!.entries.push(payment);
  }

  return Array.from(map.values());
}
