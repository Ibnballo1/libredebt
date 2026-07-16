import { View, Text } from "react-native"

type ProgressBarProps = {
  percent: number
  showLabel?: boolean
  height?: number
}

function colorForPercent(p: number) {
  if (p >= 75) return "bg-emerald"
  if (p >= 25) return "bg-amber-400"
  return "bg-red-400"
}

export function ProgressBar({ percent, showLabel = false, height = 6 }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <View>
      {showLabel && (
        <Text className="text-[10px] font-bold text-muted mb-1">{clamped}% repaid</Text>
      )}
      <View className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height }}>
        <View
          className={`h-full rounded-full ${colorForPercent(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </View>
    </View>
  )
}
