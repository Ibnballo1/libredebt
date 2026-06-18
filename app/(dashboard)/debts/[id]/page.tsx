/**
 * app/(dashboard)/debts/[id]/page.tsx — Debt Detail Page
 *
 * Server Component. Shows:
 *   - Debt metadata (name, creditor, rate, due day)
 *   - Current balance (computed from ledger)
 *   - Repayment progress bar
 *   - Record payment form
 *   - Payment history (ledger entries)
 *
 * If the debt doesn't exist or doesn't belong to the user → 404.
 * notFound() triggers Next.js's built-in 404 page.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Archive } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import {
  getDebtById,
  getLedgerEntriesByDebtId,
} from "@/server/services/debt.service";
import { Navbar } from "@/components/layout/navbar";
import { RecordPaymentForm } from "@/components/debt/record-payment-form";
import { LedgerHistoryList } from "@/components/debt/ledger-history-list";
import {
  formatCurrency,
  formatDate,
  calculateProgressPercent,
} from "@/lib/utils";

type DebtDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: DebtDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const debt = await getDebtById(id, user.id);
  if (!debt) return { title: "Debt not found" };
  return { title: debt.name };
}

export default async function DebtDetailPage({ params }: DebtDetailPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const tier = user.subscriptionTier as "free" | "pro";

  // Fetch debt — returns null if not found or not owned by user
  const debt = await getDebtById(id, user.id);
  if (!debt) notFound();

  // Fetch ledger entries for the payment history
  const entries = await getLedgerEntriesByDebtId(id, user.id);

  const progressPct = calculateProgressPercent(
    debt.originalAmountMinor,
    debt.currentBalanceMinor,
  );

  // Color encoding: same as DebtCard
  const accentColor =
    progressPct >= 75 ? "#10B981" : progressPct >= 25 ? "#F59E0B" : "#EF4444";

  const isArchived = debt.status === "archived";

  return (
    <div className="flex flex-col flex-1">
      <Navbar
        title={debt.name}
        breadcrumb={[{ label: "Debts", href: "/debts" }, { label: debt.name }]}
        tier={tier}
        actions={
          !isArchived ? (
            <Link
              href={`/debts/${id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
              Edit
            </Link>
          ) : null
        }
      />

      <div className="flex-1 p-6">
        <div className="max-w-4xl grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Left column: debt info + record payment ── */}
          <div className="space-y-5 lg:col-span-1">
            {/* Archived banner */}
            {isArchived && (
              <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5">
                <Archive className="h-3.5 w-3.5 text-[#94A3B8]" />
                <p className="text-xs font-medium text-[#64748B]">
                  This debt is archived
                </p>
              </div>
            )}

            {/* Balance card */}
            <div
              className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
              style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
            >
              {/* Balance header */}
              <div className="mb-4">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-1">
                  {isArchived ? "Final balance" : "Current balance"}
                </p>
                <p className="text-3xl font-bold text-[#0F172A] tabular-nums">
                  {formatCurrency(debt.currentBalanceMinor, {
                    currency: debt.currency,
                  })}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  of{" "}
                  {formatCurrency(debt.originalAmountMinor, {
                    currency: debt.currency,
                  })}{" "}
                  original
                </p>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
                    Progress
                  </span>
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: accentColor }}
                  >
                    {progressPct}%
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progressPct}%`,
                      background: accentColor,
                    }}
                  />
                </div>
              </div>

              {/* Debt metadata grid */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#F1F5F9]">
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-0.5">
                    Creditor
                  </p>
                  <p className="text-xs font-semibold text-[#0F172A]">
                    {debt.creditor}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-0.5">
                    Interest rate
                  </p>
                  <p className="text-xs font-semibold text-[#0F172A] tabular-nums">
                    {debt.interestRateBps > 0
                      ? `${(debt.interestRateBps / 100).toFixed(2)}% p.a.`
                      : "—"}
                  </p>
                </div>
                {debt.minimumPaymentMinor > 0 && (
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-0.5">
                      Min. payment
                    </p>
                    <p className="text-xs font-semibold text-[#0F172A] tabular-nums">
                      {formatCurrency(debt.minimumPaymentMinor, {
                        currency: debt.currency,
                      })}
                      /mo
                    </p>
                  </div>
                )}
                {debt.dueDay && (
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-0.5">
                      Due day
                    </p>
                    <p className="text-xs font-semibold text-[#0F172A]">
                      {debt.dueDay}th of month
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-0.5">
                    Started
                  </p>
                  <p className="text-xs font-semibold text-[#0F172A]">
                    {formatDate(debt.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-0.5">
                    Currency
                  </p>
                  <p className="text-xs font-semibold text-[#0F172A]">
                    {debt.currency}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {debt.notes && (
                <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-1">
                    Notes
                  </p>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {debt.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Record payment form — only for active debts */}
            {!isArchived && (
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-4">
                  Record a payment
                </p>
                <RecordPaymentForm
                  debtId={debt.id}
                  currency={debt.currency}
                  currentBalanceMinor={debt.currentBalanceMinor}
                />
              </div>
            )}
          </div>

          {/* ── Right column: payment history ── */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0]">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
                  Payment history
                </p>
                <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                  {entries.length} ledger{" "}
                  {entries.length === 1 ? "entry" : "entries"}
                </p>
              </div>
              <LedgerHistoryList entries={entries} currency={debt.currency} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
