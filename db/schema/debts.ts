// db/schema/debts.ts

import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  uuid,
  varchar,
  char,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { debtStatusEnum } from "./enums";

export const debts = pgTable(
  "debts",
  {
    /**
     * Native PostgreSQL UUID primary key.
     * Uses defaultRandom() to leverage pg_crypto generation natively inside the database engine.
     */
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * Owner of this debt record.
     * Matches BetterAuth's default text/string identifier system.
     */
    userId: text("user_id").notNull(),

    /**
     * Human-readable identity tags with realistic maximum lengths.
     */
    name: varchar("name", { length: 100 }).notNull(),
    creditor: varchar("creditor", { length: 100 }).notNull(),

    /**
     * Financial Metadata in Integer Minor Units (Cents/Kobo).
     * Must be strictly positive or zero.
     */
    originalAmountMinor: integer("original_amount_minor").notNull(),
    interestRateBps: integer("interest_rate_bps").notNull().default(0),
    minimumPaymentMinor: integer("minimum_payment_minor").notNull().default(0),

    /**
     * Due Day tracking restricted to logical monthly calendar cycles (1 - 31).
     */
    dueDay: integer("due_day"),

    /**
     * Strict ISO 4217 Currency Code enforcement (exactly 3 characters, e.g., "NGN", "USD").
     */
    currency: char("currency", { length: 3 }).notNull().default("NGN"),

    /**
     * Lifecycle tracking status mapping our custom extended enums.
     */
    status: debtStatusEnum("status").notNull().default("active"),

    /**
     * Optional annotations about the specific debt conditions.
     */
    notes: text("notes"),

    /**
     * Strategy ordering for the debt snowball/avalanche algorithm.
     * Null means the debt is not part of the current strategy.
     */
    strategyOrder: integer("strategy_order"),

    /**
     * Milestone timestamps for data visibility metrics.
     */
    settledAt: timestamp("settled_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    /**
     * Fixed via Drizzle runtime trigger invocation.
     * $onUpdateFn ensures this updates every time a mutation executes on this row.
     */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    // ─── INDEXES ─────────────────────────────────────────────────────────────
    index("debts_user_id_idx").on(table.userId),
    index("debts_user_id_status_idx").on(table.userId, table.status),

    // ─── CHECK CONSTRAINTS (DATA INTEGRITY LAYER) ────────────────────────────
    check("original_amount_positive", sql`${table.originalAmountMinor} > 0`),
    check("interest_rate_non_negative", sql`${table.interestRateBps} >= 0`),
    check(
      "minimum_payment_non_negative",
      sql`${table.minimumPaymentMinor} >= 0`,
    ),
    check("due_day_valid", sql`${table.dueDay} >= 1 AND ${table.dueDay} <= 31`),
    check("strategy_order_positive", sql`${table.strategyOrder} > 0`),
  ],
);

export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
