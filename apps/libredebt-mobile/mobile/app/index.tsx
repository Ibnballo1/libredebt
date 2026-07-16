/**
 * app/index.tsx — Entry point: redirect based on auth state
 */

import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const { isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/(app)" : "/(auth)/sign-in"} />;
}
