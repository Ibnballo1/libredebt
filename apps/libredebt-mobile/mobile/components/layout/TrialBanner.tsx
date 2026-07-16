import { View, Text, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const msg = daysLeft === 0 ? "Trial ends today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in trial`
  return (
    <View className="bg-amber-400 px-4 py-2 flex-row items-center justify-between">
      <View className="flex-row items-center gap-2 flex-1">
        <Ionicons name="time-outline" size={14} color="#78350F" />
        <Text className="text-xs font-semibold text-amber-900">{msg} · Full Pro access active</Text>
      </View>
      <TouchableOpacity onPress={() => router.push("/(app)/settings/billing")}>
        <Text className="text-[10px] font-bold text-amber-900 bg-amber-900/10 rounded-full px-2 py-0.5">
          Upgrade →
        </Text>
      </TouchableOpacity>
    </View>
  )
}
