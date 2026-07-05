import { isInTrial } from "@/server/services/billing.service";

export type Feature =
  | "CREATE_DEBT"
  | "USE_REMINDERS"
  | "USE_SNOWBALL"
  | "USE_AVALANCHE"
  | "VIEW_PROJECTIONS"
  | "USE_SIMULATIONS";

export type AccessResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: string;
      code: "UPGRADE_REQUIRED" | "TRIAL_EXPIRED" | "LIMIT_REACHED";
    };

export const FREE_PLAN_DEBT_LIMIT = 3;

export async function checkFeatureAccess(
  userId: string,
  subscriptionTier: "free" | "pro",
  feature: Feature,
  /** Pass user.createdAt so we can check trial status */
  createdAt?: Date,
): Promise<AccessResult> {
  // ── Trial bypass ─────────────────────────────────────────────────────────────
  // Users within their 3-day trial get full Pro access.
  // createdAt is optional for backward compat — existing callsites without
  // it will just skip the trial check.
  if (createdAt && isInTrial(createdAt)) {
    // Still enforce debt limit even during trial to prevent spam
    if (feature !== "CREATE_DEBT") {
      return { allowed: true };
    }
  }

  // ── Standard tier check ───────────────────────────────────────────────────────
  if (subscriptionTier === "pro") {
    return { allowed: true };
  }

  // Free plan rules:
  switch (feature) {
    case "CREATE_DEBT":
      // Handled at the action level with a count check; return allowed here
      // and let debt.actions.ts enforce FREE_PLAN_DEBT_LIMIT separately.
      return { allowed: true };

    case "USE_REMINDERS":
      return {
        allowed: false,
        reason:
          "Smart reminders are a Pro feature. Upgrade to enable payment alerts.",
        code: "UPGRADE_REQUIRED",
      };

    case "USE_SNOWBALL":
    case "USE_AVALANCHE":
      return {
        allowed: false,
        reason:
          "Debt payoff strategies are a Pro feature. Upgrade to access Snowball and Avalanche.",
        code: "UPGRADE_REQUIRED",
      };

    case "VIEW_PROJECTIONS":
    case "USE_SIMULATIONS":
      return {
        allowed: false,
        reason: "Simulations and projections are a Pro feature.",
        code: "UPGRADE_REQUIRED",
      };

    default:
      return { allowed: true };
  }
}
