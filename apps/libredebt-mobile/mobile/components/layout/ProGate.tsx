import { View, Text } from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Button } from "@/components/ui/Button"

export function ProGate({ feature }: { feature: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-16 h-16 bg-emerald/10 rounded-full items-center justify-center mb-4">
        <Ionicons name="lock-closed-outline" size={28} color="#10B981" />
      </View>
      <Text className="text-lg font-bold text-navy text-center mb-2">Pro feature</Text>
      <Text className="text-sm text-muted text-center mb-6 leading-5">
        {feature} is available on LibreDebt Pro. Upgrade to unlock.
      </Text>
      <Button onPress={() => router.push("/(app)/settings/billing")}>
        Upgrade to Pro
      </Button>
    </View>
  )
}
