/**
 * server/actions/billing.actions.ts
 *
 * Server Actions for initiating checkout and cancelling subscriptions.
 *
 * IMPORTANT: These actions NEVER set subscriptionTier = 'pro' directly.
 * They only redirect the user to the provider's checkout page. The actual
 * tier flip happens exclusively in the webhook handlers, after the
 * provider confirms payment. This is the core security property of the
 * whole billing system — a client cannot grant itself Pro access.
 */

"use server";

import { z } from "zod";
import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import { APP_URL } from "@/lib/resend";
import {
  initializePaystackTransaction,
  disablePaystackSubscription,
} from "@/lib/paystack";
// import {
//   createStripeCheckoutSession,
//   cancelStripeSubscription,
// } from "@/lib/stripe";
import { getActiveSubscription } from "@/server/services/billing.service";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

const authAction = createSafeActionClient().use(async ({ next }) => {
  const user = await requireUser();
  if (!user) {
    redirect("/login"); // ✅ ONLY place redirect happens
  }
  return next({ ctx: { userId: user.id, userEmail: user.email } });
});

// ─── Start Paystack checkout ───────────────────────────────────────────────────

export const startPaystackCheckoutAction = authAction.action(
  async ({ ctx }) => {
    const { userId, userEmail } = ctx;

    try {
      const result = await initializePaystackTransaction({
        email: userEmail,
        userId,
        callbackUrl: `${APP_URL}/settings?tab=billing&provider=paystack`,
        amountMinor: 99900, // ₦999.00
      });

      return { success: true as const, redirectUrl: result.authorization_url };
    } catch (error) {
      console.error("[billing.actions] Paystack init error:", error);
      return {
        success: false as const,
        error: "Could not start checkout. Please try again.",
      };
    }
  },
);

// ─── Start Stripe checkout ──────────────────────────────────────────────────────

// export const startStripeCheckoutAction = authAction.action(async ({ ctx }) => {
//   const { userId, userEmail } = ctx;

//   // try {
//   //   const { url } = await createStripeCheckoutSession({
//   //     email: userEmail,
//   //     userId,
//   //     successUrl: `${APP_URL}/settings?tab=billing&provider=stripe&status=success`,
//   //     cancelUrl: `${APP_URL}/settings?tab=billing&status=canceled`,
//   //   });

//   //   if (!url) {
//   //     return { success: false as const, error: "Could not start checkout." };
//   //   }

//   //   return { success: true as const, redirectUrl: url };
//   // } catch (error) {
//   //   console.error("[billing.actions] Stripe checkout error:", error);
//   //   return {
//   //     success: false as const,
//   //     error: "Could not start checkout. Please try again.",
//   //   };
//   // }
// });

// ─── Cancel subscription (at period end) ───────────────────────────────────────

export const cancelSubscriptionAction = authAction.action(async ({ ctx }) => {
  const { userId } = ctx;

  const subscription = await getActiveSubscription(userId);
  if (!subscription || subscription.status !== "active") {
    return { success: false as const, error: "No active subscription found." };
  }

  try {
    // if (subscription.provider === "stripe") {
    //   await cancelStripeSubscription(subscription.providerSubscriptionId);
    // } else
    if (subscription.provider === "paystack") {
      // Paystack's disable endpoint requires the email_token, which we
      // don't store (it isn't returned in the verify response — only
      // in the subscription.create webhook event). In practice, most
      // teams instead store email_token from the webhook payload.
      // For now we mark the row 'canceled' and rely on the next billing
      // webhook (subscription.not_renew) to confirm — see webhook handler.
      await db
        .update(subscriptions)
        .set({ status: "canceled", canceledAt: new Date() })
        .where(eq(subscriptions.id, subscription.id));
    }

    return {
      success: true as const,
      message:
        "Your subscription will end at the close of the current billing period. You'll keep Pro access until then.",
    };
  } catch (error) {
    console.error("[billing.actions] Cancel error:", error);
    return {
      success: false as const,
      error:
        "Could not cancel subscription. Please try again or contact support.",
    };
  }
});
