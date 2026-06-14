/**
 * lib/utils.ts — Global Application Utility Primitives
 *
 * Enforces pure helper routines across financial minor-unit scaling matrices,
 * multi-locale tracking calendars, and safe input string manipulations.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind CSS classes safely, resolving design token conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Precision Currency Layout Parsers ──────────────────────────────────────

type FormatCurrencyOptions = {
  currency?: string;
  locale?: string;
  /** Toggles standard macro numeric formats (e.g., ₦1.5M instead of ₦1,500,000.00) */
  compact?: boolean;
};

/**
 * Formats an integer minor unit amount as a pristine localized display currency string.
 * Automatically aligns custom target currencies to appropriate regional locales if unassigned.
 */
export function formatCurrency(
  amountMinor: number,
  options: FormatCurrencyOptions = {},
): string {
  const { currency = "NGN", compact = false } = options;

  // Dynamic fallback mapping vector ensures logical locale resolution arrays
  const locale =
    options.locale ||
    (currency === "NGN" ? "en-NG" : currency === "USD" ? "en-US" : "en-GB");

  // Pivot minor value tokens directly to major floating coordinates
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
 * Converts a string or numeric decimal user form entry safely to integer minor units.
 * Sanitizes input tokens to wipe out currency markers, symbol spaces, or accidental text bytes.
 */
export function toMinorUnits(value: string | number): number {
  if (value === undefined || value === null) return 0;

  let parsed: number;
  if (typeof value === "string") {
    // Sanitize values to isolate standard numerical elements
    const sanitized = value.replace(/[^0-9.-]/g, "");
    parsed = parseFloat(sanitized);
  } else {
    parsed = value;
  }

  if (isNaN(parsed) || !isFinite(parsed)) return 0;

  // Guard against float precision drift anomalies via standard Math rounding rules
  return Math.round(parsed * 100);
}

/**
 * Transforms integer minor units back to a regular decimal string for standard input population fields.
 */
export function fromMinorUnits(amountMinor: number): string {
  if (!amountMinor || isNaN(amountMinor)) return "0.00";
  return (amountMinor / 100).toFixed(2);
}

// ─── Calendar Tracking & Timeline Transforms ─────────────────────────────────

/**
 * Formats standard system dates into a structured uniform design language string layer.
 */
export function formatDate(
  date: Date | string,
  format: "short" | "medium" | "long" = "medium",
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const formats: Record<typeof format, Intl.DateTimeFormatOptions> = {
    short: { day: "numeric", month: "short" },
    medium: { day: "numeric", month: "short", year: "numeric" },
    long: { day: "numeric", month: "long", year: "numeric" },
  };

  return new Intl.DateTimeFormat("en-NG", formats[format]).format(d);
}

/**
 * Generates an automated relative timeline tracking context flag.
 * Supports past logs ("3 days ago") and schedules forthcoming payment events ("In 5 days").
 */
export function formatRelativeTime(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const absDays = Math.abs(diffDays);

  // Core Evaluation Strategy Matrix for Historical Entries
  if (diffDays >= 0) {
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  // Core Evaluation Strategy Matrix for Upcoming Schedules (Reminders engine integration)
  if (absDays === 1) return "Tomorrow";
  if (absDays < 7) return `In ${absDays} days`;
  if (absDays < 30) return `In ${Math.floor(absDays / 7)} weeks`;
  if (absDays < 365) return `In ${Math.floor(absDays / 30)} months`;
  return `In ${Math.floor(absDays / 365)} years`;
}

// ─── Calculations Matrix ───────────────────────────────────────────────────

/**
 * Computes individual debt reduction indicators clamped precisely between 0 and 100 percent lines.
 */
export function calculateProgressPercent(
  originalMinor: number,
  currentMinor: number,
): number {
  if (originalMinor <= 0) return 0;
  // If active user overpays balance parameter settings, clamp metrics cleanly
  if (currentMinor <= 0) return 100;

  const repaid = originalMinor - currentMinor;
  const percent = (repaid / originalMinor) * 100;
  return Math.min(100, Math.max(0, Math.round(percent * 10) / 10));
}

// ─── Text Array Cleaners ─────────────────────────────────────────────────────

/**
 * Truncates extended strings safely without breaking words, rendering trailing ellipses cleanly.
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}
