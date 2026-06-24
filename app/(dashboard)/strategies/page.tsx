/**
 * app/(dashboard)/strategies/page.tsx — Debt Strategies Page
 *
 * Free users see an upgrade gate explaining the value.
 * Pro users with no debts see a prompt to add debts first.
 * Pro users with debts see the full Snowball vs Avalanche comparison,
 * powered by the StrategyComparison client component.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { TrendingDown, Sparkles, CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import { getStrategyComparison } from "@/server/services/strategy.service";
import { Navbar } from "@/components/layout/navbar";
import { EmptyState } from "@/components/shared";
import { StrategyComparison } from "@/components/strategy/strategy-comparison";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Strategies" };

export default async function StrategiesPage() {
  const user = await requireUser();
  if (!user) {
    redirect("/login"); // ✅ ONLY place redirect happens
  }
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  if (tier === "free") {
    return <FreeUpgradeGate />;
  }

  const comparison = await getStrategyComparison(user.id);

  return (
    <div className="flex flex-col flex-1">
      <Navbar
        title="Strategies"
        description="Compare payoff plans and commit to one"
        tier={tier}
      />

      <div className="flex-1 p-6 max-w-5xl">
        {!comparison.hasDebts ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <EmptyState
              icon={CreditCard}
              title="No active debts to strategize"
              description="Add at least one debt to compare Snowball and Avalanche payoff strategies."
              action={
                <Link
                  href="/debts/new"
                  className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors"
                >
                  Add a debt
                </Link>
              }
            />
          </div>
        ) : (
          <StrategyComparison
            initialComparison={comparison}
            currency={currency}
          />
        )}
      </div>
    </div>
  );
}

// ─── Free plan gate ───────────────────────────────────────────────────────────

function FreeUpgradeGate() {
  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Strategies" tier="free" />
      <div className="flex-1 p-6 flex items-start justify-center">
        <div className="max-w-lg w-full mt-8">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/10 mx-auto mb-5">
              <TrendingDown
                className="h-5 w-5 text-[#10B981]"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
              Pay off your debt faster with a real strategy
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
              Compare the Debt Snowball and Debt Avalanche methods side by side.
              See your exact payoff order, debt-free date, and how much interest
              you could save — before committing to a plan.
            </p>
            <Link
              href="/settings?tab=billing"
              className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
