/**
 * server/actions/check-subscription.actions.ts
 *
 * A lightweight Server Action called repeatedly by the payment success
 * page to detect when the webhook has fired and flipped subscriptionTier
 * to 'pro'. Once confirmed, the client stops polling and shows the
 * success state.
 *
 * WHY POLL INSTEAD OF REDIRECT IMMEDIATELY?
 * The Paystack/Stripe redirect happens within 1-3 seconds of payment.
 * The webhook typically fires 2-10 seconds after. If we just redirect
 * on the success URL immediately, the user's tier may still be 'free'
 * because the webhook hasn't landed yet.
 * Polling every 2 seconds for up to 30 seconds covers this window.
 */

"use server";

import { requireUser } from "@/lib/auth-session";
import { getActiveSubscription } from "@/server/services/billing.service";

export async function checkSubscriptionStatusAction() {
  const user = await requireUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  const subscription = await getActiveSubscription(user.id);

  return {
    tier: (user.subscriptionTier ?? "free") as "free" | "pro",
    isPro: user.subscriptionTier === "pro",
    subscription: subscription
      ? {
          provider: subscription.provider as "paystack" | "stripe",
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null,
  };
}
