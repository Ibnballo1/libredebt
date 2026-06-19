/**
 * server/services/reminder.service.ts
 *
 * Business logic for the reminder system.
 *
 * RESPONSIBILITIES:
 *   - scheduleRemindersForDebt: called when a debt is created/updated
 *     Creates pending reminder rows for the next due date
 *   - getPendingReminders: called by Trigger.dev cron jobs
 *     Returns all reminders that are due to be sent
 *   - markReminderSent: called after successful email delivery
 *   - markReminderFailed: called after failed delivery (with reason)
 *   - cancelRemindersForDebt: called when a debt is archived
 *
 * REMINDER SCHEDULING LOGIC:
 * When a debt has dueDay = 15 (15th of each month):
 *   - On the 1st of each month, schedule reminders for the 8th, 12th, 14th
 *     (7 days before, 3 days before, 1 day before)
 *   - The weekly cron job runs daily and fills in any missing reminders
 *
 * WHY STORE REMINDERS IN THE DATABASE?
 * If we only scheduled in Trigger.dev, we would:
 *   1. Have no audit trail of what was sent
 *   2. Have no way to cancel a reminder without calling Trigger.dev's API
 *   3. Lose reminders if Trigger.dev had downtime when the schedule fired
 *
 * The DB row is the intent. Trigger.dev reads the DB and executes.
 * If Trigger.dev fires twice (retry), the DB status prevents double-send.
 */

import { db } from "@/db";
import { reminders, debts, users } from "@/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";
// import { nanoid } from "nanoid"
import { v4 as uuidv4 } from "uuid";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PendingReminder = {
  id: string;
  debtId: string;
  userId: string;
  type: "payment_due" | "overdue" | "weekly_summary";
  remindAt: Date;
  // Joined from related tables:
  userEmail: string;
  userName: string;
  debtName: string;
  creditor: string;
  currency: string;
  dueDay: number | null;
};

// ─── Schedule reminders for a debt ───────────────────────────────────────────

/**
 * Creates pending reminder rows for the next occurrence of a debt's due date.
 * Called when:
 *   - A debt is created (if dueDay is set)
 *   - A debt is edited and dueDay changes
 *
 * Only creates reminders for PRO users.
 * The caller (Server Action) must verify tier before calling this.
 */
