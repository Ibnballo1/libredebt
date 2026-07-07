/**
 * server/services/email.service.ts
 *
 * core transactional communication layer powered by Resend.
 * Bridges reactive app events with beautiful React-Email layouts.
 */

import { Resend } from "resend";
import { env } from "@/lib/env";
import { WelcomeEmail } from "@/emails/welcome.email";
import * as React from "react";

// Initialize Resend Client
export const resend = new Resend(env.RESEND_API_KEY);

interface SendWelcomeEmailArgs {
  toEmail: string;
  userName: string;
}

/**
 * Dispatches a beautifully tracked welcome onboarding canvas to newly registered profiles.
 */
export async function sendWelcomeEmail({
  toEmail,
  userName,
}: SendWelcomeEmailArgs) {
  // Gracefully default missing public variable fallbacks
  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL || "https://www.libredebt.com"}/dashboard`;
  const trialDays = 3;

  try {
    const { data, error } = await resend.emails.send({
      from: "LibreDebt Team <hello@libredebt.com>", // Make sure domain is verified on Resend
      to: [toEmail],
      subject: `Welcome to LibreDebt, ${userName.split(" ")[0]}!`,
      react: React.createElement(WelcomeEmail, {
        userName,
        dashboardUrl,
        trialDays,
      }),
    });

    if (error) {
      console.error(
        `[EMAIL_SERVICE_FAILURE] Resend threw an execution fault:`,
        error,
      );
      return { success: false, error };
    }

    console.log(
      `[EMAIL_SERVICE_SUCCESS] Onboarding message dispatched successfully: ${data?.id}`,
    );
    return { success: true, id: data?.id };
  } catch (error) {
    console.error(
      `[EMAIL_SERVICE_CRITICAL] Failed to execute welcome transmission pipeline:`,
      error,
    );
    return { success: false, error };
  }
}
