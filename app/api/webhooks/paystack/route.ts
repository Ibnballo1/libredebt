/**
 * app/api/webhooks/paystack/route.ts (updated for 2 plans)
 *
 * Same security model as before — HMAC-SHA512 signature verification
 * before any database write. Now also tracks which plan (6month vs 1year)
 * was purchased so we can compute the correct currentPeriodEnd.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyPaystackSignature } from "@/lib/paystack";
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
  return "6month"; // default / fallback
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

        const subscriptionCode = data.subscription_code ?? data.reference;
        const planCode = data.plan?.plan_code ?? data.plan_object?.plan_code;
        const plan = planFromCode(planCode);
        const periodEnd = periodEndFromPlan(plan);

        await activateProSubscription({
          userId,
          provider: "paystack",
          providerSubscriptionId: subscriptionCode,
          providerCustomerId: data.customer?.customer_code ?? null,
          currentPeriodEnd: periodEnd,
          plan,
        });
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
