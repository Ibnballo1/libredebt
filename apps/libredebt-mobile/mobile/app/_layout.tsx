/**
 * app/_layout.tsx — Root layout
 * Hydrates auth state, provides QueryClient, sets up toast
 */

import { useEffect } from "react"
import { Stack } from "expo-router"
import { QueryClientProvider } from "@tanstack/react-query"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Toast from "react-native-toast-message"
import { queryClient } from "@/lib/queryClient"
import { useAuthStore } from "@/store/authStore"
import { usePreferencesStore } from "@/store/preferencesStore"
import "../global.css"

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate)
  const loadPrefs = usePreferencesStore((s) => s.load)

  useEffect(() => {
    hydrate()
    loadPrefs()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
