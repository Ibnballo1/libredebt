import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import * as ImagePicker from "expo-image-picker"
import * as DocumentPicker from "expo-document-picker"
import Toast from "react-native-toast-message"
import { Ionicons } from "@expo/vector-icons"
import { useDebt, useRecordPayment } from "@/hooks/useDebts"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { formatCurrency } from "@/lib/currency"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"

const schema = z.object({
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Enter a valid amount"),
  effectiveDate: z.string().min(1, "Date is required"),
  note: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function RecordPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const currency = user?.currency ?? "NGN"
  const { data: debt } = useDebt(id)
  const recordPayment = useRecordPayment()
  const [receiptUri, setReceiptUri] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const today = new Date().toISOString().split("T")[0]!

  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { effectiveDate: today, amount: "", note: "" },
  })

  const watchedAmount = watch("amount")

  async function uploadToR2(uri: string, mimeType: string, filename: string) {
    setUploading(true)
    try {
      const res = await api.post<{ presignedUrl: string; publicUrl: string }>(
        "/api/mobile/storage/receipt-url",
        { filename, contentType: mimeType }
      )
      const fileRes = await fetch(uri)
      const blob = await fileRes.blob()
      if (blob.size > 5 * 1024 * 1024) {
        Toast.show({ type: "error", text1: "File too large", text2: "Maximum size is 5MB" })
        return
      }
      const uploadRes = await fetch(res.presignedUrl, {
        method: "PUT", body: blob, headers: { "Content-Type": mimeType },
      })
      if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`)
      setReceiptUrl(res.publicUrl)
      Toast.show({ type: "success", text1: "Receipt uploaded" })
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Upload failed", text2: err?.message })
    } finally {
      setUploading(false)
    }
  }

  function showReceiptOptions() {
    Alert.alert("Attach receipt", "Choose how to attach your receipt", [
      { text: "Take photo", onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== "granted") { Toast.show({ type: "error", text1: "Camera permission denied" }); return }
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0]
          setReceiptUri(asset.uri)
          await uploadToR2(asset.uri, "image/jpeg", `receipt_${Date.now()}.jpg`)
        }
      }},
      { text: "Choose from gallery", onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== "granted") { Toast.show({ type: "error", text1: "Gallery permission denied" }); return }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0]
          const ext = asset.uri.split(".").pop() ?? "jpg"
          setReceiptUri(asset.uri)
          await uploadToR2(asset.uri, ext === "png" ? "image/png" : "image/jpeg", `receipt_${Date.now()}.${ext}`)
        }
      }},
      { text: "PDF document", onPress: async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true })
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0]
          setReceiptUri(asset.uri)
          await uploadToR2(asset.uri, "application/pdf", asset.name ?? `receipt_${Date.now()}.pdf`)
        }
      }},
      { text: "Cancel", style: "cancel" },
    ])
  }

  async function onSubmit(data: FormValues) {
    try {
      await recordPayment.mutateAsync({ debtId: id, ...data, receiptUrl: receiptUrl ?? undefined })
      Toast.show({ type: "success", text1: "Payment recorded" })
      router.back()
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to record", text2: err?.message })
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-navy">Record payment</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {debt && (
          <Card className="flex-row items-center justify-between mb-4">
            <Text className="text-xs font-bold uppercase tracking-widest text-subtle">Current balance</Text>
            <Text className="text-base font-bold text-navy tabular-nums">
              {formatCurrency(debt.currentBalanceMinor, { currency })}
            </Text>
          </Card>
        )}

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Controller control={control} name="amount" render={({ field: { onChange, value } }) => (
              <View>
                <Input label="Amount *" value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="0.00" error={errors.amount?.message} />
                {value && parseFloat(value) > 0 && !isNaN(parseFloat(value)) && (
                  <Text className="text-xs font-semibold text-emerald -mt-3 mb-3">
                    {formatCurrency(Math.round(parseFloat(value) * 100), { currency })}
                  </Text>
                )}
              </View>
            )} />
          </View>
          <View className="flex-1">
            <Controller control={control} name="effectiveDate" render={({ field: { onChange, value } }) => (
              <Input label="Date *" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" error={errors.effectiveDate?.message} />
            )} />
          </View>
        </View>

        <Controller control={control} name="note" render={({ field: { onChange, value } }) => (
          <Input label="Note (optional)" value={value} onChangeText={onChange} placeholder="e.g. Monthly bank transfer" />
        )} />

        <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">Receipt (optional)</Text>

        {receiptUri && receiptUrl ? (
          <View className="flex-row items-center gap-3 bg-emerald/5 border border-emerald/20 rounded-xl px-4 py-3 mb-4">
            {receiptUri.match(/\.(jpg|jpeg|png|webp)$/i) ? (
              <Image source={{ uri: receiptUri }} className="w-12 h-12 rounded-lg" resizeMode="cover" />
            ) : (
              <View className="w-12 h-12 bg-red-50 rounded-lg items-center justify-center">
                <Ionicons name="document-outline" size={20} color="#EF4444" />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-xs font-semibold text-navy">Receipt attached</Text>
              <Text className="text-[10px] text-subtle">Tap × to remove</Text>
            </View>
            <TouchableOpacity onPress={() => { setReceiptUri(null); setReceiptUrl(null) }}>
              <Ionicons name="close-circle-outline" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={showReceiptOptions}
            disabled={uploading}
            className="border-2 border-dashed border-border rounded-xl py-6 items-center mb-4"
          >
            <Ionicons name="receipt-outline" size={24} color={uploading ? "#10B981" : "#94A3B8"} />
            <Text className="text-xs font-semibold text-navy mt-2">
              {uploading ? "Uploading…" : "Attach receipt"}
            </Text>
            <Text className="text-[10px] text-subtle mt-0.5">JPG, PNG, WEBP or PDF · Max 5MB</Text>
          </TouchableOpacity>
        )}

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting || uploading} size="lg" className="mb-8">
          Record payment
        </Button>
      </ScrollView>
    </View>
  )
}
