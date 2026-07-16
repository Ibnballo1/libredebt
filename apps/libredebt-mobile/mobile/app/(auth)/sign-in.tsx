/**
 * app/(auth)/sign-in.tsx — Sign In Screen
 */

"use client"
import { useState } from "react"
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from "react-native"
import { Link, router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import * as LocalAuthentication from "expo-local-authentication"
import Toast from "react-native-toast-message"
import { Ionicons } from "@expo/vector-icons"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import * as SecureStore from "expo-secure-store"
import { TOKEN_KEY } from "@/store/authStore"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})
type FormValues = z.infer<typeof schema>

export default function SignInScreen() {
  const [showPassword, setShowPassword] = useState(false)
  const { setUser } = useAuthStore()

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: FormValues) {
    try {
      const res = await api.post<{ token: string; user: any }>("/api/auth/sign-in/email", {
        email: data.email,
        password: data.password,
      })
      if (res.token && res.user) {
        await setUser(res.user, res.token)
        router.replace("/(app)")
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Sign in failed",
        text2: err?.message ?? "Check your email and password",
      })
    }
  }

  async function handleBiometric() {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY)
    if (!stored) {
      Toast.show({ type: "info", text1: "Sign in with email first to enable biometrics" })
      return
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to LibreDebt",
      fallbackLabel: "Use password",
    })
    if (result.success) {
      try {
        const session = await api.get<{ user: any }>("/api/auth/get-session")
        if (session?.user) {
          await setUser(session.user, stored)
          router.replace("/(app)")
        }
      } catch {
        Toast.show({ type: "error", text1: "Session expired", text2: "Please sign in again" })
      }
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
        <View className="flex-1 px-6 pt-20 pb-8">
          {/* Brand */}
          <View className="mb-10">
            <View className="w-12 h-12 bg-navy rounded-2xl items-center justify-center mb-4">
              <View className="w-4 h-4 bg-emerald rounded-md absolute bottom-2 left-2" />
            </View>
            <Text className="text-2xl font-bold text-navy">Welcome back</Text>
            <Text className="text-sm text-muted mt-1">Sign in to LibreDebt</Text>
          </View>

          {/* Form */}
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4">
                <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    placeholder="Your password"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    className={`border rounded-xl px-3.5 py-3 text-sm text-navy bg-white pr-12 ${
                      errors.password ? "border-red-300 bg-red-50" : "border-border"
                    }`}
                  />
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
                </View>
                {errors.password && (
                  <Text className="mt-1 text-xs text-red-500">{errors.password.message}</Text>
                )}
              </View>
            )}
          />

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity className="mb-6 self-end">
              <Text className="text-sm text-emerald font-semibold">Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            size="lg"
            className="mb-3"
          >
            Sign in
          </Button>

          <Button
            onPress={handleBiometric}
            variant="ghost"
            size="lg"
            className="mb-8"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="finger-print-outline" size={20} color="#0F172A" />
              <Text className="text-sm font-semibold text-navy ml-2">Use biometrics</Text>
            </View>
          </Button>

          <View className="flex-row justify-center">
            <Text className="text-sm text-muted">Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text className="text-sm font-bold text-emerald">Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
