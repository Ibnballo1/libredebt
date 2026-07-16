import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateProgressPercent(
  originalAmountMinor: number,
  currentBalanceMinor: number
): number {
  if (originalAmountMinor <= 0) return 0
  const repaid = originalAmountMinor - currentBalanceMinor
  return Math.min(100, Math.max(0, Math.round((repaid / originalAmountMinor) * 100)))
}

export function formatDate(date: string | Date, style: "short" | "medium" | "long" = "medium"): string {
  const d = new Date(date)
  if (style === "short") return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" })
  if (style === "long") return d.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })
  return d.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}
