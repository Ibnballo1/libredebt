/**
 * lib/paystack.ts — Paystack Client (Stripe removed)
 *
 * Two plans:
 *   PAYSTACK_PLAN_6M  → ₦3,000 / 6 months  (PLN_xxxxxx)
 *   PAYSTACK_PLAN_1Y  → ₦5,500 / 1 year     (PLN_yyyyyy)
 *
 * Create both in Paystack Dashboard → Plans, then add the plan codes
 * to your .env.local.
 *
 * Paystack now accepts international cards (Visa/Mastercard) so a
 * separate Stripe integration is no longer needed.
 */

const BASE = "https://api.paystack.co";

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not set");
}

const SECRET = process.env.PAYSTACK_SECRET_KEY;

export const PAYSTACK_PLAN_6M = process.env.PAYSTACK_PLAN_6M ?? "";
export const PAYSTACK_PLAN_1Y = process.env.PAYSTACK_PLAN_1Y ?? "";

async function paystackFetch<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const json = (await res.json()) as {
    status: boolean;
    message: string;
    data: T;
  };
  if (!res.ok || !json.status)
    throw new Error(json.message ?? "Paystack error");
  return json;
}

export type PaystackInitResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export async function initializePaystackTransaction(params: {
  email: string;
  userId: string;
  planCode: string;
  callbackUrl: string;
}): Promise<PaystackInitResult> {
  const result = await paystackFetch<PaystackInitResult>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        plan: params.planCode,
        callback_url: params.callbackUrl,
        metadata: { userId: params.userId },
      }),
    },
  );
  return result.data;
}

export async function verifyPaystackSignature(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  const crypto = await import("crypto");
  const hash = crypto
    .createHmac("sha512", SECRET)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
