/**
 * server/repositories/receivable.repository.ts
 *
 * Mirrors server/repositories/debt.repository.ts exactly, including the
 * critical lesson from the Stage 6 bugfix: balance computation uses a
 * separate GROUP BY query, NEVER a correlated subquery via Drizzle's
 * sql`` template — that pattern silently returns 0 for every row because
 * Drizzle binds column references inside the template as parameters,
 * not as resolved SQL identifiers, breaking the correlation entirely.
 */

import { db } from "@/db";
import { receivables, receivableLedgerEntries } from "@/db/schema/receivables";
import { eq, and, count, sum, desc } from "drizzle-orm";

type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ─── Internal helper: balance map ──────────────────────────────────────────────

async function fetchBalanceMap(
  userId: string,
  tx?: TxClient,
): Promise<Map<string, number>> {
  const client = tx ?? db;

  const rows = await client
    .select({
      receivableId: receivableLedgerEntries.receivableId,
      balanceMinor: sum(receivableLedgerEntries.amountMinor),
    })
    .from(receivableLedgerEntries)
    .where(eq(receivableLedgerEntries.userId, userId))
    .groupBy(receivableLedgerEntries.receivableId);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(
      row.receivableId,
      row.balanceMinor !== null ? Number(row.balanceMinor) : 0,
    );
  }
  return map;
}

// ─── Read queries ─────────────────────────────────────────────────────────────

export async function getActiveReceivablesByUserId(
  userId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;

  const rows = await client
    .select()
    .from(receivables)
    .where(
      and(eq(receivables.userId, userId), eq(receivables.status, "active")),
    )
    .orderBy(desc(receivables.createdAt));

  if (rows.length === 0) return [];

  const balanceMap = await fetchBalanceMap(userId, tx);

  return rows.map((r) => ({
    ...r,
    originalAmountMinor: Number(r.originalAmountMinor),
    currentBalanceMinor: Math.max(0, balanceMap.get(r.id) ?? 0),
  }));
}

export async function getReceivableById(
  receivableId: string,
  userId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;

  const rows = await client
    .select()
    .from(receivables)
    .where(
      and(eq(receivables.id, receivableId), eq(receivables.userId, userId)),
    )
    .limit(1);

  const receivable = rows[0];
  if (!receivable) return null;

  const balanceRows = await client
    .select({ balanceMinor: sum(receivableLedgerEntries.amountMinor) })
    .from(receivableLedgerEntries)
    .where(
      and(
        eq(receivableLedgerEntries.receivableId, receivableId),
        eq(receivableLedgerEntries.userId, userId),
      ),
    )
    .groupBy(receivableLedgerEntries.receivableId);

  const rawBalance = balanceRows[0]?.balanceMinor ?? null;
  const currentBalanceMinor = Math.max(
    0,
    rawBalance !== null ? Number(rawBalance) : 0,
  );

  return {
    ...receivable,
    originalAmountMinor: Number(receivable.originalAmountMinor),
    currentBalanceMinor,
  };
}

export async function countActiveReceivablesByUserId(
  userId: string,
  tx?: TxClient,
): Promise<number> {
  const client = tx ?? db;
  const result = await client
    .select({ value: count() })
    .from(receivables)
    .where(
      and(eq(receivables.userId, userId), eq(receivables.status, "active")),
    );
  return result[0]?.value ?? 0;
}

export async function getReceivableLedgerEntries(
  receivableId: string,
  userId: string,
  tx?: TxClient,
) {
  const client = tx ?? db;
  const rows = await client
    .select()
    .from(receivableLedgerEntries)
    .where(
      and(
        eq(receivableLedgerEntries.receivableId, receivableId),
        eq(receivableLedgerEntries.userId, userId),
      ),
    )
    .orderBy(desc(receivableLedgerEntries.effectiveDate));

  return rows.map((r) => ({ ...r, amountMinor: Number(r.amountMinor) }));
}

// ─── Write queries ────────────────────────────────────────────────────────────

export async function insertReceivable(
  values: {
    id: string;
    userId: string;
    name: string;
    debtorName: string;
    debtorPhone: string | undefined;
    debtorRelationship: string | undefined;
    originalAmountMinor: number;
    currency: string;
    expectedByDate: Date | null;
    notes: string | undefined;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;
  const result = await client.insert(receivables).values(values).returning();
  return result[0] ?? null;
}

export async function insertReceivableLedgerEntry(
  values: {
    id: string;
    receivableId: string;
    userId: string;
    type: "opening" | "repayment" | "adjustment";
    amountMinor: number;
    recordedBy: "user" | "system";
    note: string | undefined;
    effectiveDate: Date;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;
  const result = await client
    .insert(receivableLedgerEntries)
    .values(values)
    .returning();
  return result[0] ?? null;
}

export async function updateReceivable(
  receivableId: string,
  userId: string,
  values: {
    name: string;
    debtorName: string;
    debtorPhone: string | undefined;
    debtorRelationship: string | undefined;
    currency: string;
    expectedByDate: Date | null;
    notes: string | undefined;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;
  const result = await client
    .update(receivables)
    .set({ ...values, updatedAt: new Date() })
    .where(
      and(eq(receivables.id, receivableId), eq(receivables.userId, userId)),
    )
    .returning();
  return result[0] ?? null;
}

export async function setReceivableStatus(
  receivableId: string,
  userId: string,
  status: "active" | "settled" | "archived",
  tx?: TxClient,
) {
  const client = tx ?? db;
  const result = await client
    .update(receivables)
    .set({ status, updatedAt: new Date() })
    .where(
      and(eq(receivables.id, receivableId), eq(receivables.userId, userId)),
    )
    .returning();
  return result[0] ?? null;
}
