/**
 * app/api/contact/route.ts — Contact Form API Handler
 *
 * Receives public contact requests and dispatches them to your team inbox via Resend.
 */

import { NextResponse } from "next/server";
import { resend } from "@/server/services/email.service";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate form inputs
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form submissions data." },
        { status: 400 },
      );
    }

    const { name, email, subject, message } = result.data;

    // Send notification email to yourself
    const { error } = await resend.emails.send({
      from: "LibreDebt System <hello@libredebt.com>",
      to: ["support@libredebt.com"], // Your internal company inbox
      replyTo: email, // Direct reply to the sender
      subject: `[Contact Form] ${subject} — from ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #334155;">
          <h2 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 16px; white-space: pre-wrap;">
            ${message}
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[CONTACT_API_FAILURE] Resend execution failed:", error);
      return NextResponse.json(
        { error: "Failed to send email message." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[CONTACT_API_CRITICAL] Route handler crash:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
