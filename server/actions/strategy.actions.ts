/**
 * server/actions/strategy.actions.ts
 *
 * Server Actions for the debt strategy feature.
 * Both actions are PRO-GATED via USE_SNOWBALL / USE_AVALANCHE checks
 * (defined in access.service.ts since Step 3).
 */

"use server";

import { revalidatePath } from "next/cache";
import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import { checkFeatureAccess } from "@/server/services/access.service";
import { toMinorUnits } from "@/lib/utils";
import {
  getStrategyComparison,
  commitStrategy as commitStrategyService,
  clearStrategy as clearStrategyService,
} from "@/server/services/strategy.service";
import {
  runStrategySchema,
  commitStrategySchema,
} from "@/server/validators/strategy.schema";

const authAction = createSafeActionClient().use(async ({ next }) => {
  const user = await requireUser();
  return next({
    ctx: {
      userId: user.id,
      subscriptionTier: (user.subscriptionTier ?? "free") as "free" | "pro",
    },
  });
});

// ─── Run comparison at a custom budget ────────────────────────────────────────

export const runStrategyComparisonAction = authAction
  .inputSchema(runStrategySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, subscriptionTier } = ctx;

    // Either gate covers access to this page — a Pro user has both.
    const access = await checkFeatureAccess(
      userId,
      subscriptionTier,
      "USE_SNOWBALL",
    );
    if (!access.allowed) {
      return {
        success: false as const,
        error: access.reason,
        code: access.code,
      };
    }

    const budgetMinor = toMinorUnits(parsedInput.monthlyBudget);
    const comparison = await getStrategyComparison(userId, budgetMinor);

    return { success: true as const, comparison };
  });

// ─── Commit to a strategy ─────────────────────────────────────────────────────

export const commitStrategyAction = authAction
  .inputSchema(commitStrategySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, subscriptionTier } = ctx;

    const feature =
      parsedInput.strategy === "snowball" ? "USE_SNOWBALL" : "USE_AVALANCHE";
    const access = await checkFeatureAccess(userId, subscriptionTier, feature);
    if (!access.allowed) {
      return {
        success: false as const,
        error: access.reason,
        code: access.code,
      };
    }

    const budgetMinor = toMinorUnits(parsedInput.monthlyBudget);
    const comparison = await getStrategyComparison(userId, budgetMinor);
    const result =
      parsedInput.strategy === "snowball"
        ? comparison.snowball
        : comparison.avalanche;

    await commitStrategyService(userId, result);

    revalidatePath("/strategies");
    revalidatePath("/debts");
    revalidatePath("/overview");

    return { success: true as const };
  });

// ─── Clear active strategy ────────────────────────────────────────────────────

export const clearStrategyAction = authAction.action(async ({ ctx }) => {
  await clearStrategyService(ctx.userId);

  revalidatePath("/strategies");
  revalidatePath("/debts");
  revalidatePath("/overview");

  return { success: true as const };
});
