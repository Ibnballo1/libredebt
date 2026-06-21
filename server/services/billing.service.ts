/**
 * server/services/billing.service.ts
 *
 * THE SINGLE SOURCE OF TRUTH FOR SUBSCRIPTION STATE CHANGES.
 *
 * Every place that needs to upgrade/downgrade a user's tier — webhooks
 * from both providers, Server Actions for cancellation — calls into
 * this file. There is exactly one function that writes
 * `users.subscriptionTier`, and it lives here.
 *
 * WHY THIS MATTERS:
 * If tier-flipping logic were duplicated across two webhook handlers,
 * a bug fix in one would silently miss the other. Centralizing it here
 * means Paystack and Stripe webhooks both funnel through the same
 * upsert + tier-flip logic, just with different input shapes.
 */

import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export type BillingProvider = "paystack" | "stripe";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";

// ─── Activate Pro (called by both webhook handlers on successful payment) ────

export async function activateProSubscription(params: {
  userId: string;
  provider: BillingProvider;
  providerSubscriptionId: string;
  providerCustomerId: string | null;
  currentPeriodEnd: Date | null;
}): Promise<void> {
  await db.transaction(async (tx) => {
    // Upsert the subscription record.
    // We check for an existing row for this provider subscription ID
    // first — webhooks can and do fire more than once for the same event
    // (Paystack and Stripe both recommend treating webhooks as
    // at-least-once delivery, never exactly-once).
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

    // Flip the user's tier — this is what every feature gate checks.
    await tx
      .update(users)
      .set({ subscriptionTier: "pro", updatedAt: new Date() })
      .where(eq(users.id, params.userId));
  });
}

// ─── Mark a subscription as canceled (period-end downgrade) ──────────────────

/**
 * Called when a provider confirms a subscription has actually ended
 * (not just "cancellation requested" — that's handled separately by
 * scheduleSubscriptionCancellation below).
 */
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

/**
 * Called when payment fails repeatedly (past_due grace period exhausted).
 * Same effect as downgradeToFree, but tracked as a distinct status for
 * potential future dunning/win-back email logic.
 */
export async function markPastDue(userId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status: "past_due", updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId));
  // Note: we do NOT immediately downgrade on past_due — providers retry
  // payment for several days first. Only a final "subscription deleted"
  // / "subscription disabled" event triggers downgradeToFree.
}

// ─── Lookups ──────────────────────────────────────────────────────────────────

export async function getActiveSubscription(userId: string) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(subscriptions.createdAt);

  // Most recent row reflects current state (we never delete rows —
  // upserts above update in place, so there's normally just one per provider)
  return rows[rows.length - 1] ?? null;
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
