import {
  pgTable,
  text,
  timestamp,
  index,
  uuid,
  integer,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import {
  reminderTypeEnum,
  reminderStatusEnum,
  notificationChannelEnum,
} from "./enums";
import { debts } from "./debts";

export const reminders = pgTable(
  "reminders",
  {
    /**
     * Native PostgreSQL UUID primary key.
     */
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * Parent debt anchor. Retaining "restrict" guarantees that a user cannot
     * break historical ledger dependencies while background schedules exist.
     */
    debtId: uuid("debt_id")
      .notNull()
      .references(() => debts.id, { onDelete: "restrict" }),

    /**
     * Owner profile token mapping. Aligned to text format for BetterAuth compliance.
     */
    userId: text("user_id").notNull(),

    type: reminderTypeEnum("type").notNull(),

    /**
     * Operational communication delivery destination medium layer.
     */
    channel: notificationChannelEnum("channel").notNull().default("email"),

    /**
     * Targeted processing execution timestamp.
     */
    remindAt: timestamp("remind_at", { withTimezone: true }).notNull(),

    status: reminderStatusEnum("status").notNull().default("pending"),

    /**
     * Observability & Background Engine Telemetry Hooks.
     * Maps processing passes directly to Trigger.dev run IDs and Resend delivery logs.
     */
    triggerTaskId: varchar("trigger_task_id", { length: 255 }),
    providerMessageId: varchar("provider_message_id", { length: 255 }),

    /**
     * Fault-tolerance parameters to govern automatic delivery failure retries safely.
     */
    retryCount: integer("retry_count").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    failureReason: text("failure_reason"),

    /**
     * Audit lifespans. Tracking complete history timelines.
     */
    processedAt: timestamp("processed_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // ─── HIGH PERFORMANCE TELEMETRY INDEXES ──────────────────────────────────
    index("reminders_user_id_idx").on(table.userId),
    index("reminders_debt_id_idx").on(table.debtId),

    /**
     * The Cron Engine Composite Performance Index.
     * Optimized matching exact equality lookups before parsing chronologic timestamp bounds.
     * Strategy: WHERE status = 'pending' AND remind_at <= NOW()
     */
    index("reminders_status_remind_at_idx").on(table.status, table.remindAt),
  ],
);

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
