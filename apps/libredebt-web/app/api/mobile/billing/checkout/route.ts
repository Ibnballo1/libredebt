/**
 * app/api/mobile/billing/checkout/route.ts
 * POST — create a Paystack checkout session and return the authorization URL
 *
 * Body: { plan: "6month" | "1year" }
 *
 * The mobile app opens this URL in expo-web-browser via
 * WebBrowser.openAuthSessionAsync(), then polls /api/mobile/subscription
 * every 2 seconds until isPro === true.
 *
 * The Paystack callback URL must be registered as a deep link:
 *   libredebt://settings/billing
 * Add this to your Paystack dashboard under Callback URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import {
  initializePaystackTransaction,
  PAYSTACK_PLAN_6M,
  PAYSTACK_PLAN_1Y,
} from "@/lib/paystack";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
const PRICE_6M = 300000; // ₦3,000 in kobo
const PRICE_1Y = 550000; // ₦5,500 in kobo

export async function POST(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { plan } = await request.json();

    if (plan !== "6month" && plan !== "1year") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planCode = plan === "1year" ? PAYSTACK_PLAN_1Y : PAYSTACK_PLAN_6M;
    const amount = plan === "1year" ? PRICE_1Y : PRICE_6M;

    if (!planCode) {
      return NextResponse.json(
        { error: "Payment plans not configured. Contact support." },
        { status: 500 },
      );
    }

    const result = await initializePaystackTransaction({
      email: auth.user.email,
      userId: auth.user.id,
      planCode,
      amount,
      // Deep link so Expo can intercept the callback
      callbackUrl: "libredebt://settings/billing",
    });

    return NextResponse.json({ authorizationUrl: result.authorization_url });
  } catch (error: unknown) {
    // Safely extract message from unknown error
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Could not start checkout";

    console.error("[mobile/billing/checkout] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
