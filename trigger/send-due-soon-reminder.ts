/**
 * trigger/send-due-soon-reminders.ts — Scheduled Task
 *
 * A Trigger.dev scheduled task ("cron task") that runs every hour.
 * Queries the database for pending due-soon reminders and sends them
 * via Resend.
 *
 * THIS FILE LIVES IN /trigger — that's where the Trigger.dev CLI looks
 * for task definitions by default (configured in trigger.config.ts).
 *
 * No manual registration, no custom webhook route. The CLI's `dev` and
 * `deploy` commands discover this file automatically and register the
 * task with the Trigger.dev platform.
 *
 * IDEMPOTENCY:
 * Each reminder row is marked "sent" or "failed" immediately after the
 * email attempt. If this task retries (e.g. transient network failure),
 * the reminder service's status check prevents double-sending.
 */

import { schedules, logger } from "@trigger.dev/sdk";
import {
  getPendingDueSoonReminders,
  markReminderSent,
  markReminderFailed,
} from "@/server/services/reminder.service";
import { getDebtById } from "@/server/repositories/debt.repository";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";
import { DueSoonEmail } from "@/emails/due-soon.email";
import { formatCurrency } from "@/lib/utils";
import * as React from "react";

export const sendDueSoonReminders = schedules.task({
  id: "send-due-soon-reminders",

  /**
   * Cron expression: runs every hour, on the hour.
   * Reminders are scheduled for 9:00 AM local server time, so the
   * 9 AM run is the one that actually picks most of them up — the
   * other 23 runs each day will typically find nothing pending.
   */
  cron: "0 * * * *",

  run: async (payload) => {
    logger.log("Checking for pending due-soon reminders", {
      scheduledAt: payload.timestamp,
    });

    const pending = await getPendingDueSoonReminders();

    if (pending.length === 0) {
      logger.log("No pending reminders to send");
      return { sent: 0, failed: 0 };
    }

    logger.log(`Processing ${pending.length} pending reminders`);

    let sent = 0;
    let failed = 0;

    for (const reminder of pending) {
      try {
        const debt = await getDebtById(reminder.debtId, reminder.userId);
        if (!debt) {
          await markReminderFailed(reminder.id, "Debt not found");
          failed++;
          continue;
        }

        const now = new Date();
        const dueThisMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          reminder.dueDay ?? 1,
        );
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysUntilDue = Math.max(
          1,
          Math.round((dueThisMonth.getTime() - now.getTime()) / msPerDay),
        );

        const result = await resend.emails.send({
          from: FROM_EMAIL,
          to: reminder.userEmail,
          subject: `Payment reminder: ${reminder.debtName} is due ${
            daysUntilDue === 1 ? "tomorrow" : `in ${daysUntilDue} days`
          }`,
          react: React.createElement(DueSoonEmail, {
            userName: reminder.userName.split(" ")[0] ?? reminder.userName,
            debtName: reminder.debtName,
            creditor: reminder.creditor,
            daysUntilDue,
            minimumPaymentFormatted: formatCurrency(debt.minimumPaymentMinor, {
              currency: debt.currency,
            }),
            currentBalanceFormatted: formatCurrency(debt.currentBalanceMinor, {
              currency: debt.currency,
            }),
            recordPaymentUrl: `${APP_URL}/debts/${reminder.debtId}`,
            unsubscribeUrl: `${APP_URL}/reminders`,
          }),
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        await markReminderSent(reminder.id, result.data?.id ?? "unknown");
        sent++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(`Failed to send reminder ${reminder.id}`, {
          error: message,
        });
        await markReminderFailed(reminder.id, message);
        failed++;
      }
    }

    logger.log("Finished processing reminders", { sent, failed });
    return { sent, failed };
  },
});
