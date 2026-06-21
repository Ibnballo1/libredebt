/**
 * lib/paystack.ts — Paystack Production Client
 *
 * Server-side only integration for managing NGN billing.
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export const PAYSTACK_PRO_PLAN_CODE = process.env.PAYSTACK_PRO_PLAN_CODE ?? "";

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

async function paystackFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<PaystackResponse<T>> {
  // Move check inside the fetch layer so it won't crash Next.js during static build rendering
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error(
      "❌ Environment Configuration Missing: PAYSTACK_SECRET_KEY",
    );
  }

  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = (await res.json()) as PaystackResponse<T>;

  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Paystack request pipeline failed.");
  }

  return json;
}

// ─── Initialize Transaction ──────────────────────────────────────────────────

export type PaystackInitializeResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export async function initializePaystackTransaction(params: {
  email: string;
  userId: string;
  callbackUrl: string;
  amountMinor: number;
}): Promise<PaystackInitializeResult> {
  // Hard break if the plan code didn't load from environment scope variables
  if (!PAYSTACK_PRO_PLAN_CODE) {
    throw new Error(
      "❌ Configuration Error: PAYSTACK_PRO_PLAN_CODE is undefined or empty in your environment variables.",
    );
  }

  const result = await paystackFetch<PaystackInitializeResult>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        plan: PAYSTACK_PRO_PLAN_CODE,
        amount: params.amountMinor,
        callback_url: params.callbackUrl,
        metadata: { userId: params.userId },
      }),
    },
  );

  return result.data;
}

// ─── Verify Transaction ─────────────────────────────────────────────────────

export type PaystackVerifyResult = {
  status: string;
  reference: string;
  customer: { email: string };
  metadata: { userId?: string };
  plan: string;
  subscription_code?: string;
};

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResult> {
  const result = await paystackFetch<PaystackVerifyResult>(
    `/transaction/verify/${reference}`,
  );
  return result.data;
}

// ─── Cancel Subscription ─────────────────────────────────────────────────────

export async function disablePaystackSubscription(
  subscriptionCode: string,
  emailToken: string,
): Promise<void> {
  await paystackFetch("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({
      code: subscriptionCode,
      token: emailToken,
    }),
  });
}

// ─── Signature Security Check ────────────────────────────────────────────────

export async function verifyPaystackSignature(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  if (!process.env.PAYSTACK_SECRET_KEY) return false;

  const crypto = await import("crypto");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}
