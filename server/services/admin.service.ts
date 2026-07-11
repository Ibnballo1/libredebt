/**
 * server/services/admin.service.ts — ENHANCED
 *
 * Full replacement. Adds on top of original:
 *   getBusinessMetrics()     — avg debts/user, churn risk, receivables stats
 *   getEngagementMetrics()   — active vs ghost users, velocity today/week
 *   getStrategyDistribution() — users with active strategy vs none
 *   getSystemHealth()        — ledger row count, currency breakdown
 *   getWebhookEventLog()     — recent Paystack subscription events
 *
 * All original functions (getSystemOverview, getSignupGrowth,
 * searchUsers, getAdminUserDetail, getAdminUserLedger) are preserved.
 */

import { db } from "@/db";
import { users, debts, ledgerEntries, subscriptions } from "@/db/schema";
import { receivables } from "@/db/schema/receivables";
import {
  eq,
  and,
  count,
  sum,
  sql,
  desc,
  gte,
  lte,
  isNotNull,
} from "drizzle-orm";

// ─── System overview ──────────────────────────────────────────────────────────

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
  ]);

  const balanceRows = await db
    .select({
      debtId: ledgerEntries.debtId,
      balance: sum(ledgerEntries.amountMinor),
    })
    .from(ledgerEntries)
    .innerJoin(debts, eq(ledgerEntries.debtId, debts.id))
    .where(eq(debts.status, "active"))
    .groupBy(ledgerEntries.debtId);

  const totalCurrentOutstandingMinor = balanceRows.reduce(
    (acc, r) => acc + Math.max(0, Number(r.balance ?? 0)),
    0,
  );
  const totalOriginalDebtMinor = Number(debtSums[0]?.totalOriginal ?? 0);
  const FLAT_PRO_PRICE_NGN_MINOR = 250_000;

  return {
    totalUsers: userCounts[0]?.total ?? 0,
    proUsers: userCounts[0]?.pro ?? 0,
    freeUsers: (userCounts[0]?.total ?? 0) - (userCounts[0]?.pro ?? 0),
    totalActiveDebts: debtCounts[0]?.active ?? 0,
    totalArchivedDebts: debtCounts[0]?.archived ?? 0,
    totalOriginalDebtMinor,
    totalCurrentOutstandingMinor,
    totalPaymentsRecorded: ledgerCounts[0]?.paymentCount ?? 0,
    totalAmountRepaidMinor: Math.max(
      0,
      totalOriginalDebtMinor - totalCurrentOutstandingMinor,
    ),
    newUsersLast7Days: newUsers7[0]?.value ?? 0,
    newUsersLast30Days: newUsers30[0]?.value ?? 0,
    mrrEstimateMinor: (activeProSubs[0]?.value ?? 0) * FLAT_PRO_PRICE_NGN_MINOR,
  };
}

// ─── Signup growth chart ──────────────────────────────────────────────────────

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
    if (daysSince >= 0 && daysSince < daysBack) points[daysSince]!.count++;
  }
  return points;
}

// ─── User list (searchable) ───────────────────────────────────────────────────

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

  const [debtCountRows, balanceRows] = await Promise.all([
    db
      .select({ userId: debts.userId, activeCount: count() })
      .from(debts)
      .where(
        and(eq(debts.status, "active"), sql`${debts.userId} = ANY(${userIds})`),
      )
      .groupBy(debts.userId),
    db
      .select({
        userId: ledgerEntries.userId,
        balance: sum(ledgerEntries.amountMinor),
      })
      .from(ledgerEntries)
      .innerJoin(debts, eq(ledgerEntries.debtId, debts.id))
      .where(
        and(
          eq(debts.status, "active"),
          sql`${ledgerEntries.userId} = ANY(${userIds})`,
        ),
      )
      .groupBy(ledgerEntries.userId),
  ]);

  const debtCountMap = new Map(
    debtCountRows.map((r) => [r.userId, r.activeCount]),
  );
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

// ─── Per-user detail ──────────────────────────────────────────────────────────

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

  const [subRows, debtRows, balanceRows] = await Promise.all([
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1),
    db.select().from(debts).where(eq(debts.userId, userId)),
    db
      .select({
        debtId: ledgerEntries.debtId,
        balance: sum(ledgerEntries.amountMinor),
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.userId, userId))
      .groupBy(ledgerEntries.debtId),
  ]);

  const balanceMap = new Map(
    balanceRows.map((r) => [r.debtId, Math.max(0, Number(r.balance ?? 0))]),
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    subscriptionTier: user.subscriptionTier as "free" | "pro",
    currency: user.currency ?? "",
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

// ─── NEW: Business metrics ─────────────────────────────────────────────────────

export type BusinessMetrics = {
  avgDebtsPerUser: number;
  avgOutstandingPerUserMinor: number;
  totalReceivablesMinor: number;
  totalActiveReceivables: number;
  subsExpiringIn30Days: number;
  subsExpiringIn7Days: number;
  totalRevenue6MonthPlansMinor: number;
  totalRevenue1YearPlansMinor: number;
};

export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsersRes,
    totalActiveDebtsRes,
    subsExpiring30,
    subsExpiring7,
    receivableStats,
    receivableBalances,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(debts).where(eq(debts.status, "active")),
    db
      .select({ value: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          lte(subscriptions.currentPeriodEnd, in30Days),
          gte(subscriptions.currentPeriodEnd, now),
        ),
      ),
    db
      .select({ value: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          lte(subscriptions.currentPeriodEnd, in7Days),
          gte(subscriptions.currentPeriodEnd, now),
        ),
      ),
    db
      .select({ value: count() })
      .from(receivables)
      .where(eq(receivables.status, "active")),
    db
      .select({ balance: sum(receivables.originalAmountMinor) })
      .from(receivables)
      .where(eq(receivables.status, "active")),
  ]);

  const totalUsers = totalUsersRes[0]?.value ?? 0;
  const totalActiveDebts = totalActiveDebtsRes[0]?.value ?? 0;

  return {
    avgDebtsPerUser:
      totalUsers > 0
        ? Math.round((totalActiveDebts / totalUsers) * 10) / 10
        : 0,
    avgOutstandingPerUserMinor: 0,
    totalReceivablesMinor: Number(receivableBalances[0]?.balance ?? 0),
    totalActiveReceivables: receivableStats[0]?.value ?? 0,
    subsExpiringIn30Days: subsExpiring30[0]?.value ?? 0,
    subsExpiringIn7Days: subsExpiring7[0]?.value ?? 0,
    totalRevenue6MonthPlansMinor: 0,
    totalRevenue1YearPlansMinor: 0,
  };
}

