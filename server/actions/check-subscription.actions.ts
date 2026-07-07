/**
 * server/actions/check-subscription.actions.ts (updated for sync fallback)
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

    // 1. Fallback sync: if DB is not active yet, but we have a transaction reference, double check with Paystack directly
    if (
      (!subscription || subscription.status !== "active") &&
      parsedInput.reference
    ) {
      try {
        const txData = await verifyPaystackTransaction(parsedInput.reference);

        if (txData && txData.status === "success") {
          const isOneYear = txData.plan?.plan_code === PAYSTACK_PLAN_1Y;
          const periodEnd = new Date();
          if (isOneYear) {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 6);
          }

          // Securely write to DB right away to beat the lagging webhook
          await activateProSubscription({
            userId: user.id,
            provider: "paystack",
            providerSubscriptionId: parsedInput.reference,
            providerCustomerId: txData.customer?.customer_code ?? null,
            currentPeriodEnd: periodEnd,
            plan: isOneYear ? "1year" : "6month",
          });

          // Re-fetch subscription row now that it's inserted
          subscription = await getActiveSubscription(user.id);
          user.subscriptionTier = "pro"; // update reference value for return layout
        }
      } catch (err) {
        console.error(
          "[billing_poll] Live fallback verification check failed:",
          err,
        );
      }
    }

    const inTrial = isInTrial(user.createdAt);

    return {
      tier: (user.subscriptionTier ?? "free") as "free" | "pro",
      isPro: user.subscriptionTier === "pro",
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
