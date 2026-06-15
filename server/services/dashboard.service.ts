/**
 * server/services/dashboard.service.ts
 *
 * Highly optimized compilation layer for the central dashboard metrics.
 * Combines active ledger sums and account metrics into a single structural
 * database transaction request to cut network latency in half.
 */
import { db } from "@/db";
import { debts, ledgerEntries } from "@/db/schema";
import { eq, and, sum, count } from "drizzle-orm";

export type DashboardStats = {
  activeDebtCount: number;
  totalOriginalMinor: number; // Combined baseline value across all operational items
  totalCurrentMinor: number; // Calculated live balances derived mathematically from ledger entries
  totalRepaidMinor: number; // Calculated user progress margin (Original - Current)
};

/**
 * Fetches compiled metrics for a target account profile.
 * Executes both counts and ledger summation calculations inside a single query.
 */
export async function getDashboardStats(
  userId: string,
): Promise<DashboardStats> {
  // Query execution aggregates items simultaneously by querying the core schema
  // while utilizing isolated sub-joins to pull in current balance logs.
  const [metricsPayload] = await db
    .select({
      activeDebtCount: count(debts.id),
      totalOriginal: sum(debts.originalAmountMinor),
      totalCurrent: sum(ledgerEntries.amountMinor),
    })
    .from(debts)
    // Left join ensures users with accounts but no payments don't return null structural trees
    .leftJoin(ledgerEntries, eq(ledgerEntries.debtId, debts.id))
    .where(and(eq(debts.userId, userId), eq(debts.status, "active")));

  // Parse strings returned from standard SQL SUM statements into clean numbers
  const activeDebtCount = metricsPayload?.activeDebtCount ?? 0;
  const totalOriginalMinor = Number(metricsPayload?.totalOriginal ?? 0);
  const totalCurrentMinor = Math.max(
    0,
    Number(metricsPayload?.totalCurrent ?? 0),
  );

  // Guard clause against empty states or new signups with zero records
  if (activeDebtCount === 0) {
    return {
      activeDebtCount: 0,
      totalOriginalMinor: 0,
      totalCurrentMinor: 0,
      totalRepaidMinor: 0,
    };
  }

  const totalRepaidMinor = Math.max(0, totalOriginalMinor - totalCurrentMinor);

  return {
    activeDebtCount,
    totalOriginalMinor,
    totalCurrentMinor,
    totalRepaidMinor,
  };
}
