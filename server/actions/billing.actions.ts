// /**
//  * server/actions/billing.actions.ts (Paystack-only)
//  *
//  * Two checkout actions (one per plan) and a cancellation action.
//  * Stripe actions removed entirely.
//  */

// "use server";

// import { z } from "zod";
// import { createSafeActionClient } from "next-safe-action";
// import { requireUser } from "@/lib/auth-session";
// import { APP_URL } from "@/lib/resend";
// import {
//   initializePaystackTransaction,
//   PAYSTACK_PLAN_6M,
//   PAYSTACK_PLAN_1Y,
// } from "@/lib/paystack";
// import { getActiveSubscription } from "@/server/services/billing.service";
// import { db } from "@/db";
// import { subscriptions } from "@/db/schema";
// import { eq } from "drizzle-orm";

// const authAction = createSafeActionClient().use(async ({ next }) => {
//   const user = await requireUser();
//   if (!user) {
//     throw new Error("Unauthorized");
//   }
//   return next({ ctx: { userId: user.id, userEmail: user.email } });
// });

// const planSchema = z.object({
//   plan: z.enum(["6month", "1year"]),
// });

// // ── Start checkout ──────────────────────────────────────────────────────────────

// export const startPaystackCheckoutAction = authAction
//   .inputSchema(planSchema)
//   .action(async ({ parsedInput, ctx }) => {
//     const { userId, userEmail } = ctx;
//     const planCode =
//       parsedInput.plan === "6month" ? PAYSTACK_PLAN_6M : PAYSTACK_PLAN_1Y;

//     if (!planCode) {
//       return {
//         success: false as const,
//         error: "Payment plan is not configured. Please contact support.",
//       };
//     }

//     try {
//       const result = await initializePaystackTransaction({
//         email: userEmail,
//         userId,
//         planCode,
//         callbackUrl: `${APP_URL}/settings?tab=billing&status=success`,
//       });
//       return { success: true as const, redirectUrl: result.authorization_url };
//     } catch (error) {
//       console.error("[billing] Paystack init error:", error);
//       return {
//         success: false as const,
//         error: "Could not start checkout. Please try again.",
//       };
//     }
//   });

// // ── Cancel subscription ─────────────────────────────────────────────────────────

// export const cancelSubscriptionAction = authAction.action(async ({ ctx }) => {
//   const { userId } = ctx;

//   const subscription = await getActiveSubscription(userId);
//   if (!subscription || subscription.status !== "active") {
//     return { success: false as const, error: "No active subscription found." };
//   }

//   try {
//     // Mark as canceled in our DB — Paystack will fire subscription.not_renew
//     // and subscription.disable webhooks to confirm, which will downgrade the
//     // user via the webhook handler when the period actually ends.
//     await db
//       .update(subscriptions)
//       .set({ status: "canceled", canceledAt: new Date() })
//       .where(eq(subscriptions.id, subscription.id));

//     return {
//       success: true as const,
//       message:
//         "Your subscription will end at the close of the current billing period. You'll keep Pro access until then.",
//     };
//   } catch (error) {
//     console.error("[billing] Cancel error:", error);
//     return {
//       success: false as const,
//       error: "Could not cancel. Please try again or contact support.",
//     };
//   }
// });

/**
 * server/actions/billing.actions.ts (Paystack-only)
 *
 * Two checkout actions (one per plan) and a cancellation action.
 * Stripe actions removed entirely.
 */

"use server";

import { z } from "zod";
import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import { APP_URL } from "@/lib/resend";
import {
  initializePaystackTransaction,
  PAYSTACK_PLAN_6M,
  PAYSTACK_PLAN_1Y,
} from "@/lib/paystack";
import { getActiveSubscription } from "@/server/services/billing.service";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const authAction = createSafeActionClient().use(async ({ next }) => {
  const user = await requireUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return next({ ctx: { userId: user.id, userEmail: user.email } });
});

const planSchema = z.object({
  plan: z.enum(["6month", "1year"]),
});

// ── Start checkout ──────────────────────────────────────────────────────────────

export const startPaystackCheckoutAction = authAction
  .inputSchema(planSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userEmail } = ctx;
    const planCode =
      parsedInput.plan === "6month" ? PAYSTACK_PLAN_6M : PAYSTACK_PLAN_1Y;

    if (!planCode) {
      return {
        success: false as const,
        error: "Payment plan is not configured. Please contact support.",
      };
    }

    try {
      const result = await initializePaystackTransaction({
        email: userEmail,
        userId,
        planCode,
        // callbackUrl: `${APP_URL}/settings?tab=billing&status=success`,
        callbackUrl: `${APP_URL}/api/paystack-callback`,
      });
      return { success: true as const, redirectUrl: result.authorization_url };
    } catch (error) {
      console.error("[billing] Paystack init error:", error);
      return {
        success: false as const,
        // error: "Could not start checkout. Please try again.",
        error:
          error instanceof Error
            ? error.message
            : "Could not start checkout. Please try again.",
      };
    }
  });

// ── Cancel subscription ─────────────────────────────────────────────────────────

export const cancelSubscriptionAction = authAction.action(async ({ ctx }) => {
  const { userId } = ctx;

  const subscription = await getActiveSubscription(userId);
  if (!subscription || subscription.status !== "active") {
    return { success: false as const, error: "No active subscription found." };
  }

  try {
    // Mark as canceled in our DB — Paystack will fire subscription.not_renew
    // and subscription.disable webhooks to confirm, which will downgrade the
    // user via the webhook handler when the period actually ends.
    await db
      .update(subscriptions)
      .set({ status: "canceled", canceledAt: new Date() })
      .where(eq(subscriptions.id, subscription.id));

    return {
      success: true as const,
      message:
        "Your subscription will end at the close of the current billing period. You'll keep Pro access until then.",
    };
  } catch (error) {
    console.error("[billing] Cancel error:", error);
    return {
      success: false as const,
      error: "Could not cancel. Please try again or contact support.",
    };
  }
});
