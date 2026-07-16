/** * app/api/verify-payment/route.ts
 * * Fully Type-Safe Direct Verification Recovery Route
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { activateProSubscription } from "@/server/services/billing.service";
import type { BillingPlan } from "@/server/services/billing.service";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

// ── Strict Paystack API Interfaces ──────────────────────────────────────────

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    subscription_code?: string;
    plan_code?: string;
    plan?: string | { plan_code: string } | null;
    plan_object?: { plan_code: string } | null;
    customer?: {
      customer_code: string;
      email: string;
    } | null;
  };
}

function planFromCode(planCode?: string): BillingPlan {
  if (planCode && planCode === process.env.PAYSTACK_PLAN_1Y) return "1year";
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

export async function GET(request: NextRequest) {
  // 1. Authenticate user cleanly and guard against null sessions
  const user = await requireUser();
  if (!user || !user.email || !user.id) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    // 2. Fetch direct truth state from Paystack endpoint
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const json = (await res.json()) as PaystackVerifyResponse;

    if (!json.status || json.data?.status !== "success" || !json.data) {
      return NextResponse.json({
        verified: false,
        message: "Payment not confirmed by Paystack",
      });
    }

    const data = json.data;

    // 3. Security cross check verification: ensure transaction email matches session user
    if (data.customer?.email?.toLowerCase() !== user.email.toLowerCase()) {
      console.warn(
        `[verify-payment] Email mismatch: session=${user.email}, paystack=${data.customer?.email}`,
      );
      return NextResponse.json({
        verified: false,
        message: "Payment email does not match your account",
      });
    }

    // 4. Extract identifiers safely
    const subscriptionCode =
      data.subscription_code || data.reference || reference;

    let planCode = "";
    if (typeof data.plan === "string") {
      planCode = data.plan;
    } else if (data.plan && typeof data.plan === "object") {
      planCode = data.plan.plan_code;
    } else if (data.plan_object) {
      planCode = data.plan_object.plan_code;
    } else if (data.plan_code) {
      planCode = data.plan_code;
    }

    const plan = planFromCode(planCode);
    const periodEnd = periodEndFromPlan(plan);

    // 5. Commit database record upgrade mutation
    await activateProSubscription({
      userId: user.id,
      provider: "paystack",
      providerSubscriptionId: subscriptionCode,
      providerCustomerId: data.customer?.customer_code ?? null,
      currentPeriodEnd: periodEnd,
      plan,
    });

    console.log(
      `[verify-payment] Activated Pro for userId=${user.id} via direct verify, ref=${reference}`,
    );

    return NextResponse.json({ verified: true, plan, periodEnd });
  } catch (error) {
    console.error("[verify-payment] Error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please contact support." },
      { status: 500 },
    );
  }
}
