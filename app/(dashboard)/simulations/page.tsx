/**
 * app/(dashboard)/simulations/page.tsx — What-If Simulations Page
 *
 * Free users see an upgrade gate.
 * Pro users with no debts see a prompt to add debts.
 * Pro users with debts get the interactive slider.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Sliders, CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import {
  runWhatIfSimulation,
  getSimulationPreviewPoints,
} from "@/server/services/simulation.service";
import { Navbar } from "@/components/layout/navbar";
import { EmptyState } from "@/components/shared";
import { WhatIfSimulator } from "@/components/simulation/what-if-simulator";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Simulations" };

export default async function SimulationsPage() {
  const user = await requireUser();
  if (!user) {
    redirect("/login"); // ✅ ONLY place redirect happens
  }
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  if (tier === "free") {
    return <FreeUpgradeGate />;
  }

  // Initial render: no extra amount yet (baseline only, delta = 0)
  const initialResult = await runWhatIfSimulation(user.id, 0);
  const previewPoints = await getSimulationPreviewPoints(user.id);

  return (
    <div className="flex flex-col flex-1">
      <Navbar
        title="Simulations"
        description="See how extra payments change your payoff timeline"
        tier={tier}
      />

      <div className="flex-1 p-6 max-w-4xl">
        {!initialResult.hasDebts ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <EmptyState
              icon={CreditCard}
              title="No active debts to simulate"
              description="Add at least one debt to explore what-if scenarios."
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
          <WhatIfSimulator
            initialResult={initialResult}
            previewPoints={previewPoints}
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
      <Navbar title="Simulations" tier="free" />
      <div className="flex-1 p-6 flex items-start justify-center">
        <div className="max-w-lg w-full mt-8">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/10 mx-auto mb-5">
              <Sliders className="h-5 w-5 text-[#10B981]" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
              See the future of your debt before you pay it
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
              Drag a slider to see exactly how much time and interest you&apos;d
              save by paying a little extra each month. Real numbers, calculated
              from your actual debts.
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
