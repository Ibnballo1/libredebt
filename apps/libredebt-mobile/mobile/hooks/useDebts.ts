/**
 * hooks/useDebts.ts — TanStack Query hooks for debts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export type Debt = {
  id: string
  name: string
  creditor: string
  currency: string
  status: "active" | "archived"
  originalAmountMinor: number
  currentBalanceMinor: number
  interestRateBps: number
  minimumPaymentMinor: number
  dueDay: number | null
  notes: string | null
  createdAt: string
}

export type LedgerEntry = {
  id: string
  type: "opening" | "payment" | "adjustment" | "interest" | "fee" | "reversal"
  amountMinor: number
  note: string | null
  receiptUrl: string | null
  effectiveDate: string
  recordedBy: "user" | "system"
}

export type CreateDebtInput = {
  name: string
  creditor: string
  originalAmount: string
  currency: string
  interestRate?: string
  minimumPayment?: string
  dueDay?: string
  notes?: string
}

export type RecordPaymentInput = {
  debtId: string
  amount: string
  effectiveDate: string
  note?: string
  receiptUrl?: string
}

export const DEBTS_KEYS = {
  all: ["debts"] as const,
  list: () => [...DEBTS_KEYS.all, "list"] as const,
  detail: (id: string) => [...DEBTS_KEYS.all, "detail", id] as const,
  ledger: (id: string) => [...DEBTS_KEYS.all, "ledger", id] as const,
}

export function useDebts() {
  return useQuery({
    queryKey: DEBTS_KEYS.list(),
    queryFn: () => api.get<{ debts: Debt[] }>("/api/mobile/debts"),
    select: (data) => data.debts,
  })
}

export function useDebt(id: string) {
  return useQuery({
    queryKey: DEBTS_KEYS.detail(id),
    queryFn: () => api.get<{ debt: Debt }>(`/api/mobile/debts/${id}`),
    select: (data) => data.debt,
    enabled: !!id,
  })
}

export function useDebtLedger(id: string) {
  return useQuery({
    queryKey: DEBTS_KEYS.ledger(id),
    queryFn: () => api.get<{ entries: LedgerEntry[] }>(`/api/mobile/debts/${id}/ledger`),
    select: (data) => data.entries,
    enabled: !!id,
  })
}

export function useCreateDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDebtInput) => api.post("/api/mobile/debts", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEBTS_KEYS.list() }),
  })
}

export function useEditDebt(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<CreateDebtInput>) =>
      api.put(`/api/mobile/debts/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBTS_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: DEBTS_KEYS.list() })
    },
  })
}

export function useArchiveDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/mobile/debts/${id}/archive`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEBTS_KEYS.list() }),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RecordPaymentInput) =>
      api.post(`/api/mobile/debts/${input.debtId}/payment`, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: DEBTS_KEYS.detail(vars.debtId) })
      qc.invalidateQueries({ queryKey: DEBTS_KEYS.ledger(vars.debtId) })
      qc.invalidateQueries({ queryKey: DEBTS_KEYS.list() })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