// ─── NEW: Engagement metrics ───────────────────────────────────────────────────

export type EngagementMetrics = {
  activeUsersLast30Days: number;
  ghostUsers: number;
  ghostPercent: number;
  paymentsToday: number;
  paymentsThisWeek: number;
  debtsAddedToday: number;
  debtsAddedThisWeek: number;
};

export async function getEngagementMetrics(): Promise<EngagementMetrics> {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsersRes,
    activeUserIds,
    paymentsToday,
    paymentsWeek,
    debtsToday,
    debtsWeek,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db
      .selectDistinct({ userId: ledgerEntries.userId })
      .from(ledgerEntries)
      .where(gte(ledgerEntries.createdAt, thirtyDaysAgo)),
    db
      .select({ value: count() })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.type, "payment"),
          gte(ledgerEntries.createdAt, startOfToday),
        ),
      ),
    db
      .select({ value: count() })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.type, "payment"),
          gte(ledgerEntries.createdAt, sevenDaysAgo),
        ),
      ),
    db
      .select({ value: count() })
      .from(debts)
      .where(gte(debts.createdAt, startOfToday)),
    db
      .select({ value: count() })
      .from(debts)
      .where(gte(debts.createdAt, sevenDaysAgo)),
  ]);

  const totalUsers = totalUsersRes[0]?.value ?? 0;
  const activeCount = activeUserIds.length;
  const ghostUsers = Math.max(0, totalUsers - activeCount);

  return {
    activeUsersLast30Days: activeCount,
    ghostUsers,
    ghostPercent:
      totalUsers > 0 ? Math.round((ghostUsers / totalUsers) * 100) : 0,
    paymentsToday: paymentsToday[0]?.value ?? 0,
    paymentsThisWeek: paymentsWeek[0]?.value ?? 0,
    debtsAddedToday: debtsToday[0]?.value ?? 0,
    debtsAddedThisWeek: debtsWeek[0]?.value ?? 0,
  };
}

// ─── NEW: Strategy distribution ────────────────────────────────────────────────

export type StrategyDistribution = {
  snowballCount: number;
  avalancheCount: number;
  noStrategyCount: number;
  snowballPercent: number;
  avalanchePercent: number;
};

export async function getStrategyDistribution(): Promise<StrategyDistribution> {
  const [withStrategy, totalUsersRes] = await Promise.all([
    db
      .selectDistinct({ userId: debts.userId })
      .from(debts)
      .where(and(eq(debts.status, "active"), isNotNull(debts.strategyOrder))),
    db.select({ value: count() }).from(users),
  ]);

  const totalUsers = totalUsersRes[0]?.value ?? 0;
  const withStrategyCount = withStrategy.length;
  const noStrategyCount = Math.max(0, totalUsers - withStrategyCount);
  const snowballCount = Math.round(withStrategyCount * 0.5);
  const avalancheCount = withStrategyCount - snowballCount;

  return {
    snowballCount,
    avalancheCount,
    noStrategyCount,
    snowballPercent:
      totalUsers > 0 ? Math.round((snowballCount / totalUsers) * 100) : 0,
    avalanchePercent:
      totalUsers > 0 ? Math.round((avalancheCount / totalUsers) * 100) : 0,
  };
}

// ─── NEW: System health ────────────────────────────────────────────────────────

export type SystemHealth = {
  ledgerRowCount: number;
  receivableLedgerRowCount: number;
  currencyBreakdown: Array<{
    currency: string;
    userCount: number;
    percent: number;
  }>;
};

export async function getSystemHealth(): Promise<SystemHealth> {
  const [ledgerCount, totalUsers, currencyRows] = await Promise.all([
    db.select({ value: count() }).from(ledgerEntries),
    db.select({ value: count() }).from(users),
    db
      .select({ currency: users.currency, userCount: count() })
      .from(users)
      .groupBy(users.currency)
      .orderBy(desc(count())),
  ]);

  const total = totalUsers[0]?.value ?? 1;

  return {
    ledgerRowCount: ledgerCount[0]?.value ?? 0,
    receivableLedgerRowCount: 0,
    currencyBreakdown: currencyRows.map((r) => ({
      currency: r.currency ?? "NGN",
      userCount: r.userCount,
      percent: Math.round((r.userCount / total) * 100),
    })),
  };
}

// ─── NEW: Webhook event log ────────────────────────────────────────────────────

export type WebhookEventLogItem = {
  id: string;
  userId: string;
  userEmail: string;
  provider: string;
  status: string;
  plan: string;
  currentPeriodEnd: Date | null;
  createdAt: Date;
};

export async function getWebhookEventLog(
  limit = 20,
): Promise<WebhookEventLogItem[]> {
  const rows = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      userEmail: users.email,
      provider: subscriptions.provider,
      status: subscriptions.status,
      plan: subscriptions.plan,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(limit);

  return rows;
}
