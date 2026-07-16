/**
 * lib/currency.ts — Currency formatting (mirrors web app's lib/utils.ts)
 *
 * Same CURRENCY_LOCALE_MAP and formatCurrency logic as the web app so
 * amounts display identically across platforms.
 */

const CURRENCY_LOCALE_MAP: Record<string, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "en-DE",
  GHS: "en-GH",
  KES: "en-KE",
  ZAR: "en-ZA",
  CAD: "en-CA",
  AUD: "en-AU",
  JPY: "ja-JP",
  CNY: "zh-CN",
  INR: "en-IN",
}

function localeForCurrency(currency: string): string {
  return CURRENCY_LOCALE_MAP[currency] ?? "en-US"
}

type FormatCurrencyOptions = {
  currency?: string
  compact?: boolean
}

/**
 * Formats an integer minor-unit amount as a display currency string.
 * amountMinor is in kobo/cents — divide by 100 to get major units.
 */
export function formatCurrency(
  amountMinor: number,
  options: FormatCurrencyOptions = {}
): string {
  const { currency = "NGN", compact = false } = options
  const locale = localeForCurrency(currency)
  const amount = amountMinor / 100

  if (compact && Math.abs(amount) >= 1_000_000) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const SUPPORTED_CURRENCIES = [
  { code: "NGN", label: "NGN — Nigerian Naira (₦)" },
  { code: "USD", label: "USD — US Dollar ($)" },
  { code: "GBP", label: "GBP — British Pound (£)" },
  { code: "EUR", label: "EUR — Euro (€)" },
  { code: "GHS", label: "GHS — Ghanaian Cedi (₵)" },
  { code: "KES", label: "KES — Kenyan Shilling (KSh)" },
  { code: "ZAR", label: "ZAR — South African Rand (R)" },
  { code: "CAD", label: "CAD — Canadian Dollar (CA$)" },
  { code: "AUD", label: "AUD — Australian Dollar (A$)" },
]
