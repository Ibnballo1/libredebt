import { View, Text } from "react-native"
import { cn } from "@/lib/utils"

type BadgeProps = {
  label: string
  variant?: "emerald" | "amber" | "sky" | "red" | "slate"
}

const variants = {
  emerald: "bg-emerald/10",
  amber: "bg-amber-100",
  sky: "bg-sky/10",
  red: "bg-red-100",
  slate: "bg-slate-100",
}
const textVariants = {
  emerald: "text-emerald-dark",
  amber: "text-amber-700",
  sky: "text-sky",
  red: "text-red-600",
  slate: "text-slate-500",
}

export function Badge({ label, variant = "slate" }: BadgeProps) {
  return (
    <View className={cn("rounded-full px-2 py-0.5", variants[variant])}>
      <Text className={cn("text-[9px] font-bold uppercase tracking-widest", textVariants[variant])}>
        {label}
      </Text>
    </View>
  )
}
