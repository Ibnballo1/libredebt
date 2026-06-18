/**
 * server/repositories/debt.repository.ts
 *
 * All database queries for the debt domain.
 *
 * WHY A SEPARATE REPOSITORY LAYER?
 * Server Actions call Services. Services call Repositories.
 * Repositories are the ONLY place that touches the database.
 *
 * This separation means:
 *   - Business logic (service) is testable without a real database
 *   - Changing a query only changes one file
 *   - The query patterns are consistent and auditable
 *
 * SECURITY: Every query filters by userId. Even if a Server Action
 * somehow received a wrong debtId, the userId filter ensures
 * a user can never read or modify another user's data.
 * Supabase RLS is the second enforcement layer.
 *
 * TRANSACTION SUPPORT:
 * Functions accept an optional `tx` parameter (transaction client).
 * This allows the service layer to run multiple repository operations
 * inside a single atomic transaction — critical for the ledger pattern
 * (create debt + create opening ledger entry must succeed or fail together).
 */

import { db } from "@/db";
import { debts, ledgerEntries } from "@/db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";
// Derive Database type from the db instance to avoid importing a missing export
type Database = typeof db;

// Transaction client type — matches what Drizzle passes inside .transaction()
type TxClient = Parameters<Parameters<Database["transaction"]>[0]>[0];

// ─── Read queries ──────────────────────────────────────────────────────────────

/**
 * Get all active debts for a user, ordered by creation date (newest first).
 * Includes computed current balance from ledger entries.
 */
export async function getActiveDebtsByUserId(userId: string, tx?: TxClient) {
  const client = tx ?? db;

  const rows = await client
    .select({
      id: debts.id,
      name: debts.name,
      creditor: debts.creditor,
      originalAmountMinor: debts.originalAmountMinor,
      interestRateBps: debts.interestRateBps,
      minimumPaymentMinor: debts.minimumPaymentMinor,
      dueDay: debts.dueDay,
      currency: debts.currency,
      status: debts.status,
      notes: debts.notes,
      // strategyOrder: debts.strategyOrder,
      createdAt: debts.createdAt,
      updatedAt: debts.updatedAt,
      // Compute current balance from ledger in the same query
      currentBalanceMinor: sql<number>`
        COALESCE((
          SELECT SUM(${ledgerEntries.amountMinor})
          FROM ${ledgerEntries}
          WHERE ${ledgerEntries.debtId} = ${debts.id}
          AND ${ledgerEntries.userId} = ${userId}
        ), 0)
      `.mapWith(Number),
    })
    .from(debts)
    .where(and(eq(debts.userId, userId), eq(debts.status, "active")))
    .orderBy(desc(debts.createdAt));

  return rows;
}

/**
 * Get a single debt by ID, verifying ownership.
 * Returns null if not found or not owned by userId.
 */
export async function getDebtById(
  debtId: string,
  userId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;

  const rows = await client
    .select({
      id: debts.id,
      name: debts.name,
      creditor: debts.creditor,
      originalAmountMinor: debts.originalAmountMinor,
      interestRateBps: debts.interestRateBps,
      minimumPaymentMinor: debts.minimumPaymentMinor,
      dueDay: debts.dueDay,
      currency: debts.currency,
      status: debts.status,
      notes: debts.notes,
      // strategyOrder: debts.strategyOrder,
      createdAt: debts.createdAt,
      updatedAt: debts.updatedAt,
      currentBalanceMinor: sql<number>`
        COALESCE((
          SELECT SUM(${ledgerEntries.amountMinor})
          FROM ${ledgerEntries}
          WHERE ${ledgerEntries.debtId} = ${debts.id}
          AND ${ledgerEntries.userId} = ${userId}
        ), 0)
      `.mapWith(Number),
    })
    .from(debts)
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Count active debts for a user.
 * Used by the subscription gate to enforce the free plan 3-debt limit.
 */
export async function countActiveDebtsByUserId(
  userId: string,
  tx?: TxClient,
): Promise<number> {
  const client = tx ?? db;

  const result = await client
    .select({ value: count() })
    .from(debts)
    .where(and(eq(debts.userId, userId), eq(debts.status, "active")));

  return result[0]?.value ?? 0;
}

/**
 * Get all ledger entries for a debt, ordered by effective date descending.
 * Used for the payment history view.
 */
export async function getLedgerEntriesByDebtId(
  debtId: string,
  userId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;

  return client
    .select()
    .from(ledgerEntries)
    .where(
      and(eq(ledgerEntries.debtId, debtId), eq(ledgerEntries.userId, userId)),
    )
    .orderBy(desc(ledgerEntries.effectiveDate));
}

// ─── Write queries ─────────────────────────────────────────────────────────────

/**
 * Insert a new debt row.
 * Does NOT create the opening ledger entry — that's the service's job
 * so it can be done atomically inside a transaction.
 */
export async function insertDebt(
  values: {
    id: string;
    userId: string;
    name: string;
    creditor: string;
    originalAmountMinor: number;
    interestRateBps: number;
    minimumPaymentMinor: number;
    dueDay: number | null;
    currency: string;
    notes: string | undefined;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;

  const result = await client.insert(debts).values(values).returning();

  return result[0] ?? null;
}

/**
 * Insert a ledger entry.
 * Used for: opening entries, payments, adjustments.
 */
export async function insertLedgerEntry(
  values: {
    id: string;
    debtId: string;
    userId: string;
    type: "opening" | "payment" | "adjustment";
    amountMinor: number;
    recordedBy: "user" | "system";
    note: string | undefined;
    effectiveDate: Date;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;

  const result = await client.insert(ledgerEntries).values(values).returning();

  return result[0] ?? null;
}

/**
 * Update mutable debt fields.
 * Original amount is explicitly excluded — it is immutable after creation.
 */
export async function updateDebt(
  debtId: string,
  userId: string,
  values: {
    name: string;
    creditor: string;
    interestRateBps: number;
    minimumPaymentMinor: number;
    dueDay: number | null;
    currency: string;
    notes: string | undefined;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;

  const result = await client
    .update(debts)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .returning();

  return result[0] ?? null;
}

/**
 * Set a debt's status to 'archived'.
 * Never deletes — ledger entries are preserved.
 */
export async function archiveDebt(
  debtId: string,
  userId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;

  const result = await client
    .update(debts)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .returning();

  return result[0] ?? null;
}
