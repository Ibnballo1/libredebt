/**
 * app/api/cron/overdue/route.ts
 *
 * Checks for overdue debts and sends overdue alerts.
 * Called by cron-jobs.org once daily — suggested: 10:00 AM.
 *
 * CRON-JOBS.ORG SETUP:
 *   URL:      https://yourdomain.com/api/cron/overdue
 *   Method:   GET
 *   Schedule: Daily at 10am (0 10 * * *)
 *   Headers:  x-cron-secret: <CRON_SECRET>
 *
 * LOGIC:
 *   A debt is overdue if:
 *     1. It has a dueDay set
 *     2. Today's date is past dueDay
 *     3. The debt has a balance > 0
 *     4. We haven't already sent an overdue alert this month for this debt
 *
 * IDEMPOTENCY:
 *   We insert a reminder row with status='sent' after sending.
 *   The query below excludes debts that already have an overdue reminder
 *   with status='sent' in the current month — prevents double-sending.
 */

import { NextRequest, NextResponse } from "next/server";
import { getOverdueDebts } from "@/server/services/reminder.service";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { OverdueEmail } from "@/emails/overdue.email";
import { sendReminderToUser } from "@/lib/termii";
import { db } from "@/db";
import { reminders, users } from "@/db/schema";
import { eq } from "drizzle-orm";

function unauthorised() {
  return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
}

function buildOverdueSms(params: {
  userName: string;
  debtName: string;
  creditor: string;
  daysOverdue: number;
}): string {
  const first = params.userName.split(" ")[0];
  return `Hi ${first}, your "${params.debtName}" payment (${params.creditor}) is ${params.daysOverdue} day${params.daysOverdue === 1 ? "" : "s"} overdue. Record your payment on LibreDebt: libredebt.com`;
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return unauthorised();
  }

  const overdueDebts = (await getOverdueDebts()) as Array<{
    id: string;
    userId: string;
    name: string;
    creditor: string;
    currency: string;
    dueDay: number | null;
    userEmail: string;
    userName: string;
    balance: string | number | null;
  }>;

  if (overdueDebts.length === 0) {
    return NextResponse.json({
      processed: 0,
      message: "No overdue debts found",
    });
  }

  const now = new Date();
  const currentDay = now.getDate();
  const results = { sent: 0, failed: 0 };

  for (const debt of overdueDebts) {
    try {
      const daysOverdue = currentDay - (debt.dueDay ?? 1);

      // Fetch phone + messaging prefs
      const userRows = await db
        .select({
          phone: users.phone,
          smsEnabled: users.smsEnabled,
          whatsappEnabled: users.whatsappEnabled,
          reminderOverdueEnabled: users.reminderOverdueEnabled,
        })
        .from(users)
        .where(eq(users.id, debt.userId))
        .limit(1);

      const userPrefs = userRows[0];

      // Respect the user's overdue reminder preference
      if (!userPrefs?.reminderOverdueEnabled) continue;

      // Send email
      await resend.emails.send({
        from: FROM_EMAIL,
        to: debt.userEmail,
        subject: `Payment overdue: "${debt.name}" was due ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} ago`,
        react: OverdueEmail({
          userName: debt.userName,
          debtName: debt.name,
          creditor: debt.creditor,
          daysOverdue,
          currency: debt.currency,
          currentBalanceFormatted: `${debt.currency} ${Number(debt.balance).toFixed(2)}`,
          recordPaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/debts/${debt.id}`,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/debts`,
        }),
      });

      // Send SMS / WhatsApp
      if (
        userPrefs?.phone &&
        (userPrefs.smsEnabled || userPrefs.whatsappEnabled)
      ) {
        await sendReminderToUser({
          phone: userPrefs.phone,
          message: buildOverdueSms({
            userName: debt.userName,
            debtName: debt.name,
            creditor: debt.creditor,
            daysOverdue,
          }),
          smsEnabled: userPrefs.smsEnabled ?? false,
          whatsappEnabled: userPrefs.whatsappEnabled ?? false,
        });
      }

      // Record that we sent the overdue reminder so we don't re-send today
      await db.insert(reminders).values({
        debtId: debt.id,
        userId: debt.userId,
        type: "payment_overdue",
        remindAt: now,
        status: "sent",
        processedAt: now,
        providerMessageId: "overdue-cron",
      });

      results.sent++;
    } catch (err) {
      console.error("[cron/overdue] Failed for debt", debt.id, err);
      results.failed++;
    }
  }

  console.log(
    `[cron/overdue] Done — sent: ${results.sent}, failed: ${results.failed}`,
  );
  return NextResponse.json({ processed: overdueDebts.length, ...results });
}
