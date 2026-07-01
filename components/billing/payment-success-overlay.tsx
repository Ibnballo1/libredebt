/**
 * components/billing/payment-success-overlay.tsx
 *
 * Shown when the user lands on /settings?tab=billing&status=success.
 *
 * FLOW:
 *   1. Mounts → polls checkSubscriptionStatusAction() every 2 seconds
 *   2. While waiting: "Confirming your payment..." spinner
 *   3. When isPro === true: full success card + plan details + "Go to dashboard"
 *   4. After 30 seconds without confirmation: timeout state with manual retry
 */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { checkSubscriptionStatusAction } from "@/server/actions/check-subscription.actions";
import { formatDate } from "@/lib/utils";

type SubscriptionInfo = {
  provider: "paystack" | "stripe";
  status: string;
  currentPeriodEnd: Date | null;
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15; // 30 seconds

export function PaymentSuccessOverlay() {
  const router = useRouter();
  const [phase, setPhase] = useState<"polling" | "confirmed" | "timeout">(
    "polling",
  );
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [dots, setDots] = useState(".");
  const pollCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);
    return () => clearInterval(t);
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    pollCountRef.current++;
    try {
      const result = await checkSubscriptionStatusAction();
      if (result?.isPro) {
        stopPolling();
        setSubscription(result.subscription);
        setPhase("confirmed");
        return;
      }
    } catch {
      /* keep polling */
    }
    if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
      stopPolling();
      setPhase("timeout");
    }
  }, [stopPolling]);

  useEffect(() => {
    const initialPoll = setTimeout(() => {
      poll();
    }, 0);
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initialPoll);
      stopPolling();
    };
  }, [poll, stopPolling]);

  if (phase === "polling") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] rounded-xl border border-[#E2E8F0] bg-white p-10 shadow-sm text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10 mb-6">
          <Loader2 className="h-8 w-8 text-[#10B981] animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
          Confirming your payment{dots}
        </h2>
        <p className="text-sm text-[#64748B] max-w-xs leading-relaxed">
          We&apos;re waiting for your payment provider to confirm. This usually
          takes just a few seconds.
        </p>
      </div>
    );
  }

  if (phase === "timeout") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] rounded-xl border border-amber-200 bg-amber-50/50 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mb-5">
          <RefreshCw className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
          Taking a little longer than expected
        </h2>
        <p className="text-sm text-[#64748B] max-w-sm leading-relaxed mb-6">
          Your payment was received but confirmation is taking longer than
          usual. Please check again in a moment — if you paid successfully, your
          Pro access will appear shortly.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => {
              pollCountRef.current = 0;
              setPhase("polling");
              poll();
              intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
            }}
            className="rounded-lg bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors"
          >
            Check again
          </button>
          <button
            onClick={() => router.push("/overview")}
            className="rounded-lg border border-[#E2E8F0] px-5 py-2.5 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
          >
            Go to dashboard anyway
          </button>
        </div>
        <p className="mt-4 text-xs text-[#94A3B8]">
          Need help? Email support@libredebt.com
        </p>
      </div>
    );
  }

  // Confirmed / success state
  return (
    <div className="flex flex-col items-center justify-center min-h-[360px] rounded-xl border-2 border-[#10B981]/30 bg-[#10B981]/5 p-10 text-center">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#10B981]/15">
          <CheckCircle2 className="h-10 w-10 text-[#10B981]" />
        </div>
        <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[#0F172A] mb-2">
        You&apos;re now on Pro!
      </h2>
      <p className="text-sm text-[#64748B] max-w-xs leading-relaxed mb-6">
        Your payment was confirmed successfully. All Pro features are now
        unlocked on your account.
      </p>

      {/* Plan details card */}
      <div className="w-full max-w-xs rounded-xl border border-[#10B981]/20 bg-white p-5 mb-7 text-left">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10B981]/10">
            <Sparkles className="h-4 w-4 text-[#10B981]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A]">LibreDebt Pro</p>
            <p className="text-xs text-[#64748B]">
              via {subscription?.provider === "stripe" ? "Stripe" : "Paystack"}
            </p>
          </div>
          <span className="ml-auto rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#10B981]">
            Active
          </span>
        </div>

        <div className="space-y-2.5">
          {[
            "Unlimited debts",
            "Smart payment reminders",
            "Snowball & Avalanche strategies",
            "What-if simulations",
            "Advanced analytics & charts",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 text-sm text-[#475569]"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        {subscription?.currentPeriodEnd && (
          <p className="mt-4 text-[10px] text-[#94A3B8] border-t border-[#F1F5F9] pt-3">
            Next renewal: {formatDate(subscription.currentPeriodEnd, "long")}
          </p>
        )}
      </div>

      <button
        onClick={() => router.push("/overview")}
        className="w-full max-w-xs rounded-lg bg-[#10B981] px-6 py-3 text-sm font-semibold text-white hover:bg-[#059669] transition-colors"
      >
        Go to dashboard →
      </button>
    </div>
  );
}
