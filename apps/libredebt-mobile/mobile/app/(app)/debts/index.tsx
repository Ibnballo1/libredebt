/**
 * app/(app)/debts/index.tsx — Debts List Screen
 */

import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useDebts, useArchiveDebt } from "@/hooks/useDebts"
import { useAuthStore } from "@/store/authStore"
import { useSubscription } from "@/hooks/useSubscription"
import { formatCurrency } from "@/lib/currency"
import { DebtCard } from "@/components/debt/DebtCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { DebtCardSkeleton } from "@/components/ui/Skeleton"
import Toast from "react-native-toast-message"

export default function DebtsScreen() {
  const user = useAuthStore((s) => s.user)
  const currency = user?.currency ?? "NGN"
  const { data: debts, isLoading, refetch, isRefetching } = useDebts()
  const { data: sub } = useSubscription()
  const archiveMutation = useArchiveDebt()

  const FREE_LIMIT = 3
  const atLimit = !sub?.isPro && !sub?.isInTrial && (debts?.length ?? 0) >= FREE_LIMIT

  function handleArchive(id: string) {
    Alert.alert(
      "Archive debt?",
      "This debt will be removed from your active list. All payment history is preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await archiveMutation.mutateAsync(id)
              Toast.show({ type: "success", text1: "Debt archived" })
            } catch {
              Toast.show({ type: "error", text1: "Failed to archive" })
            }
          },
        },
      ]
    )
  }

  const totalOutstanding = debts?.reduce((s, d) => s + d.currentBalanceMinor, 0) ?? 0

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-4 pt-14 pb-4 bg-white border-b border-border">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-navy">Debts</Text>
            {!!debts?.length && (
              <Text className="text-xs text-muted">
                {debts.length} active · {formatCurrency(totalOutstanding, { currency, compact: true })} outstanding
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => atLimit
              ? Toast.show({ type: "info", text1: "Upgrade to add more debts", text2: "Free plan limit: 3 debts" })
              : router.push("/(app)/debts/new")
            }
            className="bg-navy rounded-xl px-4 py-2 flex-row items-center gap-2"
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-xs font-bold text-white">Add debt</Text>
          </TouchableOpacity>
        </View>

        {atLimit && (
          <View className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex-row items-center justify-between">
            <Text className="text-xs text-amber-800 font-semibold">3/3 debts used</Text>
            <TouchableOpacity onPress={() => router.push("/(app)/settings/billing")}>
              <Text className="text-xs font-bold text-emerald">Upgrade →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <DebtCardSkeleton key={i} />)
        ) : !debts?.length ? (
          <EmptyState
            icon="wallet-outline"
            title="No active debts"
            description="Add your debts to start tracking your path to financial freedom."
            actionLabel="Add your first debt"
            onAction={() => router.push("/(app)/debts/new")}
          />
        ) : (
          debts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              currency={currency}
              onArchive={handleArchive}
            />
          ))
        )}
        <View className="h-24" />
      </ScrollView>
    </View>
  )
}
