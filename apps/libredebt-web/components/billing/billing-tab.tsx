"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Check, Sparkles, Clock } from "lucide-react";
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

type PlanKey = "6month" | "1year";

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
  "Track receivables",
];

const PLANS: {
  key: PlanKey;
  label: string;
  price: string;
  perMonth: string;
  badge: string | null;
}[] = [
  {
    key: "6month",
    label: "6 Months",
    price: "₦3,000",
    perMonth: "₦500/mo",
    badge: null,
  },
  {
    key: "1year",
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
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("1year");

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
          toast.success("Subscription canceled");
          setShowCancelDialog(false);
        } else {
          toast.error(data?.error ?? "Failed to cancel");
        }
      },
    },
  );

  if (tier === "pro") {
    return (
      <div className="space-y-6">
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
                  .
                </>
              ) : (
                <>
                  Renews on{" "}
                  <strong className="text-[#0F172A]">
                    {formatDate(subscription.currentPeriodEnd, "long")}
                  </strong>
                  .
                </>
              )}
            </p>
          )}
        </div>

        {/* Features Inclusion List for Pro State */}
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Your Premium Superpowers
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {PRO_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-[#334155]"
              >
                <Check className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
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
              <DialogTitle>Cancel Pro subscription?</DialogTitle>
              <DialogDescription>
                You&apos;ll keep full access until{" "}
                {subscription?.currentPeriodEnd
                  ? formatDate(subscription.currentPeriodEnd, "long")
                  : "your current period ends"}
                .
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                Keep Pro
              </button>
              <button
                onClick={() => cancel()}
                disabled={cancelPending}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                {cancelPending ? "Cancelling…" : "Cancel subscription"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isInTrial && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-amber-800">
            {trialDaysLeft === 0
              ? "Your free trial ends today"
              : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {PLANS.map((plan) => (
          <button
            key={plan.key}
            onClick={() => setSelectedPlan(plan.key)}
            className={cn(
              "relative rounded-xl border-2 p-4 text-left transition-all",
              selectedPlan === plan.key
                ? "border-[#10B981] bg-[#10B981]/5"
                : "border-[#E2E8F0] bg-white",
            )}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-[#10B981] px-2.5 py-0.5 text-[9px] font-bold text-white">
                {plan.badge}
              </span>
            )}
            <p className="text-sm font-bold">{plan.label}</p>
            <p className="text-2xl font-bold">{plan.price}</p>
            <p className="text-xs text-[#64748B]">
              {plan.perMonth} billed once
            </p>
          </button>
        ))}
      </div>

      {/* Features Inclusion List for Free/Checkout State */}
      <div className="rounded-xl border border-[#E2E8F0] p-5 space-y-3 bg-white">
        <p className="text-xs font-bold uppercase tracking-wider text-[#475569]">
          Unlock everything in LibreDebt Pro:
        </p>
        <ul className="space-y-2.5">
          {PRO_FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2.5 text-sm text-[#475569]"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#10B981]/10 shrink-0">
                <Check className="h-3 w-3 text-[#10B981]" />
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => startCheckout({ plan: selectedPlan })}
        disabled={isCheckingOut}
        className="w-full rounded-lg bg-[#10B981] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#059669] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
      >
        {isCheckingOut
          ? "Redirecting to Paystack…"
          : `Pay ${selectedPlan === "6month" ? "₦3,000" : "₦5,500"} with Paystack`}
      </button>
    </div>
  );
}
