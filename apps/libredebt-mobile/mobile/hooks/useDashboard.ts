/**
 * hooks/useDashboard.ts — Dashboard stats query
 */

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export type DashboardStats = {
  totalOutstandingMinor: number
  totalActiveDebts: number
  totalRepaidMinor: number
  paymentsThisMonthMinor: number
  currency: string
  recentActivity: Array<{
    id: string
    type: string
    amountMinor: number
    debtName: string
    effectiveDate: string
  }>
  debtBreakdown: Array<{
    id: string
    name: string
    creditor: string
    currentBalanceMinor: number
    originalAmountMinor: number
    currency: string
  }>
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardStats>("/api/mobile/dashboard"),
  })
}
