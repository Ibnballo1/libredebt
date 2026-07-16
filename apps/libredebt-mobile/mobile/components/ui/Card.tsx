import { View, ViewProps } from "react-native"
import { cn } from "@/lib/utils"

type CardProps = ViewProps & { className?: string }

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={cn("bg-white rounded-2xl border border-border shadow-sm p-4", className)}
      {...props}
    >
      {children}
    </View>
  )
}
