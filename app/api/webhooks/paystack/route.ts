/**
 * app/api/webhooks/paystack/route.ts — Fully Type-Safe Final Version
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

// ── Strict Paystack Payload Types ─────────────────────────────────────────────

interface PaystackCustomField {
  variable_name: string;
  display_name: string;
  value: string | number;
}

interface PaystackMetadata {
  userId?: string;
  custom_fields?: PaystackCustomField[];
  [key: string]: unknown;
}

interface PaystackCustomer {
  customer_code: string;
  email: string;
  [key: string]: unknown;
}

interface PaystackPlanObject {
  id: number;
  name: string;
  plan_code: string;
}

interface PaystackEventData {
  reference?: string;
  subscription_code?: string;
  plan_code?: string;
  plan?: string | PaystackPlanObject | null;
  plan_object?: PaystackPlanObject | null;
  customer?: PaystackCustomer | null;
  metadata?: PaystackMetadata | null;
  subscription?: {
    subscription_code?: string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

interface PaystackWebhookEvent {
  event: string;
  data: PaystackEventData;
}

// ── Helper Utilities ──────────────────────────────────────────────────────────

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

/**
 * Extracts userId securely from Paystack's metadata structure formats.
 */
function extractUserId(
  metadata: PaystackMetadata | null | undefined,
): string | undefined {
  if (!metadata) return undefined;

  // Format A: Direct key lookup
  if (typeof metadata.userId === "string" && metadata.userId) {
    return metadata.userId;
  }

  // Format B: Nested custom_fields array lookup
  if (Array.isArray(metadata.custom_fields)) {
    const field = metadata.custom_fields.find(
      (f: PaystackCustomField) =>
        f.variable_name === "userId" || f.display_name === "userId",
    );
    if (field?.value) return String(field.value);
  }

  return undefined;
}

// ── Main Route POST Handler ───────────────────────────────────────────────────

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

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.event) {
      case "charge.success": {
        const data = event.data;
        const userId = extractUserId(data.metadata);

        if (!userId) {
          console.error(
            "[paystack webhook] charge.success — userId not found in metadata:",
            JSON.stringify(data.metadata),
          );
          break;
        }

        const reference = data.reference ?? "";
        const subCode = data.subscription_code;
        const subscriptionCode = subCode || reference;

        // Parse plan_code safely across polymorphic structural variants
        let planCode = "";
        if (typeof data.plan === "string") {
          planCode = data.plan;
        } else if (data.plan && typeof data.plan === "object") {
          planCode = data.plan.plan_code;
        } else if (data.plan_object) {
          planCode = data.plan_object.plan_code;
        } else if (typeof data.plan_code === "string") {
          planCode = data.plan_code;
        }

        const plan = planFromCode(planCode);
        const periodEnd = periodEndFromPlan(plan);

        console.log(
          `[paystack webhook] charge.success processing: userId=${userId}, subCode=${subscriptionCode}`,
        );

        // Parity Check: Ensure we check both transaction tags to prevent row duplication
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

        if (existing.length > 0) {
          await db
            .update(subscriptions)
            .set({
              status: "active",
              providerSubscriptionId: subscriptionCode,
              providerCustomerId: data.customer?.customer_code ?? null,
              currentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existing[0]!.id));
        } else {
          await activateProSubscription({
            userId,
            provider: "paystack",
            providerSubscriptionId: subscriptionCode,
            providerCustomerId: data.customer?.customer_code ?? null,
            currentPeriodEnd: periodEnd,
            plan,
          });
        }
        break;
      }

      case "subscription.create": {
        const data = event.data;
        const userId = extractUserId(data.metadata);

        if (!userId) {
          console.warn(
            "[paystack webhook] subscription.create — no userId found in metadata matrix.",
          );
          break;
        }

        const subscriptionCode = data.subscription_code ?? "";
        const planCode =
          data.plan && typeof data.plan === "object" ? data.plan.plan_code : "";
        const plan = planFromCode(planCode);
        const periodEnd = periodEndFromPlan(plan);

        console.log(
          `[paystack webhook] subscription.create processing: userId=${userId}, subCode=${subscriptionCode}`,
        );

        const existing = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.providerSubscriptionId, subscriptionCode))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(subscriptions)
            .set({
              status: "active",
              currentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existing[0]!.id));
        } else {
          await activateProSubscription({
            userId,
            provider: "paystack",
            providerSubscriptionId: subscriptionCode,
            providerCustomerId: data.customer?.customer_code ?? null,
            currentPeriodEnd: periodEnd,
            plan,
          });
        }
        break;
      }

      case "subscription.not_renew": {
        const subCode = event.data.subscription_code;
        if (subCode) {
          const userId = await findUserIdBySubscriptionId(subCode);
          if (userId) {
            console.log(
              `[paystack webhook] subscription.not_renew — userId=${userId}`,
            );
          }
        }
        break;
      }

      case "subscription.disable": {
        const subCode = event.data.subscription_code;
        if (subCode) {
          const userId = await findUserIdBySubscriptionId(subCode);
          if (userId) await downgradeToFree(userId);
        }
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
        console.log(
          `[paystack webhook] Unhandled event structure: ${event.event}`,
        );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[paystack webhook] Processing error:", error);
    return NextResponse.json({ received: true, processingError: true });
  }
}
