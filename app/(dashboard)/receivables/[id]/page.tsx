/**
 * app/(dashboard)/receivables/[id]/page.tsx — Receivable Detail
 *
 * Shows the receivable's full info, current balance, ledger history,
 * record-repayment form, and the reminder message generator.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import {
  getReceivableById,
  getReceivableLedgerEntries,
} from "@/server/services/receivable.service";
import { Navbar } from "@/components/layout/navbar";
import { RecordRepaymentForm } from "@/components/receivable/record-payment-form";
import { SendReminderButton } from "@/components/receivable/send-reminder-button";
import {
  formatCurrency,
  formatDate,
  calculateProgressPercent,
} from "@/lib/utils";

type ReceivableDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ReceivableDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Receivable — ${id}` };
}

export default async function ReceivableDetailPage({
  params,
}: ReceivableDetailPageProps) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) notFound();
  const tier = user.subscriptionTier as "free" | "pro";

  const [receivable, ledgerEntries] = await Promise.all([
    getReceivableById(id, user.id),
    getReceivableLedgerEntries(id, user.id),
  ]);

  if (!receivable) notFound();

  const progressPct = calculateProgressPercent(
    receivable.originalAmountMinor,
    receivable.currentBalanceMinor,
  );

  return (
    <div className="flex flex-col flex-1">
      <Navbar title={receivable.name} tier={tier} />

      <div className="flex-1 p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/receivables"
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All receivables
          </Link>
          {receivable.status === "active" && (
            <Link
              href={`/receivables/${id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column: info + record repayment */}
          <div className="lg:col-span-2 space-y-5">
            {/* Summary card */}
            <div
              className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
              style={{ borderLeftWidth: 3, borderLeftColor: "#38BDF8" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
                    Owed to you by
                  </p>
                  <p className="text-lg font-bold text-[#0F172A] mt-0.5">
                    {receivable.debtorName}
                  </p>
                  {receivable.debtorRelationship && (
                    <p className="text-xs text-[#64748B]">
                      {receivable.debtorRelationship}
                    </p>
                  )}
                  {receivable.debtorPhone && (
                    <p className="text-xs text-[#64748B]">
                      {receivable.debtorPhone}
                    </p>
                  )}
                </div>
                {receivable.status === "settled" && (
                  <span className="rounded-full bg-[#10B981]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#10B981]">
                    Settled
                  </span>
                )}
                {receivable.status === "archived" && (
                  <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Archived
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-1">
                    Current balance
                  </p>
                  <p className="text-2xl font-bold text-[#0F172A] tabular-nums">
                    {formatCurrency(receivable.currentBalanceMinor, {
                      currency: receivable.currency,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-1">
                    Original amount
                  </p>
                  <p className="text-2xl font-bold text-[#64748B] tabular-nums">
                    {formatCurrency(receivable.originalAmountMinor, {
                      currency: receivable.currency,
                    })}
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
                    Repaid
                  </span>
                  <span className="text-[10px] font-bold text-[#38BDF8]">
                    {progressPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#38BDF8] transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {receivable.expectedByDate && (
                <p className="text-xs text-[#64748B] mt-3">
                  Expected by{" "}
                  <strong className="text-[#0F172A]">
                    {formatDate(receivable.expectedByDate, "long")}
                  </strong>
                </p>
              )}

              {receivable.notes && (
                <p className="text-xs text-[#64748B] mt-3 border-t border-[#F1F5F9] pt-3">
                  {receivable.notes}
                </p>
              )}
            </div>

            {/* Record repayment */}
            {receivable.status === "active" && (
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-4">
                  Record repayment
                </p>
                <RecordRepaymentForm
                  receivableId={receivable.id}
                  currency={receivable.currency}
                  currentBalanceMinor={receivable.currentBalanceMinor}
                />
              </div>
            )}

            {/* Ledger history */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0]">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
                  Repayment history
                </p>
                <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                  {ledgerEntries.length}{" "}
                  {ledgerEntries.length === 1 ? "entry" : "entries"}
                </p>
              </div>
              {ledgerEntries.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-[#94A3B8]">
                  No entries yet
                </div>
              ) : (
                ledgerEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-5 py-3.5"
                    style={{
                      borderBottom:
                        i < ledgerEntries.length - 1
                          ? "1px solid #F1F5F9"
                          : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          entry.type === "repayment"
                            ? "text-[9px] font-bold uppercase tracking-wide bg-[#38BDF8]/10 text-[#38BDF8] rounded px-1.5 py-0.5"
                            : entry.type === "opening"
                              ? "text-[9px] font-bold uppercase tracking-wide bg-[#F1F5F9] text-[#64748B] rounded px-1.5 py-0.5"
                              : "text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 rounded px-1.5 py-0.5"
                        }
                      >
                        {entry.type}
                      </span>
                      <div>
                        {entry.note && (
                          <p className="text-xs text-[#475569]">{entry.note}</p>
                        )}
                        <p className="text-[10px] text-[#94A3B8]">
                          {formatDate(entry.effectiveDate, "medium")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={
                        entry.amountMinor < 0
                          ? "text-xs font-bold text-[#38BDF8] tabular-nums"
                          : "text-xs font-bold text-[#0F172A] tabular-nums"
                      }
                    >
                      {entry.amountMinor < 0 ? "−" : "+"}
                      {formatCurrency(Math.abs(entry.amountMinor), {
                        currency: receivable.currency,
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right column: reminder */}
          <div className="space-y-5">
            {receivable.status === "active" && (
              <SendReminderButton
                debtorName={receivable.debtorName}
                debtorPhone={receivable.debtorPhone ?? null}
                amountMinor={receivable.currentBalanceMinor}
                currency={receivable.currency}
                lenderName={user.name}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
