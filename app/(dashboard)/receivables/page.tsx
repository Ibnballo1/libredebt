/**
 * app/(dashboard)/receivables/page.tsx — Receivables List
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, HandCoins } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import { getActiveReceivablesByUserId } from "@/server/services/receivable.service";
import { Navbar } from "@/components/layout/navbar";
import { EmptyState } from "@/components/shared";
import { ReceivableCard } from "@/components/receivable/receivable-card";
import { formatCurrency } from "@/lib/utils";
import { notFound } from "next/navigation";
import { ExportButtons } from "@/components/export/export-buttons";

export const metadata: Metadata = { title: "Receivables" };

export default async function ReceivablesPage() {
  const user = await requireUser();
  if (!user) notFound();
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  const receivables = await getActiveReceivablesByUserId(user.id);
  const activeCount = receivables.length;
  const totalOwedToUser = receivables.reduce(
    (sum, r) => sum + r.currentBalanceMinor,
    0,
  );

  return (
    <div className="flex flex-col flex-1">
      <Navbar
        title="Receivables"
        description={
          receivables.length > 0
            ? `${receivables.length} active · ${formatCurrency(totalOwedToUser, { currency, compact: true })} owed to you`
            : "People who owe you money"
        }
        tier={tier}
        actions={
          <div className="flex items-center gap-3">
            <ExportButtons type="receivables" count={activeCount} />
            <Link
              href="/receivables/new"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span className="hidden md:block">Add Receivable</span>
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-6 max-w-5xl">
        {receivables.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <EmptyState
              icon={HandCoins}
              title="No active receivables"
              description="Track money people owe you. Record each loan, watch repayments come in, and send reminders when needed."
              action={
                <Link
                  href="/receivables/new"
                  className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add your first receivable
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#38BDF8]/80 mb-0.5">
                  Total owed to you
                </p>
                <p className="text-2xl font-bold text-[#0F172A] tabular-nums">
                  {formatCurrency(totalOwedToUser, { currency })}
                </p>
              </div>
              <p className="text-sm text-[#64748B]">
                across {receivables.length} active{" "}
                {receivables.length === 1 ? "receivable" : "receivables"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {receivables.map((r) => (
                <ReceivableCard
                  key={r.id}
                  receivable={{
                    id: r.id,
                    name: r.name,
                    debtorName: r.debtorName,
                    debtorPhone: r.debtorPhone ?? null,
                    originalAmountMinor: r.originalAmountMinor,
                    currentBalanceMinor: r.currentBalanceMinor,
                    currency: r.currency,
                    expectedByDate: r.expectedByDate ?? null,
                    status: r.status as "active" | "settled" | "archived",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
