import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Share, Linking, Alert } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Toast from "react-native-toast-message"
import { Ionicons } from "@expo/vector-icons"
import { useReceivable, useRecordRepayment } from "@/hooks/useReceivables"
import { useAuthStore } from "@/store/authStore"
import { formatCurrency } from "@/lib/currency"
import { formatDate, calculateProgressPercent } from "@/lib/utils"
import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

const repaySchema = z.object({
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Enter a valid amount"),
  effectiveDate: z.string().min(1),
  note: z.string().optional(),
})
type RepayFormValues = z.infer<typeof repaySchema>

export default function ReceivableDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const currency = user?.currency ?? "NGN"
  const { data: receivable, isLoading, refetch, isRefetching } = useReceivable(id)
  const recordRepayment = useRecordRepayment()
  const today = new Date().toISOString().split("T")[0]!

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RepayFormValues>({
    resolver: zodResolver(repaySchema),
    defaultValues: { effectiveDate: today, amount: "", note: "" },
  })

  async function onRepayment(data: RepayFormValues) {
    try {
      await recordRepayment.mutateAsync({ receivableId: id, ...data })
      Toast.show({ type: "success", text1: "Repayment recorded" })
      reset({ effectiveDate: today, amount: "", note: "" })
      refetch()
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to record", text2: err?.message })
    }
  }

  function sendReminder() {
    if (!receivable) return
    const amount = formatCurrency(receivable.currentBalanceMinor, { currency })
    const msg = `Hi ${receivable.debtorName}, just a friendly reminder about the ${amount} — whenever you get a chance to settle it would be appreciated. Thanks! — ${user?.name ?? "LibreDebt"}`

    Alert.alert("Send reminder", "How would you like to send this?", [
      { text: "Copy message", onPress: async () => {
        // expo-clipboard not in deps, use Share
        await Share.share({ message: msg })
      }},
      receivable.debtorPhone ? { text: "WhatsApp", onPress: () => {
        const phone = receivable.debtorPhone!.replace(/[^\d]/g, "")
        Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`)
      }} : null,
      { text: "Cancel", style: "cancel" },
    ].filter(Boolean) as any[])
  }

  if (!receivable) return null
  const progress = calculateProgressPercent(receivable.originalAmountMinor, receivable.currentBalanceMinor)

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-14 pb-4 bg-white border-b border-border flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-navy">{receivable.name}</Text>
          <Text className="text-xs text-muted">{receivable.debtorName}</Text>
        </View>
        <TouchableOpacity onPress={sendReminder}>
          <Ionicons name="chatbubble-outline" size={22} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#38BDF8" />}
      >
        <View className="px-4 pt-4 pb-8">
          {/* Summary */}
          <Card className="mb-4" style={{ borderLeftWidth: 3, borderLeftColor: "#38BDF8" }}>
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle mb-1">Owed to you</Text>
                <Text className="text-3xl font-bold text-navy tabular-nums">
                  {formatCurrency(receivable.currentBalanceMinor, { currency })}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle mb-1">Original</Text>
                <Text className="text-base font-semibold text-muted tabular-nums">
                  {formatCurrency(receivable.originalAmountMinor, { currency })}
                </Text>
              </View>
            </View>
            <ProgressBar percent={progress} showLabel />
            {receivable.debtorPhone && (
              <View className="mt-3 flex-row items-center gap-2">
                <Ionicons name="call-outline" size={14} color="#64748B" />
                <Text className="text-xs text-muted">{receivable.debtorPhone}</Text>
              </View>
            )}
            {receivable.expectedByDate && (
              <Text className="text-xs text-muted mt-2">
                Expected by <Text className="font-semibold text-navy">{formatDate(receivable.expectedByDate, "long")}</Text>
              </Text>
            )}
          </Card>

          {/* Reminder button */}
          <TouchableOpacity
            onPress={sendReminder}
            className="border border-[#38BDF8] rounded-2xl py-3.5 flex-row items-center justify-center gap-2 mb-6"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#38BDF8" />
            <Text className="text-sm font-bold text-[#38BDF8]">Send reminder</Text>
          </TouchableOpacity>

          {/* Record repayment */}
          {receivable.status === "active" && (
            <Card className="mb-6">
              <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle mb-4">Record repayment</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Controller control={control} name="amount" render={({ field: { onChange, value } }) => (
                    <Input label="Amount *" value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="0.00" error={errors.amount?.message} />
                  )} />
                </View>
                <View className="flex-1">
                  <Controller control={control} name="effectiveDate" render={({ field: { onChange, value } }) => (
                    <Input label="Date *" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" error={errors.effectiveDate?.message} />
                  )} />
                </View>
              </View>
              <Controller control={control} name="note" render={({ field: { onChange, value } }) => (
                <Input label="Note (optional)" value={value} onChangeText={onChange} placeholder="e.g. Paid via transfer" />
              )} />
              <Button
                onPress={handleSubmit(onRepayment)}
                loading={isSubmitting}
                className="bg-[#38BDF8]"
              >
                Record repayment
              </Button>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
