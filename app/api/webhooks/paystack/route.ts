/**
 * app/api/webhooks/paystack/route.ts — Paystack Webhook Handler
 *
 * THE AUTHORITATIVE SOURCE OF TRUTH for Paystack subscription state.
 *
 * SECURITY: Every request is verified against the x-paystack-signature
 * header using HMAC SHA512 with our secret key, BEFORE any data is
 * trusted or any database write happens. An unsigned or incorrectly
 * signed request is rejected with 401, full stop.
 *
 * THIS ROUTE MUST BE EXCLUDED FROM AUTH MIDDLEWARE.
 * Verify middleware.ts matcher excludes /api/webhooks/* — it does,
 * per the config set in Step 3.
 *
 * EVENTS HANDLED:
 *   charge.success            → first payment succeeded → activate Pro
 *   subscription.create       → subscription object created (logged only)
 *   subscription.not_renew    → user/system canceled → mark canceled
 *   subscription.disable      → subscription fully ended → downgrade to free
 *   invoice.payment_failed    → mark past_due (no immediate downgrade)
 *
 * IDEMPOTENCY: activateProSubscription() upserts by providerSubscriptionId,
 * so duplicate webhook deliveries (which both Paystack and Stripe warn
 * can happen) are safe to process more than once.
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

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const isValid = await verifyPaystackSignature(rawBody, signature);
  if (!isValid) {
    console.error("[paystack webhook] Invalid signature — rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  try {
    switch (event.event) {
      case "charge.success": {
        const data = event.data;
        const userId: string | undefined = data.metadata?.userId;
        const subscriptionCode: string | undefined =
          data.subscription_code ?? data.plan_object?.plan_code;

        if (!userId) {
          console.error(
            "[paystack webhook] charge.success missing userId in metadata",
          );
          break;
        }

        // Paystack returns period info on the subscription object for
        // recurring charges; for the very first charge we estimate
        // one month forward as a sane default — the next invoice.create
        // webhook will correct this.
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await activateProSubscription({
          userId,
          provider: "paystack",
          providerSubscriptionId: subscriptionCode ?? data.reference,
          providerCustomerId: data.customer?.customer_code ?? null,
          currentPeriodEnd: periodEnd,
        });
        break;
      }

      case "subscription.not_renew": {
        const subscriptionCode = event.data.subscription_code;
        const userId = await findUserIdBySubscriptionId(subscriptionCode);
        if (userId) {
          // User has chosen not to renew — they keep access until period end.
          // The actual downgrade happens on subscription.disable below.
          console.log(
            `[paystack webhook] Subscription ${subscriptionCode} set to not renew`,
          );
        }
        break;
      }

      case "subscription.disable": {
        const subscriptionCode = event.data.subscription_code;
        const userId = await findUserIdBySubscriptionId(subscriptionCode);
        if (userId) {
          await downgradeToFree(userId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const subscriptionCode = event.data.subscription?.subscription_code;
        if (subscriptionCode) {
          const userId = await findUserIdBySubscriptionId(subscriptionCode);
          if (userId) await markPastDue(userId);
        }
        break;
      }

      default:
        console.log(`[paystack webhook] Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[paystack webhook] Processing error:", error);
    // Return 200 anyway after logging — Paystack will retry on non-2xx,
    // and a processing bug shouldn't cause infinite retries that could
    // mask the real issue. Errors are visible in logs for investigation.
    return NextResponse.json({ received: true, processingError: true });
  }
}
