// server/validators/simulation.schema.ts

import { z } from "zod";

/**
 * runSimulationSchema — Form & Input validation for the Stage 4 What-If Simulation Engine.
 *
 * Custom coercion rules are utilized to cleanly parse values from input
 * slider ranges or text forms into standard floating-point primitives.
 */
export const runSimulationSchema = z.object({
  /**
   * The additional monthly payment premium injected by the user on top of their base plan.
   * Leveraged via the interactive slider layout. Must be positive or zero.
   */
  extraMonthly: z
    .preprocess((val) => Number(val), z.number())
    .default(0)
    .refine((val) => val >= 0, {
      message:
        "Extra monthly simulation premium must be greater than or equal to zero.",
    }),

  /**
   * Optional custom baseline target budget overrides passed straight from client structures.
   * Left optional to let the backend safely fall back on standard user ledger defaults.
   */
  baselineBudget: z
    .preprocess(
      (val) => (val === "" || val === undefined ? undefined : Number(val)),
      z.number().optional(),
    )
    .refine((val) => val === undefined || val > 0, {
      message:
        "Baseline budget allocation must be a strictly positive financial figure.",
    }),
});

export type RunSimulationInput = z.infer<typeof runSimulationSchema>;
