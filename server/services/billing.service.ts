/**
 * server/services/billing.service.ts (Paystack-only, with trial logic)
 *
 * TRIAL MODEL:
 *   - Every account gets 3 days of full Pro access from createdAt.
 *   - No separate trial column needed — createdAt already exists.
 *   - isInTrial(user) = now - createdAt < 3 days
 *   - After trial: access.service.ts gates kick in normally.
 *
 * TWO PLANS:
 *   - 6-month plan: ₦3,000
 *   - 1-year plan:  ₦5,500
 */

import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export type BillingPlan = "6month" | "1year";
export type BillingProvider = "paystack";
export type SubscriptionStatus = "active" | "canceled" | "past_due";

// ── Trial ──────────────────────────────────────────────────────────────────────

const TRIAL_DAYS = 3;

/**
 * Returns true if the user is still within the 3-day free trial window.
 * Used to show "X days left in trial" UI and bypass feature gates during trial.
 */
export function isInTrial(createdAt: Date): boolean {
  const trialEndsAt = new Date(
    createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
  );
  return new Date() < trialEndsAt;
}

export function trialDaysRemaining(createdAt: Date): number {
  const trialEndsAt = new Date(
    createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
  );
  const msLeft = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}

export function trialEndsAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

// ── Subscription mutations ─────────────────────────────────────────────────────

export async function activateProSubscription(params: {
  userId: string;
  provider: "paystack";
  providerSubscriptionId: string;
  providerCustomerId: string | null;
  currentPeriodEnd: Date | null;
  plan: BillingPlan;
}): Promise<void> {
  await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(subscriptions)
      .where(
        eq(subscriptions.providerSubscriptionId, params.providerSubscriptionId),
      )
      .limit(1);

    if (existing.length > 0) {
      await tx
        .update(subscriptions)
        .set({
          status: "active",
          currentPeriodEnd: params.currentPeriodEnd,
          canceledAt: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existing[0]!.id));
    } else {
      await tx.insert(subscriptions).values({
        id: nanoid(),
        userId: params.userId,
        plan: "pro",
        status: "active",
        provider: params.provider,
        providerSubscriptionId: params.providerSubscriptionId,
        providerCustomerId: params.providerCustomerId,
        currentPeriodEnd: params.currentPeriodEnd,
      });
    }

    await tx
      .update(users)
      .set({ subscriptionTier: "pro", updatedAt: new Date() })
      .where(eq(users.id, params.userId));
  });
}

export async function downgradeToFree(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(subscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));

    await tx
      .update(users)
      .set({ subscriptionTier: "free", updatedAt: new Date() })
      .where(eq(users.id, userId));
  });
}

export async function markPastDue(userId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status: "past_due", updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId));
}

export async function getActiveSubscription(userId: string) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  // Since we ordered by desc(createdAt), index 0 is always the absolute newest record!
  return rows[0] ?? null;
}

export async function findUserIdBySubscriptionId(
  providerSubscriptionId: string,
): Promise<string | null> {
  const rows = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId))
    .limit(1);
  return rows[0]?.userId ?? null;
}