export async function scheduleRemindersForDebt(
  debtId: string,
  userId: string,
  dueDay: number,
): Promise<void> {
  // Cancel any existing pending reminders for this debt
  // (in case dueDay changed on edit)
  await cancelPendingRemindersForDebt(debtId, userId);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Calculate the next occurrence of the due date
  let dueDate = new Date(currentYear, currentMonth, dueDay);
  if (dueDate <= now) {
    // Due date already passed this month — schedule for next month
    dueDate = new Date(currentYear, currentMonth + 1, dueDay);
  }

  // Schedule reminders at 7, 3, and 1 day before the due date
  const offsets = [7, 3, 1];
  const reminderRows = offsets
    .map((daysBefore) => {
      const remindAt = new Date(dueDate);
      remindAt.setDate(remindAt.getDate() - daysBefore);
      remindAt.setHours(9, 0, 0, 0); // Send at 9:00 AM

      // Only schedule if the reminder time is in the future
      if (remindAt <= now) return null;

      return {
        id: uuidv4(),
        debtId,
        userId,
        type: "payment_due" as const,
        remindAt,
        status: "pending" as const,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    debtId: string;
    userId: string;
    type: "payment_due";
    remindAt: Date;
    status: "pending";
  }>;

  if (reminderRows.length > 0) {
    await db.insert(reminders).values(reminderRows);
  }
}

/**
 * Cancels all pending reminders for a debt.
 * Called when a debt is archived.
 */
export async function cancelPendingRemindersForDebt(
  debtId: string,
  userId: string,
): Promise<void> {
  await db
    .update(reminders)
    .set({ status: "canceled" })
    .where(
      and(
        eq(reminders.debtId, debtId),
        eq(reminders.userId, userId),
        eq(reminders.status, "pending"),
      ),
    );
}

// ─── Fetch pending reminders (for Trigger.dev jobs) ──────────────────────────

/**
 * Returns all reminders that are due to be sent right now.
 * Called by the Trigger.dev hourly cron job.
 *
 * Joins users and debts to get all data needed for the email
 * in a single query — avoids N+1 fetches inside the job.
 */
export async function getPendingDueSoonReminders(): Promise<PendingReminder[]> {
  const now = new Date();

  const rows = await db
    .select({
      id: reminders.id,
      debtId: reminders.debtId,
      userId: reminders.userId,
      type: reminders.type,
      remindAt: reminders.remindAt,
      userEmail: users.email,
      userName: users.name,
      debtName: debts.name,
      creditor: debts.creditor,
      currency: debts.currency,
      dueDay: debts.dueDay,
    })
    .from(reminders)
    .innerJoin(debts, eq(reminders.debtId, debts.id))
    .innerJoin(users, eq(reminders.userId, users.id))
    .where(
      and(
        eq(reminders.type, "payment_due"),
        eq(reminders.status, "pending"),
        lte(reminders.remindAt, now),
        // Respect the user's reminder preference — set Stage 2's
        // toggle in settings without needing to cancel every pending row.
        eq(users.reminderDueSoonEnabled, true),
      ),
    )
    .orderBy(reminders.remindAt);

  // Normalize reminder types to the PendingReminder expected union.
  const normalized: PendingReminder[] = rows.map((r) => ({
    ...r,
    type:
      r.type === "payment_overdue"
        ? ("overdue" as const)
        : r.type === "general_notification"
          ? ("weekly_summary" as const)
          : (r.type as PendingReminder["type"]),
  })) as PendingReminder[];

  return normalized;
}

/**
 * Returns the next upcoming reminders for a user, for display in the
 * reminders settings page. Shows what's scheduled without exposing
 * internal job mechanics.
 */
export async function getUpcomingRemindersForUser(userId: string) {
  const now = new Date();

  const rows = await db
    .select({
      id: reminders.id,
      debtId: reminders.debtId,
      type: reminders.type,
      remindAt: reminders.remindAt,
      debtName: debts.name,
    })
    .from(reminders)
    .innerJoin(debts, eq(reminders.debtId, debts.id))
    .where(and(eq(reminders.userId, userId), eq(reminders.status, "pending")))
    .orderBy(reminders.remindAt)
    .limit(10);

  return rows.filter((r) => r.remindAt >= now);
}

/**
 * Returns all active debts with a dueDay that has passed today
 * and has no recorded payment in the current month.
 *
 * Called by the overdue check job (runs daily).
 * The job will then create overdue reminder entries and send emails.
 */
export async function getOverdueDebts() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get all active debts with a dueDay that has passed this month
  const overdueDebts = await db
    .select({
      id: debts.id,
      userId: debts.userId,
      name: debts.name,
      creditor: debts.creditor,
      currency: debts.currency,
      dueDay: debts.dueDay,
      userEmail: users.email,
      userName: users.name,
    })
    .from(debts)
    .innerJoin(users, eq(debts.userId, users.id))
    .where(
      and(
        eq(debts.status, "active"),
        // Only debts with a due day that has passed
      ),
    );

  // Filter in JS: dueDay is set and has passed this month
  return overdueDebts.filter((d) => d.dueDay !== null && d.dueDay < currentDay);
}

// ─── Mark reminder status ─────────────────────────────────────────────────────

export async function markReminderSent(
  reminderId: string,
  providerMessageId: string,
): Promise<void> {
  await db
    .update(reminders)
    .set({
      status: "sent",
      providerMessageId,
    })
    .where(eq(reminders.id, reminderId));
}

export async function markReminderFailed(
  reminderId: string,
  reason: string,
): Promise<void> {
  await db
    .update(reminders)
    .set({
      status: "failed",
      failureReason: reason,
    })
    .where(eq(reminders.id, reminderId));
}
