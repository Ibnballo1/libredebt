/**
 * app/(app)/debts/new.tsx — Add Debt Screen
 */

import { ScrollView, View, Text, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Toast from "react-native-toast-message"
import { Ionicons } from "@expo/vector-icons"
import { useCreateDebt } from "@/hooks/useDebts"
import { useAuthStore } from "@/store/authStore"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { SUPPORTED_CURRENCIES } from "@/lib/currency"
import { formatCurrency } from "@/lib/currency"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  creditor: z.string().min(1, "Creditor is required").max(100),
  originalAmount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Enter a valid amount"),
  currency: z.string().default("NGN"),
  interestRate: z.string().optional(),
  minimumPayment: z.string().optional(),
  dueDay: z.string().optional(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function NewDebtScreen() {
  const user = useAuthStore((s) => s.user)
  const createDebt = useCreateDebt()

  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: user?.currency ?? "NGN" },
  })

  const watchedAmount = watch("originalAmount")
  const watchedCurrency = watch("currency")

  async function onSubmit(data: FormValues) {
    try {
      await createDebt.mutateAsync(data)
      Toast.show({ type: "success", text1: "Debt added", text2: "Opening balance recorded." })
      router.back()
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to add debt", text2: err?.message })
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-navy">Add debt</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
          <Input label="Debt label *" value={value} onChangeText={onChange}
            placeholder="e.g. GTBank personal loan" error={errors.name?.message} />
        )} />

        <Controller control={control} name="creditor" render={({ field: { onChange, value } }) => (
          <Input label="Creditor / lender *" value={value} onChangeText={onChange}
            placeholder="e.g. GTBank" error={errors.creditor?.message} />
        )} />

        <Controller control={control} name="originalAmount" render={({ field: { onChange, value } }) => (
          <View>
            <Input label="Original amount *" value={value} onChangeText={onChange}
              keyboardType="decimal-pad" placeholder="0.00" error={errors.originalAmount?.message} />
            {value && !isNaN(parseFloat(value)) && parseFloat(value) > 0 && (
              <Text className="text-xs font-semibold text-emerald -mt-3 mb-3">
                {formatCurrency(Math.round(parseFloat(value) * 100), { currency: watchedCurrency })}
              </Text>
            )}
          </View>
        )} />

        {/* Currency picker */}
        <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">Currency</Text>
        <Controller control={control} name="currency" render={({ field: { onChange, value } }) => (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {SUPPORTED_CURRENCIES.slice(0, 6).map((c) => (
              <TouchableOpacity
                key={c.code}
                onPress={() => onChange(c.code)}
                className={`px-3 py-2 rounded-lg border ${value === c.code ? "bg-navy border-navy" : "bg-white border-border"}`}
              >
                <Text className={`text-xs font-semibold ${value === c.code ? "text-white" : "text-navy"}`}>
                  {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )} />

        <Controller control={control} name="interestRate" render={({ field: { onChange, value } }) => (
          <Input label="Interest rate % (optional)" value={value} onChangeText={onChange}
            keyboardType="decimal-pad" placeholder="e.g. 18.5"
            hint="Annual interest rate as a percentage" />
        )} />

        <Controller control={control} name="minimumPayment" render={({ field: { onChange, value } }) => (
          <Input label="Minimum payment (optional)" value={value} onChangeText={onChange}
            keyboardType="decimal-pad" placeholder="Monthly minimum amount" />
        )} />

        <Controller control={control} name="dueDay" render={({ field: { onChange, value } }) => (
          <Input label="Due day of month (optional)" value={value} onChangeText={onChange}
            keyboardType="number-pad" placeholder="1–31" hint="Day of month payment is due" />
        )} />

        <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
          <Input label="Notes (optional)" value={value} onChangeText={onChange}
            placeholder="Any additional details..." multiline numberOfLines={3} />
        )} />

        <Button
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          size="lg"
          className="mt-2 mb-8"
        >
          Add debt
        </Button>
      </ScrollView>
    </View>
  )
}
