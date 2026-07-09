/**
 * server/actions/billing.actions.ts (Paystack-only — FIXED AMOUNT)
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

// ── Base Pricing Configuration (Change these to match your actual pricing) ───
const PRICE_6MONTH_BASE = 3000; // e.g., ₦3,000 or $30
const PRICE_1YEAR_BASE = 100; // e.g., ₦5,500 or $55

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

    const isOneYear = parsedInput.plan === "1year";
    const planCode = isOneYear ? PAYSTACK_PLAN_1Y : PAYSTACK_PLAN_6M;

    // 1. Compute base amount and multiply by 100 to convert to Paystack Subunits
    const baseAmount = isOneYear ? PRICE_1YEAR_BASE : PRICE_6MONTH_BASE;
    const subunitAmount = baseAmount * 100;

    if (!planCode) {
      return {
        success: false as const,
        error: "Payment plan is not configured. Please contact support.",
      };
    }

    try {
      // 2. Pass both the plan code AND the explicit subunit amount parameter
      const result = await initializePaystackTransaction({
        email: userEmail,
        userId,
        planCode,
        amount: subunitAmount, // ◄◄◄ FIXED: Keeps Paystack's endpoint validator happy
        callbackUrl: `${APP_URL}/api/paystack-callback`, // Using our secure redirection proxy route
      });
      return { success: true as const, redirectUrl: result.authorization_url };
    } catch (error) {
      console.error("[billing] Paystack init error:", error);
      return {
        success: false as const,
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
