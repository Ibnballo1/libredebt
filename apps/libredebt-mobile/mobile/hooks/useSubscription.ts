/**
 * hooks/useSubscription.ts — Subscription + trial status
 */

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"

export type SubscriptionStatus = {
  tier: "free" | "pro"
  isPro: boolean
  isInTrial: boolean
  trialDaysLeft: number
  subscription: {
    provider: string
    status: string
    currentPeriodEnd: string | null
  } | null
}

export function useSubscription() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.get<SubscriptionStatus>("/api/mobile/subscription"),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })
}
