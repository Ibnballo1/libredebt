/**
 * server/validators/debt.schema.ts
 *
 * Zod v4 schemas for all debt-related input validation.
 *
 * WHY THIS FILE EXISTS AS THE FIRST THING WE BUILD:
 * The schema is the contract between the UI and the server.
 * Writing it first forces us to decide what data is required,
 * what's optional, and what constraints exist — before we touch
 * any form or database code.
 *
 * IMPORTANT — ZOD v4 CHANGES:
 * The package is still imported from "zod" but v4 has breaking changes:
 *   - z.string().nonempty() → z.string().min(1)
 *   - z.number().positive() works the same
 *   - Error message API changed: use { message: "..." } not { invalid_type_error: "..." }
 *   - z.coerce.number() is the correct way to coerce string inputs to numbers
 *
 * MONETARY VALUES:
 * All monetary inputs come in as decimal strings from the form
 * (e.g., "1500.00") and are converted to integer minor units
 * (e.g., 150000) before storage.
 * The schema validates the decimal string; the service layer converts.
 *
 * INTEREST RATE:
 * Stored as basis points (integer). 24% → 2400.
 * The form accepts a decimal percentage (e.g., "24.00"),
 * the service converts to basis points.
 */

import { z } from "zod";

// ─── Reusable field validators ────────────────────────────────────────────────

/**
 * A monetary decimal string input validator.
 * Accepts: "1500", "1500.00", "1500.5"
 * Rejects: negative values, non-numeric strings, empty strings
 */
const monetaryString = z
  .string({ message: "Amount is required" })
  .min(1, "Amount is required")
  .refine(
    (val) => {
      const n = parseFloat(val);
      return !isNaN(n) && n >= 0;
    },
    { message: "Enter a valid amount (e.g. 1500.00)" },
  )
  .refine(
    (val) => {
      const n = parseFloat(val);
      return n <= 999_999_999.99;
    },
    { message: "Amount exceeds maximum allowed value" },
  );

/**
 * An optional monetary decimal string.
 * Empty string or undefined → treated as 0.
 */
const optionalMonetaryString = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val === "") return true;
      const n = parseFloat(val);
      return !isNaN(n) && n >= 0;
    },
    { message: "Enter a valid amount" },
  );

// ─── Create Debt Schema ───────────────────────────────────────────────────────

export const createDebtSchema = z.object({
  /**
   * Human-readable debt name.
   * Required, 2–100 characters.
   */
  name: z
    .string({ message: "Debt name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or less")
    .trim(),

  /**
   * The institution or person owed.
   * Required.
   */
  creditor: z
    .string({ message: "Creditor is required" })
    .min(1, "Creditor is required")
    .max(100, "Creditor must be 100 characters or less")
    .trim(),

  /**
   * Original debt amount — decimal string from the form.
   * Must be positive (a debt of ₦0 doesn't make sense).
   * Converted to minor units in the service layer.
   */
  originalAmount: monetaryString.refine((val) => parseFloat(val) > 0, {
    message: "Original amount must be greater than zero",
  }),

  /**
   * Annual interest rate as a percentage string.
   * 0 is valid (interest-free loan).
   * 100% maximum — sanity check only.
   */
  interestRate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const n = parseFloat(val);
        return !isNaN(n) && n >= 0 && n <= 100;
      },
      { message: "Interest rate must be between 0 and 100" },
    ),

  /**
   * Monthly minimum payment — decimal string.
   * Optional, defaults to 0.
   */
  minimumPayment: optionalMonetaryString,

  /**
   * Day of month payment is due (1–31).
   * Optional.
   */
  dueDay: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const n = parseInt(val, 10);
        return !isNaN(n) && n >= 1 && n <= 31;
      },
      { message: "Due day must be between 1 and 31" },
    ),

  /**
   * ISO 4217 currency code.
   * Defaults to NGN if not provided.
   */
  currency: z
    .string()
    .min(3, "Select a currency")
    .max(3, "Invalid currency code")
    .default("NGN"),

  /**
   * Optional notes about the debt.
   */
  notes: z
    .string()
    .max(500, "Notes must be 500 characters or less")
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val?.trim())),
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;

// ─── Edit Debt Schema ─────────────────────────────────────────────────────────

/**
 * Same as create but original amount cannot be changed after creation.
 * The original amount is the historical anchor for progress calculation.
 */
export const editDebtSchema = createDebtSchema.omit({ originalAmount: true });

export type EditDebtInput = z.infer<typeof editDebtSchema>;

// ─── Archive Debt Schema ──────────────────────────────────────────────────────

export const archiveDebtSchema = z.object({
  debtId: z.string().min(1, "Debt ID is required"),
});

export type ArchiveDebtInput = z.infer<typeof archiveDebtSchema>;

// ─── Record Payment Schema ────────────────────────────────────────────────────

export const recordPaymentSchema = z.object({
  debtId: z.string().min(1, "Debt ID is required"),

  /**
   * Payment amount — must be positive.
   */
  amount: monetaryString.refine((val) => parseFloat(val) > 0, {
    message: "Payment amount must be greater than zero",
  }),

  /**
   * The date the payment was actually made.
   * Defaults to today but user can backdate.
   */
  effectiveDate: z
    .string()
    .min(1, "Payment date is required")
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Enter a valid date",
    }),

  /**
   * Optional note about the payment.
   * e.g., "Monthly salary deduction", "Extra payment from bonus"
   */
  note: z
    .string()
    .max(200, "Note must be 200 characters or less")
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val?.trim())),

  /**
   * * Receipt URL (optional) — if the user uploads a receipt image, the service layer
   * will store it in S3 and return the URL, which is then saved here.
   */
  receiptUrl: z.string().optional().or(z.literal("")),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

// ─── Currency options ─────────────────────────────────────────────────────────

export const SUPPORTED_CURRENCIES = [
  { code: "NGN", label: "Nigerian Naira (₦)", symbol: "₦" },
  { code: "USD", label: "US Dollar ($)", symbol: "$" },
  { code: "GBP", label: "British Pound (£)", symbol: "£" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
  { code: "GHS", label: "Ghanaian Cedi (₵)", symbol: "₵" },
  { code: "KES", label: "Kenyan Shilling (KSh)", symbol: "KSh" },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["code"];
