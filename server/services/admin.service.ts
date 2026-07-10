/**
 * server/services/admin.service.ts — OPTIMIZED
 */

import { db } from "@/db";
import { users, debts, ledgerEntries, subscriptions } from "@/db/schema";
import { eq, and, count, sum, sql, inArray, desc, gte } from "drizzle-orm";

export type SystemOverview = {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  totalActiveDebts: number;
  totalArchivedDebts: number;
  totalOriginalDebtMinor: number;
  totalCurrentOutstandingMinor: number;
  totalPaymentsRecorded: number;
  totalAmountRepaidMinor: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  mrrEstimateMinor: number;
};

export async function getSystemOverview(): Promise<SystemOverview> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    userCounts,
    debtCounts,
    debtSums,
    ledgerCounts,
    newUsers7,
    newUsers30,
    activeProSubs,
    outstandingSum, // ◄◄◄ NEW: Blazing fast single aggregate query
  ] = await Promise.all([
    db
      .select({
        total: count(),
        pro: sql<number>`COUNT(*) FILTER (WHERE ${users.subscriptionTier} = 'pro')`.mapWith(
          Number,
        ),
      })
      .from(users),

    db
      .select({
        active:
          sql<number>`COUNT(*) FILTER (WHERE ${debts.status} = 'active')`.mapWith(
            Number,
          ),
        archived:
          sql<number>`COUNT(*) FILTER (WHERE ${debts.status} = 'archived')`.mapWith(
            Number,
          ),
      })
      .from(debts),

    db
      .select({ totalOriginal: sum(debts.originalAmountMinor) })
      .from(debts)
      .where(eq(debts.status, "active")),

    db
      .select({
        paymentCount:
          sql<number>`COUNT(*) FILTER (WHERE ${ledgerEntries.type} = 'payment')`.mapWith(
            Number,
          ),
      })
      .from(ledgerEntries),

    db
      .select({ value: count() })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo)),

    db
      .select({ value: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo)),

    db
      .select({ value: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),

    // ◄◄◄ EXPLICIT FIX: Compute system outstanding sum natively inside SQL.
    // This aggregates millions of lines down to 1 row before sending across the network.
    db
      .select({
        totalOutstanding:
          sql<number>`COALESCE(SUM(${ledgerEntries.amountMinor}), 0)`.mapWith(
            Number,
          ),
      })
      .from(ledgerEntries)
      .innerJoin(debts, eq(ledgerEntries.debtId, debts.id))
      .where(eq(debts.status, "active")),
  ]);

  const totalOriginalDebtMinor = Number(debtSums[0]?.totalOriginal ?? 0);

  // Safely grab the single value returned from our native database sum query
  const totalCurrentOutstandingMinor = Math.max(
    0,
    outstandingSum[0]?.totalOutstanding ?? 0,
  );

  const totalAmountRepaidMinor = Math.max(
    0,
    totalOriginalDebtMinor - totalCurrentOutstandingMinor,
  );

  const FLAT_PRO_PRICE_NGN_MINOR = 550_000; // Updated to match your actual ₦5,500 1-Year plan tier subunit
  const mrrEstimateMinor =
    (activeProSubs[0]?.value ?? 0) * FLAT_PRO_PRICE_NGN_MINOR;

  return {
    totalUsers: userCounts[0]?.total ?? 0,
    proUsers: userCounts[0]?.pro ?? 0,
    freeUsers: (userCounts[0]?.total ?? 0) - (userCounts[0]?.pro ?? 0),
    totalActiveDebts: debtCounts[0]?.active ?? 0,
    totalArchivedDebts: debtCounts[0]?.archived ?? 0,
    totalOriginalDebtMinor,
    totalCurrentOutstandingMinor,
    totalPaymentsRecorded: ledgerCounts[0]?.paymentCount ?? 0,
    totalAmountRepaidMinor,
    newUsersLast7Days: newUsers7[0]?.value ?? 0,
    newUsersLast30Days: newUsers30[0]?.value ?? 0,
    mrrEstimateMinor,
  };
}

// ─── Signup growth chart ───────────────────────────────────────────────────────

export type SignupGrowthPoint = { dateLabel: string; count: number };

