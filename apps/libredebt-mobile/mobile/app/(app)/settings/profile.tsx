import { ScrollView, View, Text, TouchableOpacity, Alert } from "react-native"
import { router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Toast from "react-native-toast-message"
import { Ionicons } from "@expo/vector-icons"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { SUPPORTED_CURRENCIES } from "@/lib/currency"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  currency: z.string(),
})
type FormValues = z.infer<typeof schema>

export default function ProfileSettingsScreen() {
  const user = useAuthStore((s) => s.user)
  const { clearAuth, refreshUser } = useAuthStore()

  const { control, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "", currency: user?.currency ?? "NGN" },
  })

  async function onSubmit(data: FormValues) {
    try {
      await api.put("/api/mobile/profile", data)
      await refreshUser()
      Toast.show({ type: "success", text1: "Profile updated" })
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to update", text2: err?.message })
    }
  }

  function handleDeleteAccount() {
    Alert.prompt(
      "Delete account",
      'Type "DELETE" to confirm. This cannot be undone.',
      async (text) => {
        if (text !== "DELETE") {
          Toast.show({ type: "error", text1: 'Type "DELETE" exactly to confirm' })
          return
        }
        try {
          await api.post("/api/mobile/profile/delete", {})
          await clearAuth()
          router.replace("/(auth)/sign-in")
        } catch (err: any) {
          Toast.show({ type: "error", text1: "Failed to delete account", text2: err?.message })
        }
      },
      "plain-text"
    )
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-navy">Profile</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
          <Input label="Full name" value={value} onChangeText={onChange} error={errors.name?.message} />
        )} />

        <View className="mb-4">
          <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">Email</Text>
          <View className="border border-border rounded-xl px-3.5 py-3 bg-surface">
            <Text className="text-sm text-subtle">{user?.email}</Text>
          </View>
          <Text className="text-[10px] text-subtle mt-1">Contact support to change your email</Text>
        </View>

        <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">Display currency</Text>
        <Controller control={control} name="currency" render={({ field: { onChange, value } }) => (
          <View className="flex-row flex-wrap gap-2 mb-6">
            {SUPPORTED_CURRENCIES.map((c) => (
              <TouchableOpacity key={c.code} onPress={() => onChange(c.code)}
                className={`px-3 py-2 rounded-lg border ${value === c.code ? "bg-navy border-navy" : "bg-white border-border"}`}>
                <Text className={`text-xs font-semibold ${value === c.code ? "text-white" : "text-navy"}`}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )} />

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} disabled={!isDirty} size="lg" className="mb-8">
          Save changes
        </Button>

        <View className="border border-red-200 rounded-2xl p-4 mb-8">
          <Text className="text-sm font-bold text-red-700 mb-1">Delete account</Text>
          <Text className="text-xs text-red-600/80 mb-4 leading-5">
            This permanently deletes your profile. Payment history is preserved for financial records but you will lose access.
          </Text>
          <Button onPress={handleDeleteAccount} variant="danger">Delete my account</Button>
        </View>
      </ScrollView>
    </View>
  )
}
