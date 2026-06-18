/**
 * app/(dashboard)/debts/new/page.tsx — Create Debt Page
 *
 * Server Component wrapper. The form itself is a Client Component.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import { countActiveDebtsByUserId } from "@/server/services/debt.service";
import { FREE_PLAN_DEBT_LIMIT } from "@/server/services/access.service";
import { Navbar } from "@/components/layout/navbar";
import { DebtForm } from "@/components/debt/debt-form";

export const metadata: Metadata = {
  title: "Add Debt",
};

export default async function NewDebtPage() {
  const user = await requireUser();
  const tier = user.subscriptionTier as "free" | "pro";

  // Pre-flight: check limit before rendering the form
  if (tier === "free") {
    const activeCount = await countActiveDebtsByUserId(user.id);
    if (activeCount >= FREE_PLAN_DEBT_LIMIT) {
      return <DebtLimitGate currentCount={activeCount} tier={tier} />;
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Navbar
        title="Add Debt"
        breadcrumb={[{ label: "Debts", href: "/debts" }, { label: "New" }]}
        tier={tier}
      />

      <div className="flex-1 p-6">
        <div className="max-w-2xl">
          {/* Page intro */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-1">
              Add a new debt
            </h2>
            <p className="text-sm text-[#64748B]">
              Fill in the details below. The original amount you enter becomes
              the permanent baseline for tracking your repayment progress.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <DebtForm mode="create" />
          </div>

          {/* Ledger transparency note */}
          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3">
            <div
              className="h-1.5 w-1.5 rounded-full bg-[#94A3B8] mt-1.5 flex-shrink-0"
              aria-hidden="true"
            />
            <p className="text-xs text-[#64748B] leading-relaxed">
              When you add a debt, LibreDebt creates an immutable{" "}
              <span className="font-semibold text-[#475569]">
                opening ledger entry
              </span>{" "}
              recording the starting balance. Every payment you record adds
              another entry. The balance you see is always the sum of all
              entries — never a manually updated number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Debt limit gate screen ────────────────────────────────────────────────── */

interface DebtLimitGateProps {
  currentCount: number;
  tier: "free" | "pro";
}

function DebtLimitGate({ currentCount, tier }: DebtLimitGateProps) {
  return (
    <div className="flex flex-col flex-1">
      {/* ✨ FIXED: Included tier context prop to match required Navbar specs */}
      <Navbar
        title="Add Debt"
        breadcrumb={[{ label: "Debts", href: "/debts" }, { label: "New" }]}
        tier={tier}
      />
      <div className="flex-1 p-6 flex items-start justify-center">
        <div className="max-w-md w-full mt-8">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/10 mx-auto mb-5">
              <Sparkles className="h-5 w-5 text-[#10B981]" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
              Free plan limit reached
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
              You&apos;re tracking {currentCount} of {FREE_PLAN_DEBT_LIMIT}{" "}
              debts on the free plan. Upgrade to Pro to track unlimited debts,
              unlock smart reminders, and access payoff strategies.
            </p>
            <Link
              href="/settings?tab=billing"
              className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </Link>
            <div className="mt-3">
              <Link
                href="/debts"
                className="text-sm text-[#94A3B8] hover:text-[#64748B] transition-colors"
              >
                Back to debts
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
