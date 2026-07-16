/**
 * lib/resend.ts — Resend Email Client
 *
 * Resend is the email delivery provider for LibreDebt.
 * Used exclusively server-side — never import in Client Components.
 *
 * WHY RESEND OVER SENDGRID/MAILGUN?
 * Resend is developer-first, has a clean API, first-class React Email
 * support, and generous free tier (3,000 emails/month).
 * It integrates naturally with Trigger.dev jobs.
 *
 * USAGE:
 *   import { resend, FROM_EMAIL } from "@/lib/resend"
 *   await resend.emails.send({
 *     from: FROM_EMAIL,
 *     to: user.email,
 *     subject: "...",
 *     react: <MyEmailTemplate />
 *   })
 */

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set in environment variables");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * The "from" address for all LibreDebt emails.
 * Must be a verified domain in your Resend account.
 *
 * For development: use the Resend sandbox address
 * For production: use your own verified domain e.g. "LibreDebt <hello@libredebt.com>"
 */
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "LibreDebt <onboarding@resend.dev>";

/**
 * The base URL used for links inside emails.
 * In production this should be your Vercel domain.
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
