import { View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated"
import { useEffect } from "react"

export function Skeleton({ width, height, rounded = "rounded-lg", className = "" }: {
  width?: number | string; height?: number; rounded?: string; className?: string
}) {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.3, { duration: 800 }), -1, true)
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return (
    <Animated.View
      style={[style, { width: width as number, height: height ?? 16 }]}
      className={`bg-slate-200 ${rounded} ${className}`}
    />
  )
}

export function DebtCardSkeleton() {
  return (
    <View className="bg-white rounded-2xl border border-border p-4 mb-3">
      <Skeleton width="60%" height={14} className="mb-2" />
      <Skeleton width="40%" height={10} className="mb-3" />
      <Skeleton width="100%" height={24} className="mb-2" />
      <Skeleton width="100%" height={6} rounded="rounded-full" />
    </View>
  )
}
