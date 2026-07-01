/**
 * components/billing/billing-tab.tsx
 *
 * The billing tab content inside /settings.
 * Two states:
 *   - Free user: shows Free vs Pro comparison, two checkout buttons
 *     (Paystack for NGN, Stripe for everything else)
 *   - Pro user: shows current plan, renewal date, cancel button
 */

"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Check, Sparkles, AlertTriangle } from "lucide-react";
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
  currency: string;
  subscription: {
    provider: "paystack" | "stripe";
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
];

export function BillingTab({ tier, currency, subscription }: BillingTabProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { execute: startPaystack, isPending: paystackPending } = useAction(
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

  // const { execute: startStripe, isPending: stripePending } = useAction(
  //   startStripeCheckoutAction,
  //   {
  //     onSuccess: ({ data }) => {
  //       if (data?.success && data.redirectUrl) {
  //         window.location.href = data.redirectUrl;
  //       } else {
  //         toast.error(data?.error ?? "Could not start checkout");
  //       }
  //     },
  //   },
  // );

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
                <p className="text-xs text-[#64748B]">
                  via{" "}
                  {subscription?.provider === "stripe" ? "Stripe" : "Paystack"}
                </p>
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
                  Your Pro access ends on{" "}
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
                . After that, your account moves to the Free plan and premium
                features will be disabled.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelPending}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
              >
                Keep Pro
              </button>
              <button
                onClick={() => cancel()}
                disabled={cancelPending}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {cancelPending ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Cancelling…
                  </>
                ) : (
                  "Cancel subscription"
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border-2 border-[#10B981] bg-white p-6 relative shadow-lg shadow-[#10B981]/10">
        <div className="absolute -top-3 left-6 rounded-full bg-[#10B981] px-3 py-0.5 text-[10px] font-bold text-white">
          Recommended
        </div>

        <div className="flex items-end gap-1 mb-1">
          <p className="text-3xl font-bold text-[#0F172A]">
            {currency === "NGN" ? "₦150" : "$0.89"}
          </p>
          <p className="text-sm text-[#64748B] mb-1">/month</p>
        </div>
        <p className="text-sm text-[#64748B] mb-5">
          Cancel anytime. Keep access until period end.
        </p>

        <ul className="space-y-2.5 mb-6">
          {PRO_FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2.5 text-sm text-[#475569]"
            >
              <Check className="h-4 w-4 text-[#10B981] flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="space-y-2.5">
          {currency === "NGN" && (
            <>
              <button
                onClick={() => startPaystack()}
                disabled={paystackPending}
                className={cn(
                  "w-full rounded-lg bg-[#10B981] px-4 py-3 text-sm font-semibold text-white",
                  "hover:bg-[#059669] transition-colors disabled:opacity-50",
                  "flex items-center justify-center gap-2",
                )}
              >
                {paystackPending ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : null}
                Pay with Paystack
              </button>
              {/* <button
                onClick={() => startStripe()}
                disabled={stripePending}
                className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
              >
                Pay with card (Stripe)
              </button> */}
            </>
          )}
          {/* <button
              onClick={() => startStripe()}
              disabled={stripePending}
              className={cn(
                "w-full rounded-lg bg-[#10B981] px-4 py-3 text-sm font-semibold text-white",
                "hover:bg-[#059669] transition-colors disabled:opacity-50",
                "flex items-center justify-center gap-2",
              )}
            >
              {stripePending ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              Upgrade with Stripe
            </button> */}
        </div>
      </div>

      <p className="text-xs text-[#94A3B8] text-center flex items-center justify-center gap-1.5">
        <AlertTriangle className="h-3 w-3" />
        You&apos;ll be redirected to a secure checkout page to complete payment
      </p>
    </div>
  );
}
