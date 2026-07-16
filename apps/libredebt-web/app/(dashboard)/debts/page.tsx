/**
 * app/(dashboard)/debts/page.tsx — Debt List Page
 *
 * Server Component. Fetches all active debts and renders them.
 *
 * DATA FLOW:
 *   requireUser() → getActiveDebtsByUserId() → render
 *   No client-side fetching — the initial view is fully server-rendered.
 *   TanStack Query handles optimistic updates after mutations.
 *
 * SUBSCRIPTION AWARENESS:
 *   - Free users see the DebtLimitBanner when at or near 3 debts
 *   - "Add Debt" button is disabled + annotated when at the limit
 *   - The gate is purely informational here — enforcement is in the Server Action
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import { getActiveDebtsByUserId } from "@/server/services/debt.service";
import { Navbar } from "@/components/layout/navbar";
import { DebtCard } from "@/components/debt/debt-card";
import { EmptyState, DebtLimitBanner } from "@/components/shared";
import { FREE_PLAN_DEBT_LIMIT } from "@/server/services/access.service";
import { redirect } from "next/navigation";
import { ExportButtons } from "@/components/export/export-buttons";

export const metadata: Metadata = {
  title: "Debts",
};

export default async function DebtsPage() {
  const user = await requireUser();
  if (!user) {
    redirect("/login"); // ✅ ONLY place redirect happens
  }
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  const debts = await getActiveDebtsByUserId(user.id);
  const activeCount = debts.length;
  const isAtLimit = tier === "free" && activeCount >= FREE_PLAN_DEBT_LIMIT;
  const canAddDebt = tier === "pro" || activeCount < FREE_PLAN_DEBT_LIMIT;

  return (
    <div className="flex flex-col flex-1">
      {/* ── Navbar ── */}
      <Navbar
        title="Debts"
        description={
          activeCount > 0
            ? `${activeCount} active ${activeCount === 1 ? "debt" : "debts"}`
            : "No active debts"
        }
        tier={tier}
        actions={
          <div className="flex items-center gap-3">
            <ExportButtons type="debts" count={activeCount} />

            {/* ─── ADDED CURLY BRACES HERE ─── */}
            {canAddDebt ? (
              <Link
                href="/debts/new"
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0F172A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E293B] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden md:block">Add Debt</span>
              </Link>
            ) : (
              <div className="relative">
                <button
                  disabled
                  aria-disabled="true"
                  aria-describedby="debt-limit-tooltip"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#E2E8F0] px-3.5 py-2 text-xs font-semibold text-[#94A3B8] cursor-not-allowed"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden md:block">Add Debt</span>
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* ── Page content ── */}
      <div className="flex-1 p-6 space-y-6 max-w-5xl">
        {/* Free plan limit banner */}
        {tier === "free" && activeCount > 0 && (
          <DebtLimitBanner current={activeCount} limit={FREE_PLAN_DEBT_LIMIT} />
        )}

        {/* Debt grid */}
        {debts.length > 0 ? (
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-4">
              Active debts
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {debts.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={{
                    id: debt.id,
                    name: debt.name,
                    creditor: debt.creditor,
                    originalAmountMinor: debt.originalAmountMinor,
                    currentBalanceMinor: debt.currentBalanceMinor,
                    minimumPaymentMinor: debt.minimumPaymentMinor,
                    dueDay: debt.dueDay,
                    currency: debt.currency,
                    status: debt.status,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <EmptyState
              icon={CreditCard}
              title="No debts tracked yet"
              description="Add your first debt to start tracking your repayment progress. LibreDebt records every payment and shows you exactly where you stand."
              action={
                <Link
                  href="/debts/new"
                  className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add your first debt
                </Link>
              }
            />
          </div>
        )}

        {/* At-limit upgrade prompt (shown inline below list when at max) */}
        {isAtLimit && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#0F172A] mb-1">
              Want to track more debts?
            </p>
            <p className="text-sm text-[#64748B] mb-4">
              You&apos;ve reached the 3-debt limit on the free plan. Upgrade to
              Pro for unlimited debt tracking.
            </p>
            <Link
              href="/settings?tab=billing"
              className="inline-flex items-center gap-2 rounded-md bg-[#10B981] px-4 py-2 text-sm font-semibold text-white hover:bg-[#059669] transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
