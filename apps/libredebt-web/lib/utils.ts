/**
 * lib/utils.ts — Utility functions
 *
 * This file contains pure utility functions used throughout the application.
 *
 * FINANCIAL FORMATTING RULES:
 * All monetary values are stored as integer minor units (kobo/cents).
 * These functions convert between minor units and display strings.
 *
 * RULE: Convert to display ONLY at the presentation layer (UI).
 * Never convert to decimal for calculations — always work in minor units.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind CSS classes safely, resolving conflicts.
 * Used everywhere instead of manual string concatenation.
 *
 * Example:
 *   cn("px-2 py-1", condition && "bg-red-500", "px-4")
 *   → "py-1 bg-red-500 px-4" (px-2 is overridden by px-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatting ─────────────────────────────────────────────────────

type FormatCurrencyOptions = {
  currency?: string;
  /** If true, show $1.5M instead of $1,500,000 for large numbers */
  compact?: boolean;
};

/**
 * Maps a currency code to the most natural locale for formatting.
 *
 * WHY NOT HARDCODE "en-NG" FOR EVERYTHING?
 * Intl.NumberFormat's locale controls number formatting conventions
 * (decimal separators, digit grouping, symbol position) independently
 * from the currency symbol. Using "en-NG" for USD produces technically
 * correct output but feels wrong to non-Nigerian users.
 *
 * This map selects the most natural locale per currency so that:
 *   USD → en-US  → $1,500.00
 *   GBP → en-GB  → £1,500.00
 *   EUR → de-DE  → 1.500,00 €  (or en-DE for English speakers)
 *   NGN → en-NG  → ₦1,500.00
 *   etc.
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
};

function localeForCurrency(currency: string): string {
  return CURRENCY_LOCALE_MAP[currency] ?? "en-US";
}

/**
 * Formats an integer minor unit amount as a display currency string.
 *
 * @param amountMinor - Amount in minor units (kobo, cents)
 * @param options     - Currency code (default: NGN), compact flag
 *
 * Examples:
 *   formatCurrency(150000, { currency: "NGN" })  → "₦1,500.00"
 *   formatCurrency(1250, { currency: "USD" })     → "$12.50"
 *   formatCurrency(150000000, { currency: "NGN", compact: true }) → "₦1.5M"
 */
export function formatCurrency(
  amountMinor: number,
  options: FormatCurrencyOptions = {},
): string {
  const { currency = "NGN", compact = false } = options;
  const locale = localeForCurrency(currency);

  // Convert from minor units to major units
  const amount = amountMinor / 100;

  if (compact && Math.abs(amount) >= 1_000_000) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Converts a decimal string input (from a form) to integer minor units.
 * Used when accepting user input for amounts.
 *
 * @param value - Decimal string e.g. "1500.00" or "1500"
 * @returns Integer minor units e.g. 150000
 *
 * Examples:
 *   toMinorUnits("1500")    → 150000
 *   toMinorUnits("1500.50") → 150050
 *   toMinorUnits("0.01")    → 1
 */
export function toMinorUnits(value: string | number): number {
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(parsed)) return 0;
  // Round to avoid floating point issues: 1500.50 * 100 = 150049.99999...
  return Math.round(parsed * 100);
}

/**
 * Converts integer minor units to a decimal string for display in forms.
 *
 * @param amountMinor - Amount in minor units
 * @returns Decimal string e.g. "1500.00"
 *
 * Example:
 *   fromMinorUnits(150000) → "1500.00"
 */
export function fromMinorUnits(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

// ─── Date utilities ──────────────────────────────────────────────────────────

/**
 * Formats a date for display in the UI.
 * Always use this instead of new Date().toLocaleDateString()
 * for consistency across the application.
 */
export function formatDate(
  date: Date | string,
  format: "short" | "medium" | "long" = "medium",
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const formats: Record<typeof format, Intl.DateTimeFormatOptions> = {
    short: { day: "numeric", month: "short" },
    medium: { day: "numeric", month: "short", year: "numeric" },
    long: { day: "numeric", month: "long", year: "numeric" },
  };

  return new Intl.DateTimeFormat("en-NG", formats[format]).format(d);
}

/**
 * Returns a relative time string.
 * Used for "recorded 2 days ago" type displays.
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// ─── Percentage ──────────────────────────────────────────────────────────────

/**
 * Calculates repayment progress as a percentage.
 * Used for debt progress bars and dashboard metrics.
 *
 * @param originalMinor  - Original debt amount in minor units
 * @param currentMinor   - Current outstanding balance in minor units
 * @returns Percentage repaid (0–100), clamped to valid range
 */
export function calculateProgressPercent(
  originalMinor: number,
  currentMinor: number,
): number {
  if (originalMinor <= 0) return 0;
  const repaid = originalMinor - currentMinor;
  const percent = (repaid / originalMinor) * 100;
  return Math.min(100, Math.max(0, Math.round(percent * 10) / 10));
}

// ─── String utilities ─────────────────────────────────────────────────────────

/**
 * Truncates a string to a max length with an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/**
 * Generates initials from a name string.
 * "John Doe" → "JD" | "Amaka Obi" → "AO" | "Chidi" → "CH"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
  }
  return parts
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function htmlToPlainText(html: string): string {
  if (!html) return "";

  let text = html;

  // 1. Replace paragraph and heading ends with double newlines
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");

  // 2. Replace list items and line breaks with single newlines
  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // 3. Remove images entirely
  text = text.replace(/<img[^>]*>/gi, "");

  // 4. Strip all remaining HTML tags (like <strong>, <a>, etc.)
  // This keeps the text inside them, but drops the tag wrapper.
  text = text.replace(/<[^>]+>/g, "");

  // 5. Clean up excessive whitespace/newlines
  text = text.replace(/\n{3,}/g, "\n\n");

  // 6. Decode common HTML entities
  const entities: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
  };
  text = text.replace(/&[#\w\d]+;/g, (match) => entities[match] || match);

  return text.trim();
}
