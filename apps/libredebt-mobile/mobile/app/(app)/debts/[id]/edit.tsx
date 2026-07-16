import { ScrollView, View, Text, TouchableOpacity } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Toast from "react-native-toast-message"
import { Ionicons } from "@expo/vector-icons"
import { useDebt, useEditDebt } from "@/hooks/useDebts"
import { formatCurrency } from "@/lib/currency"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

const schema = z.object({
  name: z.string().min(2).max(100),
  creditor: z.string().min(1).max(100),
  interestRate: z.string().optional(),
  minimumPayment: z.string().optional(),
  dueDay: z.string().optional(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function EditDebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: debt } = useDebt(id)
  const editDebt = useEditDebt(id)

  const { control, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: debt?.name ?? "",
      creditor: debt?.creditor ?? "",
      interestRate: debt?.interestRateBps ? String(debt.interestRateBps / 100) : "",
      minimumPayment: debt?.minimumPaymentMinor ? String(debt.minimumPaymentMinor / 100) : "",
      dueDay: debt?.dueDay ? String(debt.dueDay) : "",
      notes: debt?.notes ?? "",
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      await editDebt.mutateAsync(data)
      Toast.show({ type: "success", text1: "Debt updated" })
      router.back()
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to update", text2: err?.message })
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-navy">Edit debt</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {debt && (
          <View className="mb-4">
            <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">Original amount</Text>
            <View className="flex-row items-center border border-border rounded-xl px-3.5 py-3 bg-surface gap-2">
              <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
              <Text className="text-sm text-subtle">{formatCurrency(debt.originalAmountMinor, { currency: debt.currency })}</Text>
            </View>
            <Text className="text-[10px] text-subtle mt-1">Original amount cannot be changed</Text>
          </View>
        )}

        <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
          <Input label="Debt label *" value={value} onChangeText={onChange} error={errors.name?.message} />
        )} />
        <Controller control={control} name="creditor" render={({ field: { onChange, value } }) => (
          <Input label="Creditor *" value={value} onChangeText={onChange} error={errors.creditor?.message} />
        )} />
        <Controller control={control} name="interestRate" render={({ field: { onChange, value } }) => (
          <Input label="Interest rate %" value={value} onChangeText={onChange} keyboardType="decimal-pad" />
        )} />
        <Controller control={control} name="minimumPayment" render={({ field: { onChange, value } }) => (
          <Input label="Minimum payment" value={value} onChangeText={onChange} keyboardType="decimal-pad" />
        )} />
        <Controller control={control} name="dueDay" render={({ field: { onChange, value } }) => (
          <Input label="Due day of month" value={value} onChangeText={onChange} keyboardType="number-pad" />
        )} />
        <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
          <Input label="Notes" value={value} onChangeText={onChange} multiline numberOfLines={3} />
        )} />

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} disabled={!isDirty} size="lg" className="mt-2 mb-8">
          Save changes
        </Button>
      </ScrollView>
    </View>
  )
}
