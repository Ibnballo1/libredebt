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
  // 1. Calculate the exact amount in Kobo to satisfy Paystack validation
  const isSixMonth = params.planCode === PAYSTACK_PLAN_6M;
  const amountInKobo = isSixMonth ? 300000 : 10000;

  // 2. Add a quick sanity check to make sure the server has the env values
  if (!params.planCode) {
    throw new Error(
      "Paystack plan code variable is empty or undefined in environment variables.",
    );
  }

  const result = await paystackFetch<PaystackInitResult>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        plan: params.planCode,
        amount: amountInKobo,
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

// 1. Update the type mapping to match Paystack's data properties exactly
export type PaystackVerifyResult = {
  // Paystack places the payment string status INSIDE the data block
  status: "success" | "failed" | "reversed" | string;
  reference: string;
  amount: number;
  customer: {
    customer_code: string;
    email: string;
  } | null;
  plan: string | null; // Paystack sometimes passes plan code directly as a string or null
  plan_object?: {
    id: number;
    name: string;
    plan_code: string;
  } | null;
};

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResult> {
  // paystackFetch already returns json.data directly!
  const result = await paystackFetch<PaystackVerifyResult>(
    `/transaction/verify/${reference}`,
  );
  return result.data;
}
