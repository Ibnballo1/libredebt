import { ScrollView, View, Text, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Toast from "react-native-toast-message"
import { Ionicons } from "@expo/vector-icons"
import { useCreateReceivable } from "@/hooks/useReceivables"
import { useAuthStore } from "@/store/authStore"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { SUPPORTED_CURRENCIES } from "@/lib/currency"

const schema = z.object({
  name: z.string().min(2, "Label must be at least 2 characters"),
  debtorName: z.string().min(1, "Their name is required"),
  debtorPhone: z.string().optional(),
  debtorRelationship: z.string().optional(),
  originalAmount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Enter a valid amount"),
  currency: z.string().default("NGN"),
  expectedByDate: z.string().optional(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function NewReceivableScreen() {
  const user = useAuthStore((s) => s.user)
  const createReceivable = useCreateReceivable()

  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: user?.currency ?? "NGN" },
  })

  const watchedCurrency = watch("currency")

  async function onSubmit(data: FormValues) {
    try {
      await createReceivable.mutateAsync(data as any)
      Toast.show({ type: "success", text1: "Receivable added" })
      router.back()
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to add", text2: err?.message })
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-navy">Add receivable</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
          <Input label="Label *" value={value} onChangeText={onChange} placeholder="e.g. Loan to Chidi for rent" error={errors.name?.message} />
        )} />
        <Controller control={control} name="debtorName" render={({ field: { onChange, value } }) => (
          <Input label="Their name *" value={value} onChangeText={onChange} placeholder="e.g. Chidi Eze" error={errors.debtorName?.message} />
        )} />
        <Controller control={control} name="debtorPhone" render={({ field: { onChange, value } }) => (
          <Input label="Their phone (optional)" value={value} onChangeText={onChange} keyboardType="phone-pad" placeholder="e.g. 0803 123 4567" />
        )} />
        <Controller control={control} name="debtorRelationship" render={({ field: { onChange, value } }) => (
          <Input label="Relationship (optional)" value={value} onChangeText={onChange} placeholder="e.g. Brother, Friend, Coworker" />
        )} />
        <Controller control={control} name="originalAmount" render={({ field: { onChange, value } }) => (
          <Input label="Amount *" value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="0.00" error={errors.originalAmount?.message} />
        )} />

        <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">Currency</Text>
        <Controller control={control} name="currency" render={({ field: { onChange, value } }) => (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {SUPPORTED_CURRENCIES.slice(0, 6).map((c) => (
              <TouchableOpacity key={c.code} onPress={() => onChange(c.code)}
                className={`px-3 py-2 rounded-lg border ${value === c.code ? "bg-navy border-navy" : "bg-white border-border"}`}>
                <Text className={`text-xs font-semibold ${value === c.code ? "text-white" : "text-navy"}`}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )} />

        <Controller control={control} name="expectedByDate" render={({ field: { onChange, value } }) => (
          <Input label="Expected by (optional)" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" hint="Leave blank if no fixed date" />
        )} />
        <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
          <Input label="Notes (optional)" value={value} onChangeText={onChange} placeholder="Any additional details..." multiline numberOfLines={3} />
        )} />
        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" className="mt-2 mb-8">Add receivable</Button>
      </ScrollView>
    </View>
  )
}
