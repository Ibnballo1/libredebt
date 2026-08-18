import { env } from "@/lib/env";

interface SendSmsParams {
  to: string; // Recipient phone number (e.g., "2348123456789" or "08123456789")
  message: string;
}

/**
 * Normalizes phone numbers to standard international format without '+'
 * e.g., "08012345678" -> "2348012345678"
 */
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, ""); // Remove non-numeric characters
  if (cleaned.startsWith("0")) {
    cleaned = "234" + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Dispatches an SMS notification via Termii API
 */
export async function sendTermiiSms({ to, message }: SendSmsParams) {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "LibreDebt"; // Default fallback Sender ID

  if (!apiKey) {
    console.error(
      "[TERMII_SERVICE] TERMII_API_KEY is not defined in environment variables.",
    );
    return { success: false, error: "Missing Termii API Key" };
  }

  const formattedPhone = formatPhoneNumber(to);

  try {
    const response = await fetch("https://v4.api.termii.com/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: formattedPhone,
        from: senderId,
        sms: message,
        type: "plain",
        channel: "generic", // Use 'generic' for standard notifications or 'dnd' for corporate routes
        api_key: apiKey,
      }),
    });

    const data = await response.json();

    if (response.ok && data.message_id) {
      console.log(
        `[TERMII_SMS_SUCCESS] Message sent to ${formattedPhone}, ID: ${data.message_id}`,
      );
      return { success: true, messageId: data.message_id };
    } else {
      console.error(`[TERMII_SMS_FAILURE] Termii rejected dispatch:`, data);
      return { success: false, error: data.message || "Failed to send SMS" };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Network Error";
    console.error(
      `[TERMII_SMS_CRITICAL] Exception occurred sending SMS:`,
      error,
    );
    return { success: false, error: errorMessage };
  }
}
