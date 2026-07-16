/**
 * app/(app)/debts/[id].tsx — Debt Detail Screen
 */

import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Image } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useDebt, useDebtLedger } from "@/hooks/useDebts"
import { useAuthStore } from "@/store/authStore"
import { formatCurrency } from "@/lib/currency"
import { formatDate, calculateProgressPercent } from "@/lib/utils"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { Skeleton } from "@/components/ui/Skeleton"

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  payment:    { bg: "bg-emerald/10",  text: "text-emerald-dark", label: "Payment" },
  opening:    { bg: "bg-slate-100",   text: "text-slate-500",    label: "Opening" },
  interest:   { bg: "bg-amber-50",    text: "text-amber-600",    label: "Interest" },
  fee:        { bg: "bg-red-50",      text: "text-red-500",      label: "Fee" },
  adjustment: { bg: "bg-amber-50",    text: "text-amber-600",    label: "Adjustment" },
  reversal:   { bg: "bg-purple-50",   text: "text-purple-600",   label: "Reversal" },
}

export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const currency = user?.currency ?? "NGN"

  const { data: debt, isLoading: debtLoading, refetch, isRefetching } = useDebt(id)
  const { data: entries, isLoading: ledgerLoading } = useDebtLedger(id)

  if (debtLoading) {
    return (
      <View className="flex-1 bg-surface px-4 pt-14">
        <Skeleton height={28} width="70%" className="mb-2" />
        <Skeleton height={14} width="40%" className="mb-6" />
        <Skeleton height={160} className="rounded-2xl mb-4" />
        <Skeleton height={14} width="50%" className="mb-3" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={56} className="rounded-xl mb-2" />
        ))}
      </View>
    )
  }

  if (!debt) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Text className="text-base text-muted">Debt not found</Text>
      </View>
    )
  }

  const progress = calculateProgressPercent(debt.originalAmountMinor, debt.currentBalanceMinor)
  const repaidMinor = debt.originalAmountMinor - debt.currentBalanceMinor

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-4 pt-14 pb-4 bg-white border-b border-border">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold text-navy">{debt.name}</Text>
            <Text className="text-xs text-muted">{debt.creditor}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push(`/(app)/debts/${id}/edit` as any)}>
            <Ionicons name="pencil-outline" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
      >
        <View className="px-4 pt-4 pb-8">
          {/* Summary card */}
          <Card className="mb-4" style={{ borderLeftWidth: 3, borderLeftColor: "#10B981" }}>
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle mb-1">
                  Current balance
                </Text>
                <Text className="text-3xl font-bold text-navy tabular-nums">
                  {formatCurrency(debt.currentBalanceMinor, { currency })}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle mb-1">
                  Original
                </Text>
                <Text className="text-base font-semibold text-muted tabular-nums">
                  {formatCurrency(debt.originalAmountMinor, { currency })}
                </Text>
              </View>
            </View>

            <ProgressBar percent={progress} showLabel />

            <View className="flex-row justify-between mt-4 pt-4 border-t border-border">
              <View className="items-center">
                <Text className="text-[9px] font-bold uppercase tracking-widest text-subtle mb-0.5">Repaid</Text>
                <Text className="text-sm font-bold text-emerald tabular-nums">
                  {formatCurrency(Math.max(0, repaidMinor), { currency })}
                </Text>
              </View>
              {debt.interestRateBps > 0 && (
                <View className="items-center">
                  <Text className="text-[9px] font-bold uppercase tracking-widest text-subtle mb-0.5">Interest</Text>
                  <Text className="text-sm font-bold text-navy">{(debt.interestRateBps / 100).toFixed(1)}%</Text>
                </View>
              )}
              {debt.minimumPaymentMinor > 0 && (
                <View className="items-center">
                  <Text className="text-[9px] font-bold uppercase tracking-widest text-subtle mb-0.5">Min. payment</Text>
                  <Text className="text-sm font-bold text-navy tabular-nums">
                    {formatCurrency(debt.minimumPaymentMinor, { currency })}
                  </Text>
                </View>
              )}
              {debt.dueDay && (
                <View className="items-center">
                  <Text className="text-[9px] font-bold uppercase tracking-widest text-subtle mb-0.5">Due day</Text>
                  <Text className="text-sm font-bold text-navy">{debt.dueDay}</Text>
                </View>
              )}
            </View>

            {debt.notes && (
              <View className="mt-4 pt-4 border-t border-border">
                <Text className="text-xs text-muted leading-5">{debt.notes}</Text>
              </View>
            )}
          </Card>

          {/* Record payment button */}
          <TouchableOpacity
            onPress={() => router.push(`/(app)/debts/${id}/payment` as any)}
            className="bg-emerald rounded-2xl py-4 flex-row items-center justify-center gap-2 mb-6"
          >
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text className="text-sm font-bold text-white">Record payment</Text>
          </TouchableOpacity>

          {/* Ledger history */}
          <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle mb-3">
            Payment history ({entries?.length ?? 0} entries)
          </Text>

          {ledgerLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={56} className="rounded-xl mb-2" />
            ))
          ) : !entries?.length ? (
            <Card>
              <Text className="text-sm text-center text-muted py-4">No payments recorded yet</Text>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              {entries.map((entry, i) => {
                const config = TYPE_COLORS[entry.type] ?? TYPE_COLORS.adjustment!
                const isNeg = entry.amountMinor < 0
                const abs = Math.abs(entry.amountMinor)

                return (
                  <View
                    key={entry.id}
                    className={`px-4 py-3 ${i < entries.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <View className="flex-row items-center">
                      <View className={`rounded px-1.5 py-0.5 ${config.bg} mr-3`}>
                        <Text className={`text-[9px] font-bold uppercase tracking-widest ${config.text}`}>
                          {config.label}
                        </Text>
                      </View>
                      <View className="flex-1">
                        {entry.note && (
                          <Text className="text-xs text-navy mb-0.5">{entry.note}</Text>
                        )}
                        <Text className="text-[10px] text-subtle">{formatDate(entry.effectiveDate)}</Text>
                      </View>
                      <Text className={`text-sm font-bold tabular-nums ${isNeg ? "text-emerald" : "text-navy"}`}>
                        {isNeg ? "−" : "+"}{formatCurrency(abs, { currency })}
                      </Text>
                    </View>

                    {/* Receipt thumbnail */}
                    {entry.receiptUrl && (
                      <View className="mt-2 ml-12">
                        <View className="flex-row items-center gap-2">
                          <Ionicons name="receipt-outline" size={12} color="#38BDF8" />
                          <Text className="text-[10px] font-semibold text-sky-500">Receipt attached</Text>
                        </View>
                        {entry.receiptUrl.match(/\.(jpg|jpeg|png|webp|heic)$/i) ? (
                          <Image
                            source={{ uri: entry.receiptUrl }}
                            className="w-24 h-16 rounded-lg mt-1 border border-border"
                            resizeMode="cover"
                          />
                        ) : null}
                      </View>
                    )}
                  </View>
                )
              })}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
