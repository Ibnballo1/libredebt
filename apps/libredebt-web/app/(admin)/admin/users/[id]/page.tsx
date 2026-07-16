/**
 * app/(admin)/admin/users/[id]/page.tsx — Admin User Detail
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
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to users
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E2530] pb-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white tracking-tight break-words md:text-2xl">
            {detail.name}
          </h1>
          <p className="text-xs text-[#64748B] mt-1 break-all md:text-sm">
            {detail.email}
          </p>
        </div>
        <div className="self-start sm:self-center">
          <span
            className={
              detail.subscriptionTier === "pro"
                ? "inline-block rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-400"
                : "inline-block rounded-full bg-[#1E2530] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#64748B]"
            }
          >
            {detail.subscriptionTier} plan
          </span>
        </div>
      </div>

      {/* Responsive Parameter Grid Block layout structure */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-4">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-1.5">
            Joined
          </p>
          <p className="text-xs font-semibold text-white sm:text-sm truncate">
            {formatDate(detail.createdAt, "long")}
          </p>
        </div>
        <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-4">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-1.5">
            Currency
          </p>
          <p className="text-xs font-semibold text-white sm:text-sm">
            {detail.currency}
          </p>
        </div>
        <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-4">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-1.5">
            Subscription
          </p>
          <p className="text-xs font-semibold text-white sm:text-sm truncate">
            {detail.subscription
              ? `${detail.subscription.provider} · ${detail.subscription.status}`
              : "None"}
          </p>
        </div>
        <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-4">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#475569] mb-1.5">
            Renews / ends
          </p>
          <p className="text-xs font-semibold text-white sm:text-sm truncate">
            {detail.subscription?.currentPeriodEnd
              ? formatDate(detail.subscription.currentPeriodEnd, "long")
              : "—"}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#475569] mb-3">
          Debts ({detail.debts.length})
        </p>

        {detail.debts.length === 0 ? (
          <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-8 text-center text-xs text-[#475569]">
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
    </div>
  );
}
