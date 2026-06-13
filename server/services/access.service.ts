import { db } from "@/db";
import { debts } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

/**
 * All features that can be gated by subscription tier.
 * Stage 1 features only — more will be added in later stages.
 */
export type GatedFeature =
  | "CREATE_DEBT" // Free: max 3. Pro: unlimited.
  | "RECORD_PAYMENT" // Always allowed
  | "EDIT_DEBT" // Always allowed
  | "ARCHIVE_DEBT" // Always allowed
  // Stage 2+
  | "USE_REMINDERS" // Pro only
  | "USE_SNOWBALL" // Pro only
  | "USE_AVALANCHE" // Pro only
  | "VIEW_PROJECTIONS" // Pro only
  | "USE_SIMULATIONS"; // Pro only

/**
 * Explicit Type Alignment
 * Maps directly to your application's structural database enum definitions.
 */
export type SubscriptionTier = "free" | "pro";

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: string; code: AccessDeniedCode };

export type AccessDeniedCode =
  | "DEBT_LIMIT_REACHED"
  | "PRO_REQUIRED"
  | "UNKNOWN";

/**
 * The maximum number of active debts allowed on the free plan.
 */
export const FREE_PLAN_DEBT_LIMIT = 3;

/**
 * Checks whether a user has access to a given feature.
 *
 * @param userId  - The authenticated user's ID
 * @param tier    - The user's current subscription tier ("free" | "pro")
 * @param feature - The feature being requested
 * @returns AccessResult — either { allowed: true } or { allowed: false, reason, code }
 */
export async function checkFeatureAccess(
  userId: string,
  tier: SubscriptionTier,
  feature: GatedFeature,
): Promise<AccessResult> {
  switch (feature) {
    // ─── Always allowed ───────────────────────────────────────────────
    case "RECORD_PAYMENT":
    case "EDIT_DEBT":
    case "ARCHIVE_DEBT":
      return { allowed: true };

    // ─── Free plan: limited to 3 active debts ────────────────────────
    case "CREATE_DEBT": {
      if (tier === "pro") return { allowed: true };

      /**
       * Count the user's currently active debts.
       * Handled directly at the database engine layer to eliminate local memory race conditions.
       */
      const result = await db
        .select({ value: count() })
        .from(debts)
        .where(and(eq(debts.userId, userId), eq(debts.status, "active")));

      const activeDebtCount = result[0]?.value ?? 0;

      if (activeDebtCount >= FREE_PLAN_DEBT_LIMIT) {
        return {
          allowed: false,
          reason: `You've reached the ${FREE_PLAN_DEBT_LIMIT}-debt limit on the free plan. Upgrade to Pro to track unlimited debts.`,
          code: "DEBT_LIMIT_REACHED",
        };
      }

      return { allowed: true };
    }

    // ─── Pro-only features ────────────────────────────────────────────
    case "USE_REMINDERS":
    case "USE_SNOWBALL":
    case "USE_AVALANCHE":
    case "VIEW_PROJECTIONS":
    case "USE_SIMULATIONS": {
      if (tier === "pro") return { allowed: true };

      return {
        allowed: false,
        reason: "This feature requires a Pro subscription.",
        code: "PRO_REQUIRED",
      };
    }

    default: {
      /**
       * Exhaustive compile-time check guarding feature rollout integrity.
       */
      const _exhaustiveCheck: never = feature;
      return {
        allowed: false,
        reason: "Unknown feature.",
        code: "UNKNOWN",
      };
    }
  }
}

/**
 * Convenience wrapper: throws a structured error object instead of returning a status result payload.
 * Aborts bad Server Action execution calls immediately.
 */
export async function assertFeatureAccess(
  userId: string,
  tier: SubscriptionTier,
  feature: GatedFeature,
): Promise<void> {
  const result = await checkFeatureAccess(userId, tier, feature);
  if (!result.allowed) {
    throw new AccessDeniedError(result.reason, result.code);
  }
}

/**
 * Typed error class for access denial catches.
 */
export class AccessDeniedError extends Error {
  public readonly code: AccessDeniedCode;

  constructor(message: string, code: AccessDeniedCode) {
    super(message);
    this.name = "AccessDeniedError";
    this.code = code;
  }
}
