/**
 * app/(app)/_layout.tsx — Authenticated tab navigator
 */

import { Tabs, router } from "expo-router"
import { useEffect } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useAuthStore } from "@/store/authStore"
import { TrialBanner } from "@/components/layout/TrialBanner"
import { useSubscription } from "@/hooks/useSubscription"
import { View } from "react-native"

function TabLayout() {
  const { data: sub } = useSubscription()

  return (
    <View className="flex-1">
      {sub?.isInTrial && sub.tier === "free" && (
        <TrialBanner daysLeft={sub.trialDaysLeft} />
      )}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#10B981",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E2E8F0",
            borderTopWidth: 1,
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Overview",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="debts"
          options={{
            title: "Debts",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="receivables"
          options={{
            title: "Receivables",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="hand-left-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: "Analytics",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  )
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/sign-in")
    }
  }, [isAuthenticated, isLoading])

  return <TabLayout />
}
