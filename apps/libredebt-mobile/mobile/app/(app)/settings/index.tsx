import { ScrollView, View, Text, TouchableOpacity, Alert } from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useAuthStore } from "@/store/authStore"
import { useSubscription } from "@/hooks/useSubscription"
import { api } from "@/lib/api"
import Toast from "react-native-toast-message"

function SettingRow({ icon, label, value, onPress, danger }: {
  icon: string; label: string; value?: string; onPress: () => void; danger?: boolean
}) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center px-4 py-4 border-b border-border bg-white">
      <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${danger ? "bg-red-50" : "bg-surface"}`}>
        <Ionicons name={icon as any} size={18} color={danger ? "#EF4444" : "#64748B"} />
      </View>
      <Text className={`flex-1 text-sm font-medium ${danger ? "text-red-500" : "text-navy"}`}>{label}</Text>
      {value && <Text className="text-xs text-muted mr-2">{value}</Text>}
      {!danger && <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user)
  const { clearAuth } = useAuthStore()
  const { data: sub } = useSubscription()

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: async () => {
        try { await api.post("/api/auth/sign-out", {}) } catch {}
        await clearAuth()
        router.replace("/(auth)/sign-in")
      }},
    ])
  }

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="px-4 pt-14 pb-4">
        <Text className="text-2xl font-bold text-navy mb-6">Settings</Text>

        {/* Profile section */}
        <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle px-4 mb-2">Account</Text>
        <View className="rounded-2xl overflow-hidden border border-border mb-4">
          <View className="flex-row items-center px-4 py-4 bg-white border-b border-border">
            <View className="w-10 h-10 bg-navy rounded-full items-center justify-center mr-3">
              <Text className="text-base font-bold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-navy">{user?.name}</Text>
              <Text className="text-xs text-muted">{user?.email}</Text>
            </View>
          </View>
          <SettingRow icon="person-outline" label="Edit profile" onPress={() => router.push("/(app)/settings/profile" as any)} />
          <SettingRow icon="notifications-outline" label="Notifications" onPress={() => router.push("/(app)/settings/notifications" as any)} />
        </View>

        {/* Subscription */}
        <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle px-4 mb-2">Subscription</Text>
        <View className="rounded-2xl overflow-hidden border border-border mb-4">
          <SettingRow
            icon="diamond-outline"
            label="Billing & Plan"
            value={sub?.isPro ? "Pro" : sub?.isInTrial ? `Trial (${sub.trialDaysLeft}d left)` : "Free"}
            onPress={() => router.push("/(app)/settings/billing" as any)}
          />
        </View>

        {/* App info */}
        <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle px-4 mb-2">App</Text>
        <View className="rounded-2xl overflow-hidden border border-border mb-4">
          <SettingRow icon="information-circle-outline" label="Version" value="1.0.0" onPress={() => {}} />
          <SettingRow icon="shield-outline" label="Privacy Policy" onPress={() => {}} />
        </View>

        {/* Sign out */}
        <View className="rounded-2xl overflow-hidden border border-red-100 mb-8">
          <SettingRow icon="log-out-outline" label="Sign out" onPress={handleSignOut} danger />
        </View>
      </View>
    </ScrollView>
  )
}
