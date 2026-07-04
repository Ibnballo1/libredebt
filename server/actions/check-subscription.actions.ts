// /**
//  * server/actions/check-subscription.actions.ts (updated)
//  *
//  * Now also returns trial info so the payment-success-overlay and billing
//  * tab can show the trial countdown accurately.
//  */

// "use server";

// import { requireUser } from "@/lib/auth-session";
// import {
//   getActiveSubscription,
//   isInTrial,
//   trialDaysRemaining,
//   trialEndsAt,
// } from "@/server/services/billing.service";

// export async function checkSubscriptionStatusAction() {
//   const user = await requireUser();
//   if (!user) {
//     throw new Error("User not found");
//   }
//   const subscription = await getActiveSubscription(user.id);
//   const inTrial = isInTrial(user.createdAt);

//   return {
//     tier: (user.subscriptionTier ?? "free") as "free" | "pro",
//     isPro: user.subscriptionTier === "pro",
//     isInTrial: inTrial,
//     trialDaysLeft: trialDaysRemaining(user.createdAt),
//     trialEndsAt: trialEndsAt(user.createdAt),
//     subscription: subscription
//       ? {
//           provider: subscription.provider as "paystack",
//           status: subscription.status,
//           currentPeriodEnd: subscription.currentPeriodEnd,
//         }
//       : null,
//   };
// }

/**
 * server/actions/check-subscription.actions.ts (updated)
 *
 * Now also returns trial info so the payment-success-overlay and billing
 * tab can show the trial countdown accurately.
 */

"use server";

import { requireUser } from "@/lib/auth-session";
import {
  getActiveSubscription,
  isInTrial,
  trialDaysRemaining,
  trialEndsAt,
} from "@/server/services/billing.service";

export async function checkSubscriptionStatusAction() {
  const user = await requireUser();

  if (!user) {
    throw new Error("User not found");
  }

  const subscription = await getActiveSubscription(user.id);
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
}
