/**
 * lib/paystack.ts — Fully Type-Safe & Synchronized Version
 */

const BASE = "https://api.paystack.co";

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not set");
}

const SECRET = process.env.PAYSTACK_SECRET_KEY;

export const PAYSTACK_PLAN_6M = process.env.PAYSTACK_PLAN_6M ?? "";
export const PAYSTACK_PLAN_1Y = process.env.PAYSTACK_PLAN_1Y ?? "";

// ── Strict Interfaces for Responses ──────────────────────────────────────────

export type PaystackInitResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackVerifyResult = {
  status: string; // "success", "failed", etc. inside data block
  reference: string;
  amount: number;
  customer: {
    customer_code: string;
    email: string;
  } | null;
  plan: string | null;
  plan_object?: {
    id: number;
    name: string;
    plan_code: string;
  } | null;
  metadata?: {
    userId?: string;
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string | number;
    }>;
  } | null;
};

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// ── Fetch Wrapper ────────────────────────────────────────────────────────────

async function paystackFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<PaystackResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = (await res.json()) as PaystackResponse<T>;

  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Paystack error");
  }

  return json;
}

// ── Exported Methods ──────────────────────────────────────────────────────────

export async function initializePaystackTransaction(params: {
  email: string;
  userId: string;
  planCode: string;
  amount: number;
  callbackUrl: string;
}): Promise<PaystackInitResult> {
  const result = await paystackFetch<PaystackInitResult>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        plan: params.planCode,
        amount: params.amount,
        callback_url: params.callbackUrl,
        metadata: {
          userId: params.userId,
          custom_fields: [
            {
              display_name: "userId",
              variable_name: "userId",
              value: params.userId,
            },
          ],
        },
      }),
    },
  );
  return result.data;
}

/**
 * Directly verifies a transaction using its reference string.
 * Crucial for the server actions poll fallback!
 */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResult> {
  const result = await paystackFetch<PaystackVerifyResult>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
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
