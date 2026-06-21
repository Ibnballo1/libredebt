/**
 * trigger/check-overdue-debts.ts — Scheduled Task
 *
 * Runs once daily at 8:00 AM. Finds active debts whose due day has
 * passed this month with no payment recorded, and sends an overdue
 * alert email for each one (deduplicated per debt per month).
 */

import { schedules, logger } from "@trigger.dev/sdk";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getOverdueDebts } from "@/server/services/reminder.service";
import {
  markReminderSent,
  markReminderFailed,
} from "@/server/services/reminder.service";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";
import { OverdueEmail } from "@/emails/overdue.email";
import { formatCurrency } from "@/lib/utils";
import * as React from "react";

export const checkOverdueDebts = schedules.task({
  id: "check-overdue-debts",

  /** Runs once a day at 8:00 AM server time. */
  cron: "0 8 * * *",

  run: async (payload) => {
    logger.log("Checking for overdue debts", {
      scheduledAt: payload.timestamp,
    });

    const overdue = await getOverdueDebts();

    if (overdue.length === 0) {
      logger.log("No overdue debts found");
      return { processed: 0, sent: 0, skipped: 0, failed: 0 };
    }

    logger.log(`Found ${overdue.length} overdue debts`);

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const debt of overdue) {
      try {
        // Deduplication: skip if an overdue reminder was already sent
        // for this debt this month.
        const existing = await db
          .select()
          .from(reminders)
          .where(
            and(
              eq(reminders.debtId, debt.id),
              eq(reminders.type, "payment_overdue"),
              eq(reminders.status, "sent"),
              gte(reminders.createdAt, startOfMonth),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        const daysOverdue = now.getDate() - (debt.dueDay ?? 1);

        const reminderId = nanoid();
        await db.insert(reminders).values({
          debtId: debt.id,
          userId: debt.userId,
          type: "payment_overdue",
          remindAt: now,
          status: "pending",
        });

        const result = await resend.emails.send({
          from: FROM_EMAIL,
          // to: debt.userEmail,
          to: "webtekhy@gmail.com",
          subject: `${debt.name} — no payment recorded yet`,
          react: React.createElement(OverdueEmail, {
            userName: debt.userName.split(" ")[0] ?? debt.userName,
            debtName: debt.name,
            creditor: debt.creditor,
            daysOverdue,
            currentBalanceFormatted: formatCurrency(0, {
              currency: debt.currency,
            }),
            recordPaymentUrl: `${APP_URL}/debts/${debt.id}`,
            unsubscribeUrl: `${APP_URL}/reminders`,
          }),
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        await markReminderSent(reminderId, result.data?.id ?? "unknown");
        sent++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(`Failed to process overdue debt ${debt.id}`, {
          error: message,
        });
        failed++;
      }
    }

    logger.log("Finished overdue check", { sent, skipped, failed });
    return { processed: overdue.length, sent, skipped, failed };
  },
});
