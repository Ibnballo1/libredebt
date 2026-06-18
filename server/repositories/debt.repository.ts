/**
 * server/repositories/debt.repository.ts — DEFINITIVE FIX
 *
 * ROOT CAUSE:
 * The previous version used Drizzle's sql`` tagged template to embed
 * a correlated subquery for balance calculation:
 *
 *   sql`COALESCE((SELECT SUM(${ledgerEntries.amountMinor})
 *               FROM ${ledgerEntries}
 *               WHERE ${ledgerEntries.debtId} = ${debts.id}  ← PROBLEM
 *                 AND ${ledgerEntries.userId} = ${userId}), 0)`
 *
 * Drizzle's sql template treats ${debts.id} as a BOUND PARAMETER (a value
 * to be substituted at execution time), NOT as a correlated column reference
 * to the outer query's `debts.id` column. The resulting SQL is:
 *
 *   COALESCE((SELECT SUM(amount_minor) FROM ledger_entries
 *             WHERE debt_id = $1 AND user_id = $2), 0)
 *
 * where $1 is bound to undefined/null because debts.id has no runtime value
 * in this context — it's a schema column descriptor, not an actual UUID.
 *
 * Result: WHERE clause matches nothing → SUM(nothing) = NULL
 *         → COALESCE(NULL, 0) = 0
 *         → currentBalanceMinor = 0 on EVERY debt
 *         → progress = 100% on every new debt
 *
 * THE FIX:
 * Remove all correlated subqueries. Instead, fetch debts and ledger
 * balances in two separate queries and join them in JavaScript.
 * This is explicit, debuggable, and works correctly with Drizzle's ORM.
 */

import { db } from "@/db";
import { debts, ledgerEntries } from "@/db/schema";
import { eq, and, count, sum, desc } from "drizzle-orm";
// Derive the transaction client type from the actual `db` instance so we don't
// rely on an exported Database type from "@/db" (which may not exist).
type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ─── Internal helper: fetch balance map for a user's debts ───────────────────

/**
 * Returns a Map<debtId, currentBalanceMinor> for all the given debt IDs.
 *
 * Uses a single GROUP BY query — one database round-trip, no subqueries,
 * no correlated references. Drizzle handles this pattern correctly.
 *
 * The balance for each debt is the SUM of all its ledger entries:
 *   Opening entry:  +originalAmount  (positive)
 *   Payment entry:  -paymentAmount   (negative)
 *   Net balance:     currentBalance  (what the user still owes)
 */
async function fetchBalanceMap(
  userId: string,
  tx?: TxClient,
): Promise<Map<string, number>> {
  const client = tx ?? db;

  const rows = await client
    .select({
      debtId: ledgerEntries.debtId,
      balanceMinor: sum(ledgerEntries.amountMinor),
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId))
    .groupBy(ledgerEntries.debtId);

  const map = new Map<string, number>();
  for (const row of rows) {
    // sum() returns string | null in Drizzle (PostgreSQL SUM can be null)
    map.set(
      row.debtId,
      row.balanceMinor !== null ? Number(row.balanceMinor) : 0,
    );
  }
  return map;
}

// ─── Read queries ─────────────────────────────────────────────────────────────

/**
 * Get all active debts for a user with their current balances.
 */
export async function getActiveDebtsByUserId(userId: string, tx?: TxClient) {
  const client = tx ?? db;

  // Step 1: fetch debt metadata
  const debtRows = await client
    .select()
    .from(debts)
    .where(and(eq(debts.userId, userId), eq(debts.status, "active")))
    .orderBy(desc(debts.createdAt));

  if (debtRows.length === 0) return [];

  // Step 2: fetch balances for all debts in one query
  const balanceMap = await fetchBalanceMap(userId, tx);

  // Step 3: merge in JavaScript — no SQL trickery needed
  return debtRows.map((debt) => ({
    ...debt,
    originalAmountMinor: Number(debt.originalAmountMinor),
    minimumPaymentMinor: Number(debt.minimumPaymentMinor),
    currentBalanceMinor: Math.max(0, balanceMap.get(debt.id) ?? 0),
  }));
}

/**
 * Get a single debt by ID with its current balance.
 * Returns null if not found or not owned by the user.
 */
export async function getDebtById(
  debtId: string,
  userId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;

  // Step 1: fetch the debt
  const rows = await client
    .select()
    .from(debts)
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .limit(1);

  const debt = rows[0];
  if (!debt) return null;

  // Step 2: fetch the balance with a simple GROUP BY query
  const balanceRows = await client
    .select({ balanceMinor: sum(ledgerEntries.amountMinor) })
    .from(ledgerEntries)
    .where(
      and(eq(ledgerEntries.debtId, debtId), eq(ledgerEntries.userId, userId)),
    )
    .groupBy(ledgerEntries.debtId);

  const rawBalance = balanceRows[0]?.balanceMinor ?? null;
  const currentBalanceMinor = Math.max(
    0,
    rawBalance !== null ? Number(rawBalance) : 0,
  );

  return {
    ...debt,
    originalAmountMinor: Number(debt.originalAmountMinor),
    minimumPaymentMinor: Number(debt.minimumPaymentMinor),
    currentBalanceMinor,
  };
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
 */
export async function getLedgerEntriesByDebtId(
  debtId: string,
  userId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;

  const rows = await client
    .select()
    .from(ledgerEntries)
    .where(
      and(eq(ledgerEntries.debtId, debtId), eq(ledgerEntries.userId, userId)),
    )
    .orderBy(desc(ledgerEntries.effectiveDate));

  // Ensure amountMinor is always a JS number
  return rows.map((r) => ({
    ...r,
    amountMinor: Number(r.amountMinor),
  }));
}

// ─── Write queries ────────────────────────────────────────────────────────────

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
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .returning();

  return result[0] ?? null;
}

export async function archiveDebt(
  debtId: string,
  userId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;

  const result = await client
    .update(debts)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .returning();

  return result[0] ?? null;
}
