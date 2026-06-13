import {
  pgTable,
  text,
  timestamp,
  index,
  uuid,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import {
  subscriptionStatusEnum,
  billingPlanEnum,
  paymentProviderEnum,
} from "./enums";

export const subscriptions = pgTable(
  "subscriptions",
  {
    /**
     * Native PostgreSQL UUID primary key.
     */
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * Owner of this subscription. Matches BetterAuth's text-based authentication identifier.
     */
    userId: text("user_id").notNull(),

    /**
     * The paid billing tier tier. Free users lack a subscription row completely.
     */
    plan: billingPlanEnum("plan").notNull(),

    /**
     * The processing lifecycle status mirrored directly from the vendor's engine.
     */
    status: subscriptionStatusEnum("status").notNull(),

    /**
     * Explicit gateway declaration handler ('stripe' | 'paystack').
     */
    provider: paymentProviderEnum("provider").notNull(),

    /**
     * Enforced unique identifier mappings. One external subscription token
     * should map to exactly one database entry to lock down integrity.
     */
    providerSubscriptionId: varchar("provider_subscription_id", { length: 255 })
      .notNull()
      .unique(),

    providerCustomerId: varchar("provider_customer_id", { length: 255 }),

    /**
     * Complete lifecycle mapping window. Necessary for precise generation
     * of analytics metrics, historical audit lookups, and boundary renewals.
     */
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

    /**
     * Idempotency Guardrail. Tracks the most recent event hash emitted by the gateway.
     * Before processing an incoming webhook, check if eventId === lastWebhookEventId to prevent duplication bugs.
     */
    lastWebhookEventId: varchar("last_webhook_event_id", { length: 255 }),

    /**
     * Flexible Schemaless Metadata Store.
     * Captures specific gateway data structures (e.g., variant tax IDs, coupon tokens, plan codes)
     * without introducing endless schema migrations.
     */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    canceledAt: timestamp("canceled_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    /**
     * Auto-updating structural mutation anchor utilizing the Drizzle internal runtime callback handler.
     */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    // ─── OPTIMIZED BILLING INDEXES ───────────────────────────────────────────
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_provider_sub_id_idx").on(table.providerSubscriptionId),

    /**
     * Composite Index optimized for lightning-fast application authentication loops.
     * Selects active statuses tied directly to the parsing user's context instantly.
     */
    index("subscriptions_user_status_idx").on(table.userId, table.status),
  ],
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
