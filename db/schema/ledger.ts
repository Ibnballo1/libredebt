import {
  pgTable,
  text,
  timestamp,
  index,
  uuid,
  bigint,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { ledgerEntryTypeEnum, ledgerRecordedByEnum } from "./enums";
import { debts } from "./debts";

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    debtId: uuid("debt_id")
      .notNull()
      .references(() => debts.id, { onDelete: "restrict" }),

    userId: text("user_id").notNull(),

    type: ledgerEntryTypeEnum("type").notNull(),

    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),

    /**
     * Fixed the loop: We declare the column as a standard standalone UUID column here.
     * We will explicitly handle the self-referencing foreign key constraint at the bottom
     * of the file in the table properties block to avoid TS7022/TS7024 initialization loops.
     */
    referenceEntryId: uuid("reference_entry_id"),

    recordedBy: ledgerRecordedByEnum("recorded_by").notNull().default("user"),

    note: text("note"),

    effectiveDate: timestamp("effective_date", { withTimezone: true })
      .notNull()
      .defaultNow(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // ─── HIGH PERFORMANCE DATABASE INDEXES ───────────────────────────────────
    index("ledger_entries_debt_id_idx").on(table.debtId),
    index("ledger_entries_user_id_idx").on(table.userId),
    index("ledger_entries_debt_user_idx").on(table.debtId, table.userId),
    index("ledger_entries_debt_effective_idx").on(
      table.debtId,
      table.effectiveDate,
    ),

    // ─── SELF REFERENCING FOREIGN KEY (Loop Fix) ─────────────────────────────
    /**
     * Moving the reference rule down here allows the main schema fields to register first.
     * TypeScript can now infer everything perfectly without encountering circular dependency traps.
     */
    foreignKey({
      columns: [table.referenceEntryId],
      foreignColumns: [table.id],
      name: "ledger_entries_self_fk",
    }).onDelete("restrict"),

    // ─── FINTECH LEDGER INTEGRITY CONSTRAINTS ────────────────────────────────
    check("amount_cannot_be_zero", sql`${table.amountMinor} <> 0`),

    check(
      "ledger_business_rules",
      sql`
        (type = 'opening' AND amount_minor > 0) OR
        (type = 'interest' AND amount_minor > 0) OR
        (type = 'fee' AND amount_minor > 0) OR
        (type = 'payment' AND amount_minor < 0) OR
        (type = 'reversal' AND amount_minor <> 0 AND reference_entry_id IS NOT NULL) OR
        (type = 'adjustment' AND note IS NOT NULL AND length(trim(note)) > 0)
      `,
    ),
  ],
);

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
