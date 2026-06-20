/**
 * server/actions/simulation.actions.ts
 *
 * Single Server Action powering the what-if slider.
 * Re-runs on every slider change via debounced calls from the client.
 *
 * PRO-GATED via USE_SIMULATIONS (already defined in access.service.ts
 * since Step 3 — this stage just exercises it for the first time).
 */

"use server";

import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import { checkFeatureAccess } from "@/server/services/access.service";
import { toMinorUnits } from "@/lib/utils";
import { runWhatIfSimulation } from "@/server/services/simulation.service";
import { runSimulationSchema } from "@/server/validators/simulation.schema";

const authAction = createSafeActionClient().use(async ({ next }) => {
  const user = await requireUser();
  return next({
    ctx: {
      userId: user.id,
      subscriptionTier: (user.subscriptionTier ?? "free") as "free" | "pro",
    },
  });
});

export const runSimulationAction = authAction
  .inputSchema(runSimulationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, subscriptionTier } = ctx;

    const access = await checkFeatureAccess(
      userId,
      subscriptionTier,
      "USE_SIMULATIONS",
    );
    if (!access.allowed) {
      return {
        success: false as const,
        error: access.reason,
        code: access.code,
      };
    }

    const extraMonthlyMinor = toMinorUnits(parsedInput.extraMonthly);
    const baselineBudgetMinor = parsedInput.baselineBudget
      ? toMinorUnits(parsedInput.baselineBudget)
      : undefined;

    const result = await runWhatIfSimulation(
      userId,
      extraMonthlyMinor,
      baselineBudgetMinor,
    );

    return { success: true as const, result };
  });
