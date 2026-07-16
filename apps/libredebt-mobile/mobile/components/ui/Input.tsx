import { View, Text, TextInput, TextInputProps } from "react-native"
import { cn } from "@/lib/utils"

type InputProps = TextInputProps & {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          "w-full border rounded-xl px-3.5 py-3 text-sm text-navy bg-white",
          "focus:border-emerald",
          error ? "border-red-300 bg-red-50" : "border-border",
          className
        )}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
      {hint && !error && <Text className="mt-1 text-[10px] text-subtle">{hint}</Text>}
    </View>
  )
}
