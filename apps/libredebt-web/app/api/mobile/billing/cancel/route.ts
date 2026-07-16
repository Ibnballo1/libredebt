/**
 * app/api/mobile/billing/cancel/route.ts
 * POST — cancel the current active subscription
 *
 * Marks the subscription as canceled in our DB. Paystack will fire
 * subscription.disable when the period actually ends, which triggers
 * the webhook to downgrade the user to free.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { getActiveSubscription } from "@/server/services/billing.service";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const subscription = await getActiveSubscription(auth.user.id);

    if (!subscription || subscription.status !== "active") {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 },
      );
    }

    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    return NextResponse.json({
      success: true,
      message:
        "Your subscription will end at the close of the current billing period. You keep Pro access until then.",
    });
  } catch (error) {
    console.error("[mobile/billing/cancel] error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
