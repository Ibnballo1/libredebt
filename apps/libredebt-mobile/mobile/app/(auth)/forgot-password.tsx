/**
 * app/(auth)/forgot-password.tsx
 */

import { View, Text } from "react-native"
import { router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Toast from "react-native-toast-message"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

const schema = z.object({ email: z.string().email("Enter a valid email") })
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordScreen() {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormValues) {
    try {
      await api.post("/api/auth/forget-password", { email: data.email, redirectTo: "/reset-password" })
      Toast.show({ type: "success", text1: "Check your email", text2: "We sent a password reset link" })
      router.back()
    } catch {
      Toast.show({ type: "error", text1: "Something went wrong", text2: "Please try again" })
    }
  }

  return (
    <View className="flex-1 bg-surface px-6 pt-20">
      <Text className="text-2xl font-bold text-navy mb-2">Reset password</Text>
      <Text className="text-sm text-muted mb-8">Enter your email and we'll send you a reset link.</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Email address"
            value={value}
            onChangeText={onChange}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            error={errors.email?.message}
          />
        )}
      />

      <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" className="mb-3">
        Send reset link
      </Button>
      <Button onPress={() => router.back()} variant="ghost" size="lg">Cancel</Button>
    </View>
  )
}
