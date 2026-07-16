/**
 * hooks/useReceivables.ts — TanStack Query hooks for receivables
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export type Receivable = {
  id: string
  name: string
  debtorName: string
  debtorPhone: string | null
  debtorRelationship: string | null
  currency: string
  status: "active" | "settled" | "archived"
  originalAmountMinor: number
  currentBalanceMinor: number
  expectedByDate: string | null
  notes: string | null
  createdAt: string
}

export const RECEIVABLES_KEYS = {
  all: ["receivables"] as const,
  list: () => [...RECEIVABLES_KEYS.all, "list"] as const,
  detail: (id: string) => [...RECEIVABLES_KEYS.all, "detail", id] as const,
  ledger: (id: string) => [...RECEIVABLES_KEYS.all, "ledger", id] as const,
}

export function useReceivables() {
  return useQuery({
    queryKey: RECEIVABLES_KEYS.list(),
    queryFn: () => api.get<{ receivables: Receivable[] }>("/api/mobile/receivables"),
    select: (data) => data.receivables,
  })
}

export function useReceivable(id: string) {
  return useQuery({
    queryKey: RECEIVABLES_KEYS.detail(id),
    queryFn: () =>
      api.get<{ receivable: Receivable }>(`/api/mobile/receivables/${id}`),
    select: (data) => data.receivable,
    enabled: !!id,
  })
}

export function useCreateReceivable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Record<string, string>) =>
      api.post("/api/mobile/receivables", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: RECEIVABLES_KEYS.list() }),
  })
}

export function useArchiveReceivable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/mobile/receivables/${id}/archive`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: RECEIVABLES_KEYS.list() }),
  })
}

export function useRecordRepayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { receivableId: string; amount: string; effectiveDate: string; note?: string }) =>
      api.post(`/api/mobile/receivables/${input.receivableId}/repayment`, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: RECEIVABLES_KEYS.detail(vars.receivableId) })
      qc.invalidateQueries({ queryKey: RECEIVABLES_KEYS.list() })
    },
  })
}
