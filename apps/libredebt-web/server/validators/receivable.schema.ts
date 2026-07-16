/**
 * server/validators/receivable.schema.ts
 *
 * Mirrors server/validators/debt.schema.ts's structure exactly, with
 * fields swapped for the receivable domain (debtor contact info instead
 * of creditor/interest/minimum-payment).
 */

import { z } from "zod";

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
  .refine((val) => parseFloat(val) <= 999_999_999.99, {
    message: "Amount exceeds maximum allowed value",
  });

// ─── Create Receivable ─────────────────────────────────────────────────────────

export const createReceivableSchema = z.object({
  name: z
    .string({ message: "A label is required" })
    .min(2, "Must be at least 2 characters")
    .max(100, "Must be 100 characters or less")
    .trim(),

  debtorName: z
    .string({ message: "Their name is required" })
    .min(1, "Their name is required")
    .max(100, "Must be 100 characters or less")
    .trim(),

  debtorPhone: z
    .string()
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val?.trim())),

  debtorRelationship: z
    .string()
    .max(50, "Must be 50 characters or less")
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val?.trim())),

  originalAmount: monetaryString.refine((val) => parseFloat(val) > 0, {
    message: "Amount must be greater than zero",
  }),

  currency: z.string().min(3).max(3).default("NGN"),

  /** Date input as a string (HTML date input), optional */
  expectedByDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), {
      message: "Enter a valid date",
    }),

  notes: z
    .string()
    .max(500, "Must be 500 characters or less")
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val?.trim())),
});

export type CreateReceivableInput = z.infer<typeof createReceivableSchema>;

// ─── Edit Receivable ──────────────────────────────────────────────────────────
// Same immutability principle as debts: originalAmount cannot be edited.

export const editReceivableSchema = createReceivableSchema.omit({
  originalAmount: true,
});

export type EditReceivableInput = z.infer<typeof editReceivableSchema>;

// ─── Archive / Settle ─────────────────────────────────────────────────────────

export const archiveReceivableSchema = z.object({
  receivableId: z.string().min(1, "Receivable ID is required"),
});

export type ArchiveReceivableInput = z.infer<typeof archiveReceivableSchema>;

// ─── Record Repayment ──────────────────────────────────────────────────────────

export const recordRepaymentSchema = z.object({
  receivableId: z.string().min(1, "Receivable ID is required"),

  amount: monetaryString.refine((val) => parseFloat(val) > 0, {
    message: "Repayment amount must be greater than zero",
  }),

  effectiveDate: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Enter a valid date",
    }),

  note: z
    .string()
    .max(200, "Must be 200 characters or less")
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val?.trim())),
});

export type RecordRepaymentInput = z.infer<typeof recordRepaymentSchema>;
