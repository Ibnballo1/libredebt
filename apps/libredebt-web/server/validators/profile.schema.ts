/**
 * server/validators/profile.schema.ts — UPDATED (Zod v4 compatible)
 *
 * Kept schema shapes simple — no .transform(), no .default(), no chained
 * .optional().nullable() — because @hookform/resolvers cannot infer those
 * correctly with Zod v4. Defaults and null-coercion happen in the component
 * (form defaultValues) and in the action (.set() call).
 */

import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/server/validators/debt.schema";

const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code) as [
  string,
  ...string[],
];

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),

  currency: z.enum(currencyCodes),

  /** Empty string means "no phone" — action converts "" → null */
  phone: z.string().max(20, "Phone number is too long").optional(),

  smsEnabled: z.boolean().optional(),

  whatsappEnabled: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  confirmText: z.literal("DELETE", {
    message: "Type DELETE exactly to confirm",
  }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
