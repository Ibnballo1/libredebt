/**
 * db/schema/receivables.ts
 *
 * THE MIRROR OF debts.ts — but a separate table, not a flag.
 *
 * A debt = money the user owes someone else.
 * A receivable = money someone else owes the user.
 *
 * WHY A SEPARATE TABLE INSTEAD OF debts.type = 'receivable'?
 * The fields genuinely differ:
 *   - debts have: interestRateBps, minimumPaymentMinor, dueDay (monthly)
 *   - receivables have: debtorName, debtorPhone, debtorRelationship,
 *     expectedByDate (a single date, not a recurring monthly day)
 * Forcing both into one table means every column is nullable for one
 * side or the other, and every query needs a WHERE type = ... guard
 * that's easy to forget. Two tables with the same underlying pattern
 * (metadata table + append-only ledger) is more code but far safer.
 *
 * SIGN CONVENTION (same principle as the debt ledger):
 *   Opening entry:   +amount  (they now owe you this much)
 *   Repayment entry: -amount  (they paid you back, owe less)
 *   Balance = SUM(entries) = what they currently owe you
 *
 * This is the SAME sign convention as debts.ts — positive increases
 * the balance, negative decreases it — just the human meaning of
 * "balance" flips from "what I owe" to "what they owe me."
 */

import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * Receivable lifecycle status — mirrors debtStatusEnum.
 * - active:   still owed, being tracked
 * - settled:  fully repaid (balance reached 0) — distinct from "archived"
 *             so we can show a "people who paid you back" history
 * - archived: user manually archived (e.g. wrote off as uncollectable)
 */
export const receivableStatusEnum = pgEnum("receivable_status", [
  "active",
  "settled",
  "archived",
]);

/**
 * Receivable ledger entry types — simpler than the debt ledger's set.
 * - opening:    the initial amount lent / owed to the user
 * - repayment:  the debtor paid some of it back (negative amount)
 * - adjustment: manual correction (e.g. "forgave ₦5,000", "added late fee")
 */
export const receivableLedgerTypeEnum = pgEnum("receivable_ledger_type", [
  "opening",
  "repayment",
  "adjustment",
]);

export const receivables = pgTable(
  "receivables",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    /** The user who is OWED money (i.e. our app user, the lender) */
    userId: text("user_id").notNull(),

    /** A short label, e.g. "Loan to Chidi for rent". Mirrors debts.name. */
    name: text("name").notNull(),

    /** Contact info for the person who owes money — NOT bank details. */
    debtorName: text("debtor_name").notNull(),
    debtorPhone: text("debtor_phone"),
    /** e.g. "Brother", "Coworker", "Friend" — free text, optional context */
    debtorRelationship: text("debtor_relationship"),

    /**
     * Original amount lent, in minor units. Immutable after creation,
     * exactly like debts.originalAmountMinor — the baseline for progress.
     */
    originalAmountMinor: integer("original_amount_minor").notNull(),

    currency: text("currency").notNull().default("NGN"),

    /**
     * A single expected repayment date (not a recurring monthly day —
     * informal loans rarely repeat). Nullable.
     */
    expectedByDate: timestamp("expected_by_date", { withTimezone: true }),

    status: receivableStatusEnum("status").notNull().default("active"),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("receivables_user_id_idx").on(table.userId),
    index("receivables_user_id_status_idx").on(table.userId, table.status),
  ],
);

export const receivableLedgerEntries = pgTable(
  "receivable_ledger_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    receivableId: text("receivable_id")
      .notNull()
      .references(() => receivables.id, { onDelete: "cascade" }),

    /** Denormalized for query performance, same pattern as ledgerEntries.userId */
    userId: text("user_id").notNull(),

    type: receivableLedgerTypeEnum("type").notNull(),

    /**
     * Signed integer, minor units.
     * Positive = increases what they owe you (opening, or "lent more")
     * Negative = decreases what they owe you (repayment)
     */
    amountMinor: integer("amount_minor").notNull(),

    recordedBy: text("recorded_by").notNull().default("user"), // 'user' | 'system'

    note: text("note"),

    effectiveDate: timestamp("effective_date", { withTimezone: true })
      .notNull()
      .defaultNow(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("receivable_ledger_receivable_id_idx").on(table.receivableId),
    index("receivable_ledger_user_id_idx").on(table.userId),
  ],
);

export type Receivable = typeof receivables.$inferSelect;
export type NewReceivable = typeof receivables.$inferInsert;
export type ReceivableLedgerEntry = typeof receivableLedgerEntries.$inferSelect;
export type NewReceivableLedgerEntry =
  typeof receivableLedgerEntries.$inferInsert;
