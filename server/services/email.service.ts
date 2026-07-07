/**
 * server/services/email.service.ts
 *
 * core transactional communication layer powered by Resend.
 * Bridges reactive app events with beautiful React-Email layouts.
 */

import { Resend } from "resend";
import { env } from "@/lib/env";
import { WelcomeEmail } from "@/emails/welcome.email";
import { VerifyEmail } from "@/emails/verify-email.email";
import * as React from "react";

// Initialize Resend Client
export const resend = new Resend(env.RESEND_API_KEY);

interface SendWelcomeEmailArgs {
  toEmail: string;
  userName: string;
}

interface SendVerificationEmailArgs {
  toEmail: string;
  userName: string;
  verificationUrl: string;
}

/**
 * Dispatches a beautifully tracked welcome onboarding canvas to newly registered profiles.
 * Note: Only triggered automatically for social registrations (OAuth) since email accounts
 * must complete validation first.
 */
export async function sendWelcomeEmail({
  toEmail,
  userName,
}: SendWelcomeEmailArgs) {
  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL || "https://www.libredebt.com"}/overview`;

  try {
    const { data, error } = await resend.emails.send({
      from: "LibreDebt Team <hello@libredebt.com>",
      to: [toEmail],
      subject: `Welcome to LibreDebt, ${userName.split(" ")[0]}!`,
      react: React.createElement(WelcomeEmail, {
        userName,
        dashboardUrl,
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

/**
 * Dispatches the security verification handshake link to ensure inbox ownership.
 */
export async function sendVerificationEmail({
  toEmail,
  userName,
  verificationUrl,
}: SendVerificationEmailArgs) {
  try {
    const { data, error } = await resend.emails.send({
      from: "LibreDebt Security <hello@libredebt.com>",
      to: [toEmail],
      subject: "Verify your email address — LibreDebt",
      react: React.createElement(VerifyEmail, {
        userName,
        verificationUrl,
      }),
    });

    if (error) {
      console.error(
        `[EMAIL_SERVICE_FAILURE] Verification delivery threw a fault:`,
        error,
      );
      return { success: false, error };
    }

    console.log(
      `[EMAIL_SERVICE_SUCCESS] Verification token dispatched successfully: ${data?.id}`,
    );
    return { success: true, id: data?.id };
  } catch (error) {
    console.error(
      `[EMAIL_SERVICE_CRITICAL] Verification engine crashed executing delivery pipeline:`,
      error,
    );
    return { success: false, error };
  }
}
