import { ScrollView, View, Text, RefreshControl } from "react-native"
import { useAuthStore } from "@/store/authStore"
import { useSubscription } from "@/hooks/useSubscription"
import { useDashboard } from "@/hooks/useDashboard"
import { ProGate } from "@/components/layout/ProGate"
import { Card } from "@/components/ui/Card"
import { formatCurrency } from "@/lib/currency"
import { Ionicons } from "@expo/vector-icons"

export default function AnalyticsScreen() {
  const user = useAuthStore((s) => s.user)
  const currency = user?.currency ?? "NGN"
  const { data: sub } = useSubscription()
  const { data, refetch, isRefetching } = useDashboard()

  const isPro = sub?.isPro || sub?.isInTrial

  if (!isPro) {
    return <ProGate feature="Advanced analytics and payoff projections" />
  }

  const totalOutstanding = data?.totalOutstandingMinor ?? 0
  const totalRepaid = data?.totalRepaidMinor ?? 0
  const totalOriginal = totalOutstanding + totalRepaid
  const overallProgress = totalOriginal > 0 ? Math.round((totalRepaid / totalOriginal) * 100) : 0

  return (
    <ScrollView
      className="flex-1 bg-surface"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
    >
      <View className="px-4 pt-14 pb-6">
        <Text className="text-2xl font-bold text-navy mb-1">Analytics</Text>
        <Text className="text-sm text-muted mb-6">Your debt repayment progress</Text>

        {/* Overall progress */}
        <Card className="mb-4">
          <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle mb-3">Overall progress</Text>
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-3xl font-bold text-navy">{overallProgress}%</Text>
              <Text className="text-xs text-muted">repaid overall</Text>
            </View>
            <View className="items-end">
              <Text className="text-lg font-bold text-emerald tabular-nums">
                {formatCurrency(totalRepaid, { currency, compact: true })}
              </Text>
              <Text className="text-xs text-muted">repaid</Text>
            </View>
          </View>
          <View className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <View className="h-full bg-emerald rounded-full" style={{ width: `${overallProgress}%` }} />
          </View>
          <Text className="text-xs text-muted mt-2">
            {formatCurrency(totalOutstanding, { currency, compact: true })} remaining
          </Text>
        </Card>

        {/* Stats grid */}
        <View className="flex-row gap-3 mb-4">
          <Card className="flex-1">
            <Ionicons name="trending-down-outline" size={20} color="#10B981" />
            <Text className="text-xl font-bold text-navy mt-2 tabular-nums">
              {formatCurrency(totalRepaid, { currency, compact: true })}
            </Text>
            <Text className="text-[10px] text-muted mt-0.5">Total repaid</Text>
          </Card>
          <Card className="flex-1">
            <Ionicons name="wallet-outline" size={20} color="#0F172A" />
            <Text className="text-xl font-bold text-navy mt-2 tabular-nums">
              {formatCurrency(totalOutstanding, { currency, compact: true })}
            </Text>
            <Text className="text-[10px] text-muted mt-0.5">Outstanding</Text>
          </Card>
        </View>

        <View className="flex-row gap-3 mb-6">
          <Card className="flex-1">
            <Ionicons name="calendar-outline" size={20} color="#38BDF8" />
            <Text className="text-xl font-bold text-navy mt-2 tabular-nums">
              {formatCurrency(data?.paymentsThisMonthMinor ?? 0, { currency, compact: true })}
            </Text>
            <Text className="text-[10px] text-muted mt-0.5">This month</Text>
          </Card>
          <Card className="flex-1">
            <Ionicons name="layers-outline" size={20} color="#F59E0B" />
            <Text className="text-xl font-bold text-navy mt-2">
              {data?.totalActiveDebts ?? 0}
            </Text>
            <Text className="text-[10px] text-muted mt-0.5">Active debts</Text>
          </Card>
        </View>

        {/* Per-debt breakdown */}
        {!!data?.debtBreakdown?.length && (
          <>
            <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle mb-3">
              Per-debt breakdown
            </Text>
            <Card className="p-0 overflow-hidden">
              {data.debtBreakdown.map((debt, i) => {
                const pct = debt.originalAmountMinor > 0
                  ? Math.round(((debt.originalAmountMinor - debt.currentBalanceMinor) / debt.originalAmountMinor) * 100)
                  : 0
                return (
                  <View key={debt.id} className={`px-4 py-3 ${i < data.debtBreakdown.length - 1 ? "border-b border-border" : ""}`}>
                    <View className="flex-row justify-between mb-2">
                      <View className="flex-1 mr-4">
                        <Text className="text-xs font-semibold text-navy">{debt.name}</Text>
                        <Text className="text-[10px] text-muted">{debt.creditor}</Text>
                      </View>
                      <Text className="text-xs font-bold text-emerald">{pct}%</Text>
                    </View>
                    <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <View
                        className={`h-full rounded-full ${pct >= 75 ? "bg-emerald" : pct >= 25 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </View>
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-[10px] text-subtle tabular-nums">
                        {formatCurrency(debt.currentBalanceMinor, { currency })} left
                      </Text>
                      <Text className="text-[10px] text-subtle tabular-nums">
                        of {formatCurrency(debt.originalAmountMinor, { currency, compact: true })}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  )
}
