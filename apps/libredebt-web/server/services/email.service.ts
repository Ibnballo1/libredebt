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

interface SendAnnouncementEmailArgs {
  toEmail: string;
  userName: string;
  subject: string;
  messageBody: string;
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

/**
 * Dispatches general updates, targeted announcements, and manual system alerts.
 * Formats custom text with line-breaks cleanly so you don't need a static template file.
 */
export async function sendAnnouncementEmail({
  toEmail,
  userName,
  subject,
  messageBody,
}: SendAnnouncementEmailArgs) {
  try {
    // Format line breaks safely for simple HTML layout
    const htmlBody = messageBody
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br />");

    const { data, error } = await resend.emails.send({
      from: "LibreDebt Team <hello@libredebt.com>",
      to: [toEmail],
      subject: subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 20px; font-weight: 800; color: #10b981; letter-spacing: -0.5px;">LibreDebt</span>
          </div>
          <p style="font-size: 16px; line-height: 24px; color: #0f172a; margin-top: 0;">
            Hello ${userName || "there"},
          </p>
          <div style="font-size: 15px; line-height: 26px; color: #334155;">
            ${htmlBody}
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0 24px 0;" />
          <p style="font-size: 12px; line-height: 18px; color: #94a3b8; margin: 0;">
            This is a system broadcast from LibreDebt. You are receiving this because you signed up with us. If you have any questions, you can contact support at support@libredebt.com.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error(
        `[EMAIL_SERVICE_FAILURE] Announcement delivery threw a fault for ${toEmail}:`,
        error,
      );
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error(
      `[EMAIL_SERVICE_CRITICAL] Announcement delivery pipeline crashed for ${toEmail}:`,
      error,
    );
    return { success: false, error };
  }
}
