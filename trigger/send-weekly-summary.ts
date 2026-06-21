/**
 * trigger/send-weekly-summary.ts — Scheduled Task
 *
 * Runs every Monday at 9:00 AM. Sends a progress summary email to
 * every Pro user with at least one active debt.
 */

import { schedules, logger } from "@trigger.dev/sdk";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDashboardStats } from "@/server/services/dashboard.service";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";
import { WeeklySummaryEmail } from "@/emails/weekly-summary.email";
import { formatCurrency, calculateProgressPercent } from "@/lib/utils";
import * as React from "react";

export const sendWeeklySummary = schedules.task({
  id: "send-weekly-summary",

  /** Every Monday at 9:00 AM server time. */
  cron: "0 9 * * 1",

  run: async (payload) => {
    logger.log("Starting weekly summary send", {
      scheduledAt: payload.timestamp,
    });

    // Only Pro users receive weekly summaries — it's a gated feature.
    const proUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        currency: users.currency,
      })
      .from(users)
      .where(eq(users.subscriptionTier, "pro"));

    if (proUsers.length === 0) {
      logger.log("No Pro users to send summaries to");
      return { sent: 0, skipped: 0, failed: 0 };
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of proUsers) {
      try {
        const stats = await getDashboardStats(user.id);

        if (stats.activeDebtCount === 0) {
          skipped++;
          continue;
        }

        const overallProgress = calculateProgressPercent(
          stats.totalOriginalMinor,
          stats.totalCurrentMinor,
        );

        const upcomingDueCount = stats.debtBreakdown.filter((d) => {
          if (!d.dueDay) return false;
          const now = new Date();
          const due = new Date(now.getFullYear(), now.getMonth(), d.dueDay);
          const diffDays = Math.round(
            (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          return diffDays >= 0 && diffDays <= 7;
        }).length;

        const result = await resend.emails.send({
          from: FROM_EMAIL,
          // to: user.email,
          to: "webtekhy@gmail.com",
          subject: `Your weekly debt summary — ${overallProgress}% repaid`,
          react: React.createElement(WeeklySummaryEmail, {
            userName: user.name.split(" ")[0] ?? user.name,
            totalRepaidFormatted: formatCurrency(stats.totalRepaidMinor, {
              currency: user.currency ?? "USD",
            }),
            totalRemainingFormatted: formatCurrency(stats.totalCurrentMinor, {
              currency: user.currency ?? "USD",
            }),
            overallProgressPercent: overallProgress,
            debts: stats.debtBreakdown.map((d) => ({
              name: d.name,
              currentBalanceFormatted: formatCurrency(d.currentBalanceMinor, {
                currency: d.currency,
              }),
              progressPercent: d.progressPercent,
              dueDay: d.dueDay,
            })),
            upcomingDueCount,
            dashboardUrl: `${APP_URL}/overview`,
            unsubscribeUrl: `${APP_URL}/reminders`,
          }),
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        sent++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(`Failed to send weekly summary to user ${user.id}`, {
          error: message,
        });
        failed++;
      }
    }

    logger.log("Finished weekly summary send", { sent, skipped, failed });
    return { sent, skipped, failed };
  },
});
