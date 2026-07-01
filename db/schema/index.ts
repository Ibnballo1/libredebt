// ─── ENUMS & SCHEMA EXPORTS ──────────────────────────────────────────────────
export * from "./enums";
export * from "./users";
export * from "./debts";
export * from "./ledger";
export * from "./subscriptions";
export * from "./reminders";
export * from "./receivables";

// ─── DRIZZLE RELATIONAL LAYER ────────────────────────────────────────────────
import { relations } from "drizzle-orm";
import { userProfiles } from "./users";
import { debts } from "./debts";
import { ledgerEntries } from "./ledger";
import { subscriptions } from "./subscriptions";
import { reminders } from "./reminders";
import { receivables } from "./receivables";
// import {receivable_ledger_entries} from "./receivables";

/**
 * User Profiles Relational Ecosystem
 */
export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  debts: many(debts),
  subscriptions: many(subscriptions),
  ledgerEntries: many(ledgerEntries),
  reminders: many(reminders),
  receivables: many(receivables),
}));

/**
 * Debts Relational Ecosystem
 */
export const debtsRelations = relations(debts, ({ one, many }) => ({
  userProfile: one(userProfiles, {
    fields: [debts.userId],
    references: [userProfiles.id],
  }),
  ledgerEntries: many(ledgerEntries),
  reminders: many(reminders),
  receivables: many(receivables),
}));

/**
 * Ledger Entries Relational Ecosystem (Includes Reversal Self-Reference Loops)
 */
export const ledgerEntriesRelations = relations(
  ledgerEntries,
  ({ one, many }) => ({
    debt: one(debts, {
      fields: [ledgerEntries.debtId],
      references: [debts.id],
    }),
    userProfile: one(userProfiles, {
      fields: [ledgerEntries.userId],
      references: [userProfiles.id],
    }),
    /**
     * Self-referencing link for ledger adjustments and reversals.
     * Maps an entry back to the original financial marker transaction it addresses.
     */
    originalEntry: one(ledgerEntries, {
      fields: [ledgerEntries.referenceEntryId],
      references: [ledgerEntries.id],
      relationName: "ledger_reversals",
    }),
    reversals: many(ledgerEntries, {
      relationName: "ledger_reversals",
    }),
  }),
);

/**
 * Reminders Relational Ecosystem
 */
export const remindersRelations = relations(reminders, ({ one }) => ({
  debt: one(debts, {
    fields: [reminders.debtId],
    references: [debts.id],
  }),
  userProfile: one(userProfiles, {
    fields: [reminders.userId],
    references: [userProfiles.id],
  }),
}));

/**
 * Subscriptions Relational Ecosystem
 */
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [subscriptions.userId],
    references: [userProfiles.id],
  }),
}));
