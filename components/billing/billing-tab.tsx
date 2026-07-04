/**
 * components/billing/billing-tab.tsx (Paystack-only, 2 plans, trial UI)
 *
 * Free/Trial users: two plan cards side by side (6-month vs 1-year)
 *   with a trial countdown banner if still within 3 days of signup.
 * Pro users: current plan card + renewal date + cancel option.
 */

"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Check, Sparkles, Clock, Zap } from "lucide-react";
import {
  startPaystackCheckoutAction,
  cancelSubscriptionAction,
} from "@/server/actions/billing.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, cn } from "@/lib/utils";

type BillingTabProps = {
  tier: "free" | "pro";
  trialDaysLeft: number;
  isInTrial: boolean;
  subscription: {
    provider: "paystack";
    status: string;
    currentPeriodEnd: Date | null;
  } | null;
};

const PRO_FEATURES = [
  "Unlimited debts",
  "Smart payment reminders",
  "Debt Snowball & Avalanche strategies",
  "What-if payoff simulations",
  "Advanced analytics & charts",
  "CSV & PDF data exports",
  "Track receivables (people who owe you)",
];

const PLANS = [
  {
    key: "6month" as const,
    label: "6 Months",
    price: "₦3,000",
    perMonth: "₦500/mo",
    badge: null,
  },
  {
    key: "1year" as const,
    label: "1 Year",
    price: "₦5,500",
    perMonth: "₦458/mo",
    badge: "Best value — save ₦500",
  },
];

export function BillingTab({
  tier,
  trialDaysLeft,
  isInTrial,
  subscription,
}: BillingTabProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"6month" | "1year">("1year");

  const { execute: startCheckout, isPending: isCheckingOut } = useAction(
    startPaystackCheckoutAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          toast.error(data?.error ?? "Could not start checkout");
        }
      },
    },
  );

  const { execute: cancel, isPending: cancelPending } = useAction(
    cancelSubscriptionAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Subscription canceled", { description: data.message });
          setShowCancelDialog(false);
        } else {
          toast.error(data?.error ?? "Failed to cancel");
        }
      },
    },
  );

  // ── Pro state ────────────────────────────────────────────────────────────────
  if (tier === "pro") {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10B981]/15">
                <Sparkles className="h-4 w-4 text-[#10B981]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  LibreDebt Pro
                </p>
                <p className="text-xs text-[#64748B]">via Paystack</p>
              </div>
            </div>
            <span className="rounded-full bg-[#10B981]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#10B981]">
              {subscription?.status === "canceled" ? "Ending soon" : "Active"}
            </span>
          </div>

          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-[#475569]">
              {subscription.status === "canceled" ? (
                <>
                  Pro access ends on{" "}
                  <strong className="text-[#0F172A]">
                    {formatDate(subscription.currentPeriodEnd, "long")}
                  </strong>
                  . You won&apos;t be charged again.
                </>
              ) : (
                <>
                  Renews on{" "}
                  <strong className="text-[#0F172A]">
                    {formatDate(subscription.currentPeriodEnd, "long")}
                  </strong>
                </>
              )}
            </p>
          )}
        </div>

        {subscription?.status !== "canceled" && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="text-sm font-medium text-[#94A3B8] hover:text-red-500 transition-colors"
          >
            Cancel subscription
          </button>
        )}

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel your Pro subscription?</DialogTitle>
              <DialogDescription>
                You&apos;ll keep full Pro access until the end of your current
                billing period
                {subscription?.currentPeriodEnd &&
                  ` (${formatDate(subscription.currentPeriodEnd, "long")})`}
                . After that your account moves to the free plan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelPending}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Keep Pro
              </button>
              <button
                onClick={() => cancel()}
                disabled={cancelPending}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
              >
                {cancelPending ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : null}
                {cancelPending ? "Cancelling…" : "Cancel subscription"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Free / Trial state ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Trial countdown banner */}
      {isInTrial && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {trialDaysLeft === 0
                ? "Your free trial ends today"
                : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial`}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Upgrade now to keep full access to all Pro features.
            </p>
          </div>
        </div>
      )}

      {/* Feature list */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-3">
          Everything in Pro
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRO_FEATURES.map((f) => (
            <div
              key={f}
              className="flex items-center gap-2 text-sm text-[#475569]"
            >
              <Check className="h-3.5 w-3.5 text-[#10B981] flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Plan selector */}
      <div className="grid grid-cols-2 gap-4">
        {PLANS.map((plan) => (
          <button
            key={plan.key}
            onClick={() => setSelectedPlan(plan.key)}
            className={cn(
              "relative rounded-xl border-2 p-4 text-left transition-all",
              selectedPlan === plan.key
                ? "border-[#10B981] bg-[#10B981]/5 shadow-md shadow-[#10B981]/10"
                : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]",
            )}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-[#10B981] px-2.5 py-0.5 text-[9px] font-bold text-white">
                {plan.badge}
              </span>
            )}
            <p className="text-sm font-bold text-[#0F172A] mt-1">
              {plan.label}
            </p>
            <p className="text-2xl font-bold text-[#0F172A] mt-1">
              {plan.price}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">
              {plan.perMonth} billed once
            </p>

            {selectedPlan === plan.key && (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981]">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Pay button */}
      <button
        onClick={() => startCheckout({ plan: selectedPlan })}
        disabled={isCheckingOut}
        className={cn(
          "w-full rounded-lg bg-[#10B981] px-4 py-3.5 text-sm font-semibold text-white",
          "hover:bg-[#059669] transition-colors disabled:opacity-50",
          "flex items-center justify-center gap-2",
        )}
      >
        {isCheckingOut ? (
          <>
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Redirecting to Paystack…
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Pay {selectedPlan === "6month" ? "₦3,000" : "₦5,500"} with Paystack
          </>
        )}
      </button>

      <p className="text-xs text-[#94A3B8] text-center">
        Secure payment via Paystack. Accepts cards, bank transfers & USSD.
        Cancel anytime.
      </p>
    </div>
  );
}
