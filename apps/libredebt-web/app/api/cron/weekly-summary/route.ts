/**
 * app/api/cron/weekly-summary/route.ts
 *
 * Sends a weekly debt summary to all Pro users who have it enabled.
 * Called by cron-jobs.org once weekly — suggested: Monday 9:00 AM.
 *
 * CRON-JOBS.ORG SETUP:
 *   URL:      https://yourdomain.com/api/cron/weekly-summary
 *   Method:   GET
 *   Schedule: Every Monday at 9am (0 9 * * 1)
 *   Headers:  x-cron-secret: <CRON_SECRET>
 *
 * WHAT IT SENDS:
 *   - Total outstanding balance across all active debts
 *   - Number of active debts
 *   - Payments made in the past 7 days
 *   - Which debts are due this week
 *
 * CHANNELS:
 *   Email (all users with weekly summary enabled)
 *   SMS (users with phone + smsEnabled — kept brief, key stats only)
 *   WhatsApp (users with phone + whatsappEnabled — same brief message)
 */

import { NextRequest, NextResponse } from "next/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { WeeklySummaryEmail } from "@/emails/weekly-summary.email";
import { sendReminderToUser } from "@/lib/termii";
import { db } from "@/db";
import { users, debts, ledgerEntries } from "@/db/schema";
import { eq, and, gte, sum, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

function unauthorised() {
  return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
}

function buildWeeklySms(params: {
  userName: string;
  totalOutstanding: number;
  currency: string;
  activeDebts: number;
  paymentsThisWeek: number;
}): string {
  const first = params.userName.split(" ")[0];
  const outstanding = (params.totalOutstanding / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: params.currency,
    minimumFractionDigits: 0,
  });
  const parts = [`Hi ${first}, your LibreDebt weekly summary:`];
  parts.push(
    `Outstanding: ${outstanding} across ${params.activeDebts} debt${params.activeDebts === 1 ? "" : "s"}.`,
  );
  if (params.paymentsThisWeek > 0) {
    parts.push(`Payments this week: ${params.paymentsThisWeek}.`);
  }
  parts.push(`See full details: libredebt.com`);
  return parts.join(" ");
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return unauthorised();
  }

  // Get all users with weekly summary enabled (pro users only for email)
  const eligibleUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      currency: users.currency,
      phone: users.phone,
      smsEnabled: users.smsEnabled,
      whatsappEnabled: users.whatsappEnabled,
      subscriptionTier: users.subscriptionTier,
    })
    .from(users)
    .where(eq(users.reminderWeeklySummaryEnabled, true));

  if (eligibleUsers.length === 0) {
    return NextResponse.json({ processed: 0, message: "No eligible users" });
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const user of eligibleUsers) {
    try {
      // Get active debts + balances using the safe GROUP BY pattern
      const activeDebtsRows = await db
        .select({
          id: debts.id,
          name: debts.name,
          creditor: debts.creditor,
          dueDay: debts.dueDay,
        })
        .from(debts)
        .where(and(eq(debts.userId, user.id), eq(debts.status, "active")));

      if (activeDebtsRows.length === 0) {
        results.skipped++;
        continue;
      }

      // Get balance for each debt separately (avoids correlated subquery issue)
      const debtIds = activeDebtsRows.map((d) => d.id);
      const balanceMap = new Map<string, number>();

      for (const debtId of debtIds) {
        const balRows = await db
          .select({
            total: sql<number>`COALESCE(SUM(${ledgerEntries.amountMinor}), 0)`,
          })
          .from(ledgerEntries)
          .where(eq(ledgerEntries.debtId, debtId));
        balanceMap.set(debtId, Number(balRows[0]?.total ?? 0));
      }

      const totalOutstanding = activeDebtsRows.reduce(
        (sum, d) => sum + Math.max(0, balanceMap.get(d.id) ?? 0),
        0,
      );

      // Payments in the last 7 days
      const weeklyPaymentRows = await db
        .select({ count: count() })
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.userId, user.id),
            eq(ledgerEntries.type, "payment"),
            gte(ledgerEntries.effectiveDate, weekAgo),
          ),
        );
      const paymentsThisWeek = Number(weeklyPaymentRows[0]?.count ?? 0);

      // Debts due this week
      const today = now.getDate();
      const endOfWeek = today + 7;
      const dueThisWeek = activeDebtsRows
        .filter((d) => d.dueDay && d.dueDay >= today && d.dueDay <= endOfWeek)
        .map((d) => d.name);

      // Send email
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: `Your LibreDebt weekly summary — ${now.toLocaleDateString("en-NG", { month: "long", day: "numeric" })}`,
        react: WeeklySummaryEmail({
          userName: user.name,
          totalOutstandingMinor: totalOutstanding,
          totalRepaidFormatted: (0).toLocaleString("en-NG", {
            style: "currency",
            currency: user.currency || "NGN",
            minimumFractionDigits: 0,
          }),
          totalRemainingFormatted: (totalOutstanding / 100).toLocaleString(
            "en-NG",
            {
              style: "currency",
              currency: user.currency || "NGN",
              minimumFractionDigits: 0,
            },
          ),
          overallProgressPercent:
            activeDebtsRows.length > 0
              ? Math.min(
                  100,
                  Math.round(
                    (Math.max(0, totalOutstanding) /
                      Math.max(1, totalOutstanding + 1)) *
                      100,
                  ),
                )
              : 0,
          activeDebts: activeDebtsRows.length,
          paymentsThisWeek,
          dueThisWeek,
          upcomingDueCount: dueThisWeek.length,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}`,
          currency: user.currency || "NGN",
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/overview`,
          debts: activeDebtsRows.map((debt) => {
            const balanceMinor = balanceMap.get(debt.id) ?? 0;
            const currentBalanceFormatted = (balanceMinor / 100).toLocaleString(
              "en-NG",
              {
                style: "currency",
                currency: user.currency || "NGN",
                minimumFractionDigits: 0,
              },
            );
            const progressPercent = Math.min(
              100,
              Math.max(
                0,
                Math.round(
                  (Math.max(0, balanceMinor) / Math.max(1, balanceMinor + 1)) *
                    100,
                ),
              ),
            );

            return {
              name: debt.name,
              creditor: debt.creditor,
              balanceMinor,
              dueDay: debt.dueDay,
              currentBalanceFormatted,
              progressPercent,
            };
          }),
        }),
      });

      // Send SMS / WhatsApp — brief version
      if (user.phone && (user.smsEnabled || user.whatsappEnabled)) {
        await sendReminderToUser({
          phone: user.phone,
          message: buildWeeklySms({
            userName: user.name,
            totalOutstanding,
            currency: user.currency || "NGN",
            activeDebts: activeDebtsRows.length,
            paymentsThisWeek,
          }),
          smsEnabled: user.smsEnabled ?? false,
          whatsappEnabled: user.whatsappEnabled ?? false,
        });
      }

      results.sent++;
    } catch (err) {
      console.error("[cron/weekly-summary] Failed for user", user.id, err);
      results.failed++;
    }
  }

  console.log(
    `[cron/weekly-summary] Done — sent: ${results.sent}, failed: ${results.failed}, skipped: ${results.skipped}`,
  );
  return NextResponse.json({ processed: eligibleUsers.length, ...results });
}
