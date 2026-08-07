import { NextRequest, NextResponse } from "next/server";
import {
  getPendingDueSoonReminders,
  markReminderSent,
  markReminderFailed,
} from "@/server/services/reminder.service";
import { sendAnnouncementEmail } from "@/server/services/email.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Authorization Header
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch pending reminders due up to right now
    const pendingReminders = await getPendingDueSoonReminders();
    const results = {
      total: pendingReminders.length,
      sent: 0,
      failed: 0,
    };

    // 3. Process and send emails via Resend
    for (const reminder of pendingReminders) {
      const emailResult = await sendAnnouncementEmail({
        toEmail: reminder.userEmail,
        userName: reminder.userName,
        subject: `Upcoming Payment Reminder: ${reminder.debtName}`,
        messageBody: `Hi ${reminder.userName},\n\nThis is a quick reminder that your payment for <strong>${reminder.debtName}</strong> (${reminder.creditor}) is approaching.\n\nKeep up the great momentum!`,
      });

      if (emailResult.success) {
        await markReminderSent(reminder.id, emailResult.id || "cron-job");
        results.sent++;
      } else {
        await markReminderFailed(
          reminder.id,
          typeof emailResult.error === "string"
            ? emailResult.error
            : "Failed to send",
        );
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: unknown) {
    console.error("[CRON_REMINDERS_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