export async function getSignupGrowth(
  daysBack = 30,
): Promise<SignupGrowthPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - (daysBack - 1));
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(gte(users.createdAt, since));

  const points: SignupGrowthPoint[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < daysBack; i++) {
    points.push({
      dateLabel: cursor.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
      }),
      count: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const row of rows) {
    const daysSince = Math.floor(
      (new Date(row.createdAt).getTime() - since.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysSince >= 0 && daysSince < daysBack) {
      points[daysSince]!.count++;
    }
  }

  return points;
}

// ─── User list (searchable) ────────────────────────────────────────────────────

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  subscriptionTier: "free" | "pro";
  activeDebtCount: number;
  totalOutstandingMinor: number;
  createdAt: Date;
};

export async function searchUsers(
  query: string,
  limit = 50,
): Promise<AdminUserListItem[]> {
  const userRows = query
    ? await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          subscriptionTier: users.subscriptionTier,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          sql`${users.email} ILIKE ${"%" + query + "%"} OR ${users.name} ILIKE ${"%" + query + "%"}`,
        )
        .orderBy(desc(users.createdAt))
        .limit(limit)
    : await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          subscriptionTier: users.subscriptionTier,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit);

  if (userRows.length === 0) return [];

  const userIds = userRows.map((u) => u.id);

  const debtCountRows = await db
    .select({ userId: debts.userId, activeCount: count() })
    .from(debts)
    .where(and(eq(debts.status, "active"), inArray(debts.userId, userIds)))
    .groupBy(debts.userId);

  const debtCountMap = new Map(
    debtCountRows.map((r) => [r.userId, r.activeCount]),
  );

  const balanceRows = await db
    .select({
      userId: ledgerEntries.userId,
      balance: sum(ledgerEntries.amountMinor),
    })
    .from(ledgerEntries)
    .innerJoin(debts, eq(ledgerEntries.debtId, debts.id))
    .where(
      and(eq(debts.status, "active"), inArray(ledgerEntries.userId, userIds)),
    )
    .groupBy(ledgerEntries.userId);

  const balanceMap = new Map(
    balanceRows.map((r) => [r.userId, Math.max(0, Number(r.balance ?? 0))]),
  );

  return userRows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    subscriptionTier: u.subscriptionTier as "free" | "pro",
    activeDebtCount: debtCountMap.get(u.id) ?? 0,
    totalOutstandingMinor: balanceMap.get(u.id) ?? 0,
    createdAt: u.createdAt,
  }));
}

// ─── Per-user drill-down (read-only) ────────────────────────────────────────────

export type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  subscriptionTier: "free" | "pro";
  currency: string;
  createdAt: Date;
  subscription: {
    provider: string;
    status: string;
    currentPeriodEnd: Date | null;
  } | null;
  debts: Array<{
    id: string;
    name: string;
    creditor: string;
    status: string;
    originalAmountMinor: number;
    currentBalanceMinor: number;
    currency: string;
  }>;
};

export async function getAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail | null> {
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = userRows[0];
  if (!user) return null;

  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const debtRows = await db
    .select()
    .from(debts)
    .where(eq(debts.userId, userId));

  const balanceRows = await db
    .select({
      debtId: ledgerEntries.debtId,
      balance: sum(ledgerEntries.amountMinor),
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId))
    .groupBy(ledgerEntries.debtId);

  const balanceMap = new Map(
    balanceRows.map((r) => [r.debtId, Math.max(0, Number(r.balance ?? 0))]),
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    subscriptionTier: user.subscriptionTier as "free" | "pro",
    currency: user.currency || "USD",
    createdAt: user.createdAt,
    subscription: subRows[0]
      ? {
          provider: subRows[0].provider,
          status: subRows[0].status,
          currentPeriodEnd: subRows[0].currentPeriodEnd,
        }
      : null,
    debts: debtRows.map((d) => ({
      id: d.id,
      name: d.name,
      creditor: d.creditor,
      status: d.status,
      originalAmountMinor: Number(d.originalAmountMinor),
      currentBalanceMinor: balanceMap.get(d.id) ?? 0,
      currency: d.currency,
    })),
  };
}

export async function getAdminUserLedger(userId: string, debtId: string) {
  return db
    .select()
    .from(ledgerEntries)
    .where(
      and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.debtId, debtId)),
    )
    .orderBy(desc(ledgerEntries.effectiveDate));
}
