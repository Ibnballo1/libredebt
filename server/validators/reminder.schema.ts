/**
 * server/validators/reminder.schema.ts
 *
 * Validation schemas for reminder-related Server Actions.
 * Stage 1 had only the table stub — these are the first real
 * reminder mutations.
 */

import { z } from "zod";

/**
 * Toggles a reminder type on/off for a specific debt.
 * Used by the per-debt reminder toggle in debt settings.
 */
export const toggleDebtReminderSchema = z.object({
  debtId: z.string().min(1, "Debt ID is required"),
  enabled: z.boolean(),
});

export type ToggleDebtReminderInput = z.infer<typeof toggleDebtReminderSchema>;

/**
 * Updates global reminder preferences for the user.
 * Stored on the user record (extends BetterAuth's additionalFields
 * pattern — see Step 3).
 */
export const updateReminderPreferencesSchema = z.object({
  dueSoonEnabled: z.boolean(),
  overdueEnabled: z.boolean(),
  weeklySummaryEnabled: z.boolean(),
});

export type UpdateReminderPreferencesInput = z.infer<
  typeof updateReminderPreferencesSchema
>;
