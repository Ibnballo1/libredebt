/**
 * app/(auth)/sign-up.tsx — Sign Up Screen
 */

import { useState } from "react"
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView
} from "react-native"
import { Link, router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Toast from "react-native-toast-message"
import { Ionicons } from "@expo/vector-icons"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})
type FormValues = z.infer<typeof schema>

export default function SignUpScreen() {
  const [showPassword, setShowPassword] = useState(false)
  const { setUser } = useAuthStore()

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(data: FormValues) {
    try {
      const res = await api.post<{ token: string; user: any }>("/api/auth/sign-up/email", {
        name: data.name,
        email: data.email,
        password: data.password,
      })
      if (res.token && res.user) {
        await setUser(res.user, res.token)
        Toast.show({
          type: "success",
          text1: "Welcome to LibreDebt! 🎉",
          text2: "Your 3-day free trial has started.",
          visibilityTime: 4000,
        })
        router.replace("/(app)")
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Sign up failed",
        text2: err?.message ?? "Please try again",
      })
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-16 pb-8">
          <View className="mb-8">
            <View className="w-12 h-12 bg-navy rounded-2xl items-center justify-center mb-4">
              <View className="w-4 h-4 bg-emerald rounded-md absolute bottom-2 left-2" />
            </View>
            <Text className="text-2xl font-bold text-navy">Create account</Text>
            <Text className="text-sm text-muted mt-1">Start your debt-free journey</Text>
          </View>

          {/* Trial banner */}
          <View className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex-row items-center gap-3">
            <Ionicons name="time-outline" size={18} color="#D97706" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-amber-800">3-day free trial included</Text>
              <Text className="text-xs text-amber-700 mt-0.5">Full Pro access, no card required</Text>
            </View>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full name"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. Chukwuemeka Obi"
                error={errors.name?.message}
              />
            )}
          />

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
                autoCorrect={false}
                placeholder="you@example.com"
                error={errors.email?.message}
              />
            )}
          />

          {(["password", "confirmPassword"] as const).map((field) => (
            <Controller
              key={field}
              control={control}
              name={field}
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">
                    {field === "password" ? "Password" : "Confirm password"}
                  </Text>
                  <View className="relative">
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={!showPassword}
                      placeholder={field === "password" ? "Min. 8 characters" : "Repeat password"}
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      className={`border rounded-xl px-3.5 py-3 text-sm text-navy bg-white pr-12 ${
                        errors[field] ? "border-red-300 bg-red-50" : "border-border"
                      }`}
                    />
                    {field === "password" && (
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3"
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  {errors[field] && (
                    <Text className="mt-1 text-xs text-red-500">{errors[field]?.message}</Text>
                  )}
                </View>
              )}
            />
          ))}

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            size="lg"
            className="mt-2 mb-6"
          >
            Create account
          </Button>

          <View className="flex-row justify-center">
            <Text className="text-sm text-muted">Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text className="text-sm font-bold text-emerald">Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
