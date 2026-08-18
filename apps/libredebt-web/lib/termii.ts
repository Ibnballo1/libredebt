/**
 * lib/termii.ts — Termii Messaging Client
 *
 * Handles SMS and WhatsApp delivery via Termii v4 API.
 *
 * ENV VARS:
 *   TERMII_API_KEY   — from Termii dashboard → API Key
 *   TERMII_SENDER_ID — approved sender ID (e.g. "LibreDebt")
 *
 * PHONE FORMAT:
 *   Termii expects international format without +
 *   e.g. 08031234567 → 2348031234567
 */

const BASE_URL = "https://v4.api.termii.com";
const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID ?? "LibreDebt";

if (!TERMII_API_KEY) {
  console.warn(
    "[termii] TERMII_API_KEY not set — SMS/WhatsApp will be skipped",
  );
}

export type TermiiChannel = "generic" | "whatsapp";
export type SendMessageResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

/** Normalise phone to international format: 08031234567 → 2348031234567 */
export function normalisePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    digits = "234" + digits.slice(1);
  }
  return digits;
}

export function isValidPhone(phone: string): boolean {
  return /^\d{7,15}$/.test(normalisePhone(phone));
}

export async function sendMessage(
  to: string,
  message: string,
  channel: TermiiChannel = "generic",
): Promise<SendMessageResult> {
  if (!TERMII_API_KEY)
    return { success: false, error: "TERMII_API_KEY not configured" };

  const phone = normalisePhone(to);
  if (!isValidPhone(phone))
    return { success: false, error: `Invalid phone: ${to}` };

  try {
    const res = await fetch(`${BASE_URL}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to: phone,
        from: TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.code === "error") {
      return { success: false, error: data.message ?? `HTTP ${res.status}` };
    }
    return { success: true, messageId: data.message_id ?? data.id ?? "ok" };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Network error";
    return { success: false, error };
  }
}

export const sendSms = (to: string, msg: string) =>
  sendMessage(to, msg, "generic");
export const sendWhatsApp = (to: string, msg: string) =>
  sendMessage(to, msg, "whatsapp");

/**
 * Send a reminder via all channels the user has enabled.
 * Never throws — individual failures are logged only.
 */
export async function sendReminderToUser(params: {
  phone: string;
  message: string;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
}): Promise<{
  sms: SendMessageResult | null;
  whatsapp: SendMessageResult | null;
}> {
  const [sms, whatsapp] = await Promise.all([
    params.smsEnabled ? sendSms(params.phone, params.message) : null,
    params.whatsappEnabled ? sendWhatsApp(params.phone, params.message) : null,
  ]);
  if (sms && !sms.success) console.error("[termii] SMS failed:", sms.error);
  if (whatsapp && !whatsapp.success)
    console.error("[termii] WhatsApp failed:", whatsapp.error);
  return { sms, whatsapp };
}
