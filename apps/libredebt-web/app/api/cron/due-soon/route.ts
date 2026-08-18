/**
 * app/api/cron/due-soon/route.ts
 *
 * Sends due-soon reminders via email + SMS + WhatsApp.
 * Called by cron-jobs.org on a schedule — suggested: every hour.
 *
 * CRON-JOBS.ORG SETUP:
 *   URL:      https://yourdomain.com/api/cron/due-soon
 *   Method:   GET
 *   Schedule: Every hour (0 * * * *)
 *   Headers:  x-cron-secret: <your CRON_SECRET value>
 *
 * SECURITY:
 *   The route checks the x-cron-secret header against CRON_SECRET env var.
 *   Set a long random string (e.g. openssl rand -hex 32) in both your
 *   .env and in cron-jobs.org's request headers config.
 *
 * IDEMPOTENCY:
 *   Each reminder row has a status field. We only process 'pending' rows
 *   and immediately mark them 'sent' or 'failed'. If cron-jobs.org fires
 *   twice in the same minute, the second run finds no pending rows.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getPendingDueSoonReminders,
  markReminderSent,
  markReminderFailed,
} from "@/server/services/reminder.service";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { DueSoonEmail } from "@/emails/due-soon.email";
import { sendReminderToUser } from "@/lib/termii";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

function unauthorised() {
  return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
}

function buildSmsMessage(params: {
  userName: string;
  debtName: string;
  creditor: string;
  daysUntilDue: number;
  dueDay: number;
}): string {
  const { userName, debtName, creditor, daysUntilDue } = params;
  const first = userName.split(" ")[0];
  if (daysUntilDue === 1) {
    return `Hi ${first}, your payment for "${debtName}" (${creditor}) is due TOMORROW. Log into LibreDebt to record your payment. libredebt.com`;
  }
  return `Hi ${first}, your payment for "${debtName}" (${creditor}) is due in ${daysUntilDue} days. Plan ahead on LibreDebt. libredebt.com`;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return unauthorised();
  }

  const reminders = await getPendingDueSoonReminders();

  if (reminders.length === 0) {
    return NextResponse.json({
      processed: 0,
      message: "No pending due-soon reminders",
    });
  }

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const reminder of reminders) {
    try {
      // Calculate days until due from remindAt vs dueDay
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const dueDate = new Date(currentYear, currentMonth, reminder.dueDay ?? 1);
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysUntilDue = Math.round(
        (dueDate.getTime() - now.getTime()) / msPerDay,
      );

      // Fetch fresh user row to get phone + messaging prefs
      const userRows = await db
        .select({
          phone: users.phone,
          smsEnabled: users.smsEnabled,
          whatsappEnabled: users.whatsappEnabled,
        })
        .from(users)
        .where(eq(users.id, reminder.userId))
        .limit(1);

      const userPrefs = userRows[0];

      // 1. Send email
      const emailResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: reminder.userEmail,
        subject: `Payment reminder: "${reminder.debtName}" is due ${daysUntilDue === 1 ? "tomorrow" : `in ${daysUntilDue} days`}`,
        react: DueSoonEmail({
          userName: reminder.userName,
          debtName: reminder.debtName,
          creditor: reminder.creditor,
          dueDay: reminder.dueDay ?? 1,
          daysUntilDue,
          currency: reminder.currency,
          minimumPaymentFormatted: "-",
          currentBalanceFormatted: "-",
          recordPaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/debts`,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/debts`,
        }),
      });

      const emailMessageId = emailResult.data?.id ?? "unknown";

      // 2. Send SMS / WhatsApp if user has phone + has opted in
      if (
        userPrefs?.phone &&
        (userPrefs.smsEnabled || userPrefs.whatsappEnabled)
      ) {
        const smsMessage = buildSmsMessage({
          userName: reminder.userName,
          debtName: reminder.debtName,
          creditor: reminder.creditor,
          daysUntilDue,
          dueDay: reminder.dueDay ?? 1,
        });

        await sendReminderToUser({
          phone: userPrefs.phone,
          message: smsMessage,
          smsEnabled: userPrefs.smsEnabled ?? false,
          whatsappEnabled: userPrefs.whatsappEnabled ?? false,
        });
      }

      await markReminderSent(reminder.id, emailMessageId);
      results.sent++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[cron/due-soon] Failed for reminder", reminder.id, err);
      await markReminderFailed(reminder.id, message);
      results.failed++;
    }
  }

  console.log(
    `[cron/due-soon] Done — sent: ${results.sent}, failed: ${results.failed}`,
  );
  return NextResponse.json({ processed: reminders.length, ...results });
}
