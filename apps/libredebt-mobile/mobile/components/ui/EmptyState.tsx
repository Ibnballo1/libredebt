import { View, Text } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Button } from "./Button"

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-16 h-16 bg-surface rounded-full items-center justify-center mb-4">
        <Ionicons name={icon} size={28} color="#94A3B8" />
      </View>
      <Text className="text-base font-bold text-navy text-center mb-2">{title}</Text>
      <Text className="text-sm text-muted text-center mb-6 leading-5">{description}</Text>
      {actionLabel && onAction && (
        <Button onPress={onAction}>{actionLabel}</Button>
      )}
    </View>
  )
}
