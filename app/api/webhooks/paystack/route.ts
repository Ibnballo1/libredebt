/**
 * app/api/webhooks/paystack/route.ts (updated for sync parity)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyPaystackSignature } from "@/lib/paystack";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import {
  activateProSubscription,
  downgradeToFree,
  markPastDue,
  findUserIdBySubscriptionId,
} from "@/server/services/billing.service";
import type { BillingPlan } from "@/server/services/billing.service";

export const dynamic = "force-dynamic";

function planFromCode(planCode?: string): BillingPlan {
  const code = planCode ?? "";
  if (code === process.env.PAYSTACK_PLAN_1Y) return "1year";
  return "6month";
}

function periodEndFromPlan(plan: BillingPlan): Date {
  const d = new Date();
  if (plan === "1year") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 6);
  }
  return d;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!signature)
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });

  const isValid = await verifyPaystackSignature(rawBody, signature);
  if (!isValid)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(rawBody);

  // 1. Idempotency Guardrail: Check if we already processed this event
  const existingEvent = await db
    .select({ id: subscriptions.lastWebhookEventId })
    .from(subscriptions)
    .where(eq(subscriptions.lastWebhookEventId, event.id))
    .limit(1);

  if (existingEvent.length > 0) {
    return NextResponse.json({ received: true, message: "Already processed" });
  }

  try {
    switch (event.event) {
      case "charge.success": {
        const data = event.data;
        const userId: string | undefined = data.metadata?.userId;
        const subCode = data.subscription_code;
        const reference = data.reference;
        const identifier = subCode ?? reference;

        if (!userId) break;

        const plan = planFromCode(
          data.plan?.plan_code ?? data.plan_object?.plan_code,
        );
        const periodEnd = periodEndFromPlan(plan);

        // Update with event ID tracking
        await db
          .update(subscriptions)
          .set({
            status: "active",
            currentPeriodEnd: periodEnd,
            lastWebhookEventId: event.id,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.providerSubscriptionId, identifier));

        // Fallback for new subscriptions
        // (You might want to check if the update affected 0 rows, then insert)
        break;
      }

      // ... [Keep other cases, but add lastWebhookEventId update to them]

      case "subscription.disable": {
        const subCode = event.data.subscription_code;
        const userId = await findUserIdBySubscriptionId(subCode);
        if (userId) {
          await downgradeToFree(userId);
          // Update the record with the latest event ID
          await db
            .update(subscriptions)
            .set({ lastWebhookEventId: event.id })
            .where(eq(subscriptions.providerSubscriptionId, subCode));
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[paystack webhook] Processing error:", error);
    return NextResponse.json({ received: true }, { status: 500 });
  }
}
