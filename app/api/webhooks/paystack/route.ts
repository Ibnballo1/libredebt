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

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const isValid = await verifyPaystackSignature(rawBody, signature);
  if (!isValid) {
    console.error("[paystack webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  try {
    switch (event.event) {
      case "charge.success": {
        const data = event.data;
        const userId: string | undefined = data.metadata?.userId;
        if (!userId) {
          console.error(
            "[paystack webhook] charge.success missing userId in metadata",
          );
          break;
        }

        const planCode = data.plan?.plan_code ?? data.plan_object?.plan_code;
        const plan = planFromCode(planCode);
        const periodEnd = periodEndFromPlan(plan);

        // Deduce if a previous record was created by reference or sub_code
        const reference = data.reference;
        const subCode = data.subscription_code;

        // Check if an entry already exists under either tracking key
        const existing = await db
          .select()
          .from(subscriptions)
          .where(
            or(
              eq(subscriptions.providerSubscriptionId, reference),
              subCode
                ? eq(subscriptions.providerSubscriptionId, subCode)
                : undefined,
            ),
          )
          .limit(1);

        if (existing.length > 0 && existing[0]) {
          // Update the existing row and ensure it saves the official subscription code for future event handling
          await db
            .update(subscriptions)
            .set({
              status: "active",
              providerSubscriptionId: subCode ?? reference, // prefer long-term sub code if available
              providerCustomerId: data.customer?.customer_code ?? null,
              currentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existing[0].id));
        } else {
          // No row existed yet, safe to build fresh
          await activateProSubscription({
            userId,
            provider: "paystack",
            providerSubscriptionId: subCode ?? reference,
            providerCustomerId: data.customer?.customer_code ?? null,
            currentPeriodEnd: periodEnd,
            plan,
          });
        }
        break;
      }

      case "subscription.not_renew": {
        const subscriptionCode = event.data.subscription_code;
        const userId = await findUserIdBySubscriptionId(subscriptionCode);
        if (userId) {
          console.log(
            `[paystack webhook] Sub ${subscriptionCode} set to not renew for ${userId}`,
          );
        }
        break;
      }

      case "subscription.disable": {
        const subscriptionCode = event.data.subscription_code;
        const userId = await findUserIdBySubscriptionId(subscriptionCode);
        if (userId) await downgradeToFree(userId);
        break;
      }

      case "invoice.payment_failed": {
        const subCode = event.data.subscription?.subscription_code;
        if (subCode) {
          const userId = await findUserIdBySubscriptionId(subCode);
          if (userId) await markPastDue(userId);
        }
        break;
      }

      default:
        console.log(`[paystack webhook] Unhandled: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[paystack webhook] Processing error:", error);
    return NextResponse.json({ received: true, processingError: true });
  }
}
