/**
 * server/actions/check-subscription.actions.ts
 */

"use server";

import { z } from "zod";
import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import {
  getActiveSubscription,
  isInTrial,
  trialDaysRemaining,
  trialEndsAt,
  activateProSubscription,
} from "@/server/services/billing.service";
import { verifyPaystackTransaction, PAYSTACK_PLAN_1Y } from "@/lib/paystack";

const checkStatusSchema = z.object({
  reference: z.string().optional().nullable(),
});

export const checkSubscriptionStatusAction = createSafeActionClient()
  .inputSchema(checkStatusSchema)
  .action(async ({ parsedInput }) => {
    const user = await requireUser();
    if (!user) {
      throw new Error("User not found");
    }

    let subscription = await getActiveSubscription(user.id);
    let currentTier = user.subscriptionTier ?? "free";

    // Fallback verification: Run if the DB record hasn't updated yet
    if (
      (!subscription || subscription.status !== "active") &&
      parsedInput.reference
    ) {
      try {
        const txData = await verifyPaystackTransaction(parsedInput.reference);

        // Explicitly reading the nested string status from the data payload
        if (txData && txData.status === "success") {
          // Fallback parsing to find the plan_code securely
          const planCode =
            typeof txData.plan === "string"
              ? txData.plan
              : (txData.plan_object?.plan_code ?? "");

          const isOneYear = planCode === PAYSTACK_PLAN_1Y;
          const periodEnd = new Date();

          if (isOneYear) {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 6);
          }

          // Securely update database metrics
          await activateProSubscription({
            userId: user.id,
            provider: "paystack",
            providerSubscriptionId: parsedInput.reference,
            providerCustomerId: txData.customer?.customer_code ?? null,
            currentPeriodEnd: periodEnd,
            plan: isOneYear ? "1year" : "6month",
          });

          // Re-fetch the row to guarantee state sync before rendering
          subscription = await getActiveSubscription(user.id);
          currentTier = "pro";
        }
      } catch (err) {
        console.error(
          "[billing_poll] Live fallback verification check failed:",
          err,
        );
      }
    }

    const isProUser =
      currentTier === "pro" ||
      (subscription && subscription.status === "active");
    const inTrial = isInTrial(user.createdAt);

    return {
      tier: (isProUser ? "pro" : "free") as "free" | "pro",
      isPro: !!isProUser,
      isInTrial: inTrial,
      trialDaysLeft: trialDaysRemaining(user.createdAt),
      trialEndsAt: trialEndsAt(user.createdAt),
      subscription: subscription
        ? {
            provider: subscription.provider as "paystack",
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
    };
  });
