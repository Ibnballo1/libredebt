import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native"
import { cn } from "@/lib/utils"

type ButtonProps = {
  onPress?: () => void
  children: React.ReactNode
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  disabled?: boolean
  className?: string
}

const variantStyles = {
  primary: "bg-emerald active:bg-emerald-dark",
  secondary: "bg-navy active:bg-navy/80",
  danger: "bg-red-500 active:bg-red-600",
  ghost: "bg-transparent border border-border active:bg-surface",
}

const textStyles = {
  primary: "text-white",
  secondary: "text-white",
  danger: "text-white",
  ghost: "text-navy",
}

const sizeStyles = {
  sm: "px-3 py-2 rounded-lg",
  md: "px-5 py-3 rounded-xl",
  lg: "px-6 py-4 rounded-xl",
}

const textSizeStyles = {
  sm: "text-xs font-semibold",
  md: "text-sm font-semibold",
  lg: "text-base font-bold",
}

export function Button({
  onPress, children, variant = "primary", size = "md",
  loading, disabled, className,
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={cn(
        "flex-row items-center justify-center",
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && "opacity-50",
        className
      )}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === "ghost" ? "#0F172A" : "white"}
          style={{ marginRight: 8 }}
        />
      )}
      <Text className={cn(textStyles[variant], textSizeStyles[size])}>
        {children}
      </Text>
    </TouchableOpacity>
  )
}
