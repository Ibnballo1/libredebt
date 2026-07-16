/**
 * app/(app)/index.tsx — Overview / Dashboard Screen
 */

import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useDashboard } from "@/hooks/useDashboard"
import { useAuthStore } from "@/store/authStore"
import { formatCurrency } from "@/lib/currency"
import { formatDate, getGreeting } from "@/lib/utils"
import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { Skeleton, DebtCardSkeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="flex-1 mx-1">
      <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle mb-1.5">{label}</Text>
      <Text className={`text-lg font-bold ${accent ? "text-emerald" : "text-navy"} tabular-nums`}>
        {value}
      </Text>
    </Card>
  )
}

export default function OverviewScreen() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, refetch, isRefetching } = useDashboard()
  const firstName = user?.name?.split(" ")[0] ?? "there"
  const currency = user?.currency ?? "NGN"

  return (
    <ScrollView
      className="flex-1 bg-surface"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
    >
      <View className="px-4 pt-14 pb-6">
        {/* Greeting */}
        <Text className="text-2xl font-bold text-navy mb-1">
          {getGreeting()}, {firstName} 👋
        </Text>
        <Text className="text-sm text-muted mb-6">
          {new Date().toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" })}
        </Text>

        {/* Stat cards */}
        {isLoading ? (
          <View className="flex-row mb-3">
            <Skeleton height={80} className="flex-1 mx-1 rounded-2xl" />
            <Skeleton height={80} className="flex-1 mx-1 rounded-2xl" />
          </View>
        ) : (
          <>
            <View className="flex-row mb-3">
              <StatCard
                label="Total outstanding"
                value={formatCurrency(data?.totalOutstandingMinor ?? 0, { currency, compact: true })}
              />
              <StatCard
                label="Active debts"
                value={String(data?.totalActiveDebts ?? 0)}
              />
            </View>
            <View className="flex-row mb-6">
              <StatCard
                label="Total repaid"
                value={formatCurrency(data?.totalRepaidMinor ?? 0, { currency, compact: true })}
                accent
              />
              <StatCard
                label="This month"
                value={formatCurrency(data?.paymentsThisMonthMinor ?? 0, { currency, compact: true })}
              />
            </View>
          </>
        )}

        {/* Debts at a glance */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[10px] font-bold tracking-widest uppercase text-subtle">
            Debts at a glance
          </Text>
          <TouchableOpacity onPress={() => router.push("/(app)/debts")}>
            <Text className="text-xs font-semibold text-emerald">See all</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <DebtCardSkeleton />
        ) : !data?.debtBreakdown?.length ? (
          <Card>
            <EmptyState
              icon="wallet-outline"
              title="No debts yet"
              description="Add your first debt to start tracking your journey to financial freedom."
              actionLabel="Add debt"
              onAction={() => router.push("/(app)/debts/new")}
            />
          </Card>
        ) : (
          data.debtBreakdown.slice(0, 3).map((debt) => {
            const pct = debt.originalAmountMinor > 0
              ? Math.round(((debt.originalAmountMinor - debt.currentBalanceMinor) / debt.originalAmountMinor) * 100)
              : 0
            return (
              <TouchableOpacity
                key={debt.id}
                onPress={() => router.push(`/(app)/debts/${debt.id}`)}
              >
                <Card className="mb-3">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-navy">{debt.name}</Text>
                      <Text className="text-xs text-muted">{debt.creditor}</Text>
                    </View>
                    <Text className="text-sm font-bold text-navy tabular-nums">
                      {formatCurrency(debt.currentBalanceMinor, { currency })}
                    </Text>
                  </View>
                  <ProgressBar percent={pct} />
                </Card>
              </TouchableOpacity>
            )
          })
        )}

        {/* Recent activity */}
        {!!data?.recentActivity?.length && (
          <>
            <Text className="text-[10px] font-bold tracking-widest uppercase text-subtle mb-3 mt-2">
              Recent activity
            </Text>
            <Card className="p-0 overflow-hidden">
              {data.recentActivity.map((entry, i) => (
                <View
                  key={entry.id}
                  className={`flex-row items-center px-4 py-3 ${
                    i < data.recentActivity.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <View className="w-8 h-8 bg-emerald/10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="arrow-down-outline" size={14} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-navy">{entry.debtName}</Text>
                    <Text className="text-[10px] text-subtle">{formatDate(entry.effectiveDate)}</Text>
                  </View>
                  <Text className="text-xs font-bold text-emerald tabular-nums">
                    -{formatCurrency(Math.abs(entry.amountMinor), { currency })}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  )
}
