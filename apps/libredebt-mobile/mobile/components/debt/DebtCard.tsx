import { TouchableOpacity, View, Text } from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { Badge } from "@/components/ui/Badge"
import { formatCurrency } from "@/lib/currency"
import { calculateProgressPercent } from "@/lib/utils"
import type { Debt } from "@/hooks/useDebts"

type DebtCardProps = { debt: Debt; currency: string; onArchive?: (id: string) => void }

export function DebtCard({ debt, currency, onArchive }: DebtCardProps) {
  const progress = calculateProgressPercent(debt.originalAmountMinor, debt.currentBalanceMinor)
  const isOverdue = debt.dueDay && new Date().getDate() > debt.dueDay && debt.currentBalanceMinor > 0

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/debts/${debt.id}` as any)}
      activeOpacity={0.7}
    >
      <Card className="mb-3" style={{ borderLeftWidth: 3, borderLeftColor: "#10B981" }}>
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-bold text-navy mb-0.5">{debt.name}</Text>
            <Text className="text-xs text-muted">{debt.creditor}</Text>
            {isOverdue && (
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="warning-outline" size={10} color="#EF4444" />
                <Text className="text-[10px] font-semibold text-red-500">Overdue</Text>
              </View>
            )}
          </View>
          <View className="items-end">
            <Text className="text-base font-bold text-navy tabular-nums">
              {formatCurrency(debt.currentBalanceMinor, { currency })}
            </Text>
            <Text className="text-[10px] text-subtle tabular-nums">
              of {formatCurrency(debt.originalAmountMinor, { currency, compact: true })}
            </Text>
          </View>
        </View>

        <ProgressBar percent={progress} showLabel />

        <View className="flex-row items-center justify-between mt-3">
          {debt.dueDay ? (
            <Text className="text-[10px] text-muted">Due day {debt.dueDay} of month</Text>
          ) : (
            <Text className="text-[10px] text-subtle">No due date</Text>
          )}
          <Badge label={`${progress}%`} variant={progress >= 75 ? "emerald" : progress >= 25 ? "amber" : "red"} />
        </View>
      </Card>
    </TouchableOpacity>
  )
}
