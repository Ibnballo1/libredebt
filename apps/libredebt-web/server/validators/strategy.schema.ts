/**
 * server/validators/strategy.schema.ts
 */

import { z } from "zod";

export const runStrategySchema = z.object({
  monthlyBudget: z
    .string()
    .min(1, "Monthly budget is required")
    .refine(
      (val) => {
        const n = parseFloat(val);
        return !isNaN(n) && n > 0;
      },
      { message: "Enter a valid budget amount" },
    ),
});

export type RunStrategyInput = z.infer<typeof runStrategySchema>;

export const commitStrategySchema = z.object({
  strategy: z.enum(["snowball", "avalanche"]),
  monthlyBudget: z
    .string()
    .min(1, "Monthly budget is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Enter a valid budget amount",
    }),
});

export type CommitStrategyInput = z.infer<typeof commitStrategySchema>;
