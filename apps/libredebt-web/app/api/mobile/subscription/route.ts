/**
 * app/api/mobile/subscription/route.ts
 * GET — current subscription status, trial info, and plan details
 *
 * This is the endpoint the mobile app polls after Paystack checkout
 * to confirm Pro activation (same polling pattern as the web overlay).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import {
  getActiveSubscription,
  isInTrial,
  trialDaysRemaining,
} from "@/server/services/billing.service";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    // Fetch fresh user row — auth.user may be a cached session snapshot
    // that doesn't reflect a recent webhook-triggered tier change
    const freshRows = await db
      .select({
        subscriptionTier: users.subscriptionTier,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, auth.user.id))
      .limit(1);

    const fresh = freshRows[0];
    if (!fresh) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscription = await getActiveSubscription(auth.user.id);
    const inTrial = isInTrial(fresh.createdAt);
    const daysLeft = trialDaysRemaining(fresh.createdAt);

    return NextResponse.json({
      tier: fresh.subscriptionTier ?? "free",
      isPro: fresh.subscriptionTier === "pro",
      isInTrial: inTrial,
      trialDaysLeft: daysLeft,
      subscription: subscription
        ? {
            provider: subscription.provider,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
    });
  } catch (error) {
    console.error("[mobile/subscription] error:", error);
    return NextResponse.json(
      { error: "Failed to load subscription" },
      { status: 500 },
    );
  }
}
