import { useState, useEffect, useRef } from "react"
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from "react-native"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import Toast from "react-native-toast-message"
import { Ionicons } from "@expo/vector-icons"
import { useSubscription } from "@/hooks/useSubscription"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

const PLANS = [
  { key: "6month" as const, label: "6 Months", price: "₦3,000", perMonth: "₦500/mo", badge: null },
  { key: "1year" as const, label: "1 Year", price: "₦5,500", perMonth: "₦458/mo", badge: "Best value" },
]

const PRO_FEATURES = [
  "Unlimited debts",
  "Smart reminders",
  "Snowball & Avalanche strategies",
  "What-if simulations",
  "Advanced analytics",
  "CSV & PDF exports",
  "Receivables tracking",
]

export default function BillingScreen() {
  const { data: sub, refetch, isRefetching } = useSubscription()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [selectedPlan, setSelectedPlan] = useState<"6month" | "1year">("1year")
  const [checkingOut, setCheckingOut] = useState(false)
  const [polling, setPolling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCount = useRef(0)

  // Poll for subscription confirmation after returning from Paystack
  function startPolling() {
    setPolling(true)
    pollCount.current = 0
    pollRef.current = setInterval(async () => {
      pollCount.current++
      await refetch()
      if (sub?.isPro) {
        stopPolling()
        Toast.show({ type: "success", text1: "You're now on Pro! 🎉", text2: "All features unlocked." })
        return
      }
      if (pollCount.current >= 15) {
        stopPolling()
        Toast.show({ type: "info", text1: "Payment received", text2: "Your Pro access will activate shortly." })
      }
    }, 2000)
  }

  function stopPolling() {
    setPolling(false)
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  useEffect(() => {
    if (sub?.isPro && polling) stopPolling()
  }, [sub?.isPro])

  useEffect(() => () => stopPolling(), [])

  async function handleCheckout() {
    setCheckingOut(true)
    try {
      const res = await api.post<{ authorizationUrl: string }>(
        "/api/mobile/billing/checkout",
        { plan: selectedPlan }
      )
      const result = await WebBrowser.openAuthSessionAsync(
        res.authorizationUrl,
        "libredebt://settings/billing"
      )
      if (result.type === "success" || result.type === "dismiss") {
        startPolling()
      }
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Could not start checkout", text2: err?.message })
    } finally {
      setCheckingOut(false)
    }
  }

  async function handleCancel() {
    try {
      await api.post("/api/mobile/billing/cancel", {})
      Toast.show({ type: "success", text1: "Subscription canceled", text2: "You keep Pro until period ends." })
      qc.invalidateQueries({ queryKey: ["subscription"] })
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to cancel", text2: err?.message })
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-navy">Billing & Plan</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
      >
        {/* Pro state */}
        {sub?.isPro && (
          <Card className="mb-6 border-emerald/20 bg-emerald/5">
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-9 h-9 bg-emerald/15 rounded-lg items-center justify-center">
                <Ionicons name="diamond" size={18} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-navy">LibreDebt Pro</Text>
                <Text className="text-xs text-muted">via Paystack</Text>
              </View>
              <View className="bg-emerald/15 rounded-full px-2 py-0.5">
                <Text className="text-[9px] font-bold uppercase tracking-widest text-emerald-dark">
                  {sub.subscription?.status === "canceled" ? "Ending" : "Active"}
                </Text>
              </View>
            </View>
            {sub.subscription?.currentPeriodEnd && (
              <Text className="text-xs text-muted">
                {sub.subscription.status === "canceled"
                  ? `Access ends ${formatDate(sub.subscription.currentPeriodEnd, "long")}`
                  : `Renews ${formatDate(sub.subscription.currentPeriodEnd, "long")}`}
              </Text>
            )}
            {sub.subscription?.status !== "canceled" && (
              <TouchableOpacity
                onPress={handleCancel}
                className="mt-3 pt-3 border-t border-border"
              >
                <Text className="text-xs text-muted">Cancel subscription</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Trial banner */}
        {sub?.isInTrial && !sub.isPro && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 flex-row items-center gap-3">
            <Ionicons name="time-outline" size={18} color="#D97706" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-amber-800">
                {sub.trialDaysLeft === 0 ? "Trial ends today" : `${sub.trialDaysLeft} days left in trial`}
              </Text>
              <Text className="text-xs text-amber-700 mt-0.5">Upgrade to keep all features</Text>
            </View>
          </View>
        )}

        {/* Pro features */}
        {!sub?.isPro && (
          <>
            <Card className="mb-4 bg-surface">
              <Text className="text-[9px] font-bold tracking-widest uppercase text-subtle mb-3">
                Everything in Pro
              </Text>
              <View className="gap-2">
                {PRO_FEATURES.map((f) => (
                  <View key={f} className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text className="text-sm text-navy">{f}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* Plan selector */}
            <View className="flex-row gap-3 mb-4">
              {PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.key}
                  onPress={() => setSelectedPlan(plan.key)}
                  className={`flex-1 rounded-2xl border-2 p-4 ${
                    selectedPlan === plan.key
                      ? "border-emerald bg-emerald/5"
                      : "border-border bg-white"
                  }`}
                >
                  {plan.badge && (
                    <View className="bg-emerald rounded-full px-2 py-0.5 self-start mb-2">
                      <Text className="text-[9px] font-bold text-white">{plan.badge}</Text>
                    </View>
                  )}
                  <Text className="text-sm font-bold text-navy">{plan.label}</Text>
                  <Text className="text-2xl font-bold text-navy mt-1">{plan.price}</Text>
                  <Text className="text-[10px] text-muted mt-0.5">{plan.perMonth}</Text>
                  {selectedPlan === plan.key && (
                    <View className="absolute top-3 right-3 w-5 h-5 bg-emerald rounded-full items-center justify-center">
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {polling ? (
              <View className="bg-emerald/5 border border-emerald/20 rounded-2xl py-4 px-4 items-center mb-4">
                <Ionicons name="sync-outline" size={20} color="#10B981" />
                <Text className="text-sm font-semibold text-navy mt-2">Confirming your payment…</Text>
                <Text className="text-xs text-muted mt-1">This usually takes a few seconds</Text>
              </View>
            ) : (
              <Button onPress={handleCheckout} loading={checkingOut} size="lg" className="mb-3">
                Pay {selectedPlan === "6month" ? "₦3,000" : "₦5,500"} with Paystack
              </Button>
            )}

            <Text className="text-[10px] text-subtle text-center mb-8">
              Secure payment via Paystack · Cards, bank transfer & USSD · Cancel anytime
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  )
}
