/**
 * app/(admin)/admin/users/[id]/page.tsx — Admin User Detail
 *
 * Read-only view of a single user: account info, subscription, and
 * every debt with its ledger history. No edit buttons, no delete
 * buttons, no impersonation — pure observability.
 *
 * notFound() (not a redirect) if the user ID doesn't exist, consistent
 * with requireSuperAdmin()'s obscurity-on-top-of-real-auth pattern.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminUserDetail } from "@/server/services/admin.service";
import { AdminUserLedgerPanel } from "@/components/admin/admin-user-ledger-panel";
import { formatDate, calculateProgressPercent } from "@/lib/utils";

type AdminUserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: AdminUserDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  return {
    title: detail ? `Admin — ${detail.name}` : "Admin — User not found",
  };
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#94A3B8] mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to users
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">{detail.name}</h1>
          <p className="text-sm text-[#64748B] mt-1">{detail.email}</p>
        </div>
        <span
          className={
            detail.subscriptionTier === "pro"
              ? "rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-400"
              : "rounded-full bg-[#1E2530] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#64748B]"
          }
        >
          {detail.subscriptionTier} plan
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-4">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-1.5">
            Joined
          </p>
          <p className="text-sm font-semibold text-white">
            {formatDate(detail.createdAt, "long")}
          </p>
        </div>
        <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-4">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-1.5">
            Currency
          </p>
          <p className="text-sm font-semibold text-white">{detail.currency}</p>
        </div>
        <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-4">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-1.5">
            Subscription
          </p>
          <p className="text-sm font-semibold text-white">
            {detail.subscription
              ? `${detail.subscription.provider} · ${detail.subscription.status}`
              : "None"}
          </p>
        </div>
        <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-4">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-1.5">
            Renews / ends
          </p>
          <p className="text-sm font-semibold text-white">
            {detail.subscription?.currentPeriodEnd
              ? formatDate(detail.subscription.currentPeriodEnd, "long")
              : "—"}
          </p>
        </div>
      </div>

      <p className="text-[10px] font-bold tracking-widest uppercase text-[#475569] mb-3">
        Debts ({detail.debts.length})
      </p>

      {detail.debts.length === 0 ? (
        <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-8 text-center text-sm text-[#475569]">
          This user has no debts on record.
        </div>
      ) : (
        <div className="space-y-3">
          {detail.debts.map((debt) => {
            const progress = calculateProgressPercent(
              debt.originalAmountMinor,
              debt.currentBalanceMinor,
            );
            return (
              <AdminUserLedgerPanel
                key={debt.id}
                userId={detail.id}
                debt={debt}
                progress={progress}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
