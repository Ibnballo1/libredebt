import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useReceivables, useArchiveReceivable } from "@/hooks/useReceivables"
import { useAuthStore } from "@/store/authStore"
import { formatCurrency } from "@/lib/currency"
import { formatDate, calculateProgressPercent } from "@/lib/utils"
import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { EmptyState } from "@/components/ui/EmptyState"
import { DebtCardSkeleton } from "@/components/ui/Skeleton"
import Toast from "react-native-toast-message"

export default function ReceivablesScreen() {
  const user = useAuthStore((s) => s.user)
  const currency = user?.currency ?? "NGN"
  const { data: receivables, isLoading, refetch, isRefetching } = useReceivables()
  const archiveMutation = useArchiveReceivable()

  const totalOwed = receivables?.reduce((s, r) => s + r.currentBalanceMinor, 0) ?? 0

  function handleArchive(id: string, name: string) {
    Alert.alert("Archive receivable?", `"${name}" will be removed from your active list.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: async () => {
        try {
          await archiveMutation.mutateAsync(id)
          Toast.show({ type: "success", text1: "Receivable archived" })
        } catch {
          Toast.show({ type: "error", text1: "Failed to archive" })
        }
      }},
    ])
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-14 pb-4 bg-white border-b border-border">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-navy">Receivables</Text>
            {!!receivables?.length && (
              <Text className="text-xs text-muted">
                {formatCurrency(totalOwed, { currency, compact: true })} owed to you
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(app)/receivables/new" as any)}
            className="bg-[#38BDF8] rounded-xl px-4 py-2 flex-row items-center gap-2"
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-xs font-bold text-white">Add</Text>
          </TouchableOpacity>
        </View>

        {!!receivables?.length && (
          <View className="mt-3 bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-xl px-4 py-3 flex-row items-center justify-between">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-[#0EA5E9]">Total owed to you</Text>
            <Text className="text-base font-bold text-navy tabular-nums">
              {formatCurrency(totalOwed, { currency })}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#38BDF8" />}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <DebtCardSkeleton key={i} />)
        ) : !receivables?.length ? (
          <EmptyState
            icon="hand-left-outline"
            title="No receivables yet"
            description="Track money people owe you. Record loans, watch repayments come in."
            actionLabel="Add your first receivable"
            onAction={() => router.push("/(app)/receivables/new" as any)}
          />
        ) : (
          receivables.map((r) => {
            const progress = calculateProgressPercent(r.originalAmountMinor, r.currentBalanceMinor)
            return (
              <TouchableOpacity key={r.id} onPress={() => router.push(`/(app)/receivables/${r.id}` as any)} activeOpacity={0.7}>
                <Card className="mb-3" style={{ borderLeftWidth: 3, borderLeftColor: "#38BDF8" }}>
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-bold text-navy mb-0.5">{r.name}</Text>
                      <Text className="text-xs text-muted">{r.debtorName}</Text>
                      {r.debtorPhone && (
                        <Text className="text-[10px] text-subtle">{r.debtorPhone}</Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-base font-bold text-navy tabular-nums">
                        {formatCurrency(r.currentBalanceMinor, { currency })}
                      </Text>
                      <Text className="text-[10px] text-subtle">
                        of {formatCurrency(r.originalAmountMinor, { currency, compact: true })}
                      </Text>
                    </View>
                  </View>
                  <ProgressBar percent={progress} showLabel />
                  <View className="flex-row items-center justify-between mt-3">
                    {r.expectedByDate ? (
                      <Text className="text-[10px] text-muted">Expected {formatDate(r.expectedByDate)}</Text>
                    ) : (
                      <Text className="text-[10px] text-subtle">No expected date</Text>
                    )}
                    <TouchableOpacity onPress={() => handleArchive(r.id, r.name)}>
                      <Ionicons name="archive-outline" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            )
          })
        )}
        <View className="h-24" />
      </ScrollView>
    </View>
  )
}
