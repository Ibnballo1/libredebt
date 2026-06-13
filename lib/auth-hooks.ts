import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Native interface mapping for BetterAuth's user creation context.
 * Bypasses loose 'unknown' parameters to enforce strict compilation types.
 */
interface OnUserCreatedContext {
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

/**
 * Global Transactional Database Hook
 * Fires automatically inside the database layer whenever a user is successfully registered.
 * Guarantees that every user—OAuth or Email—gets a corresponding app profile row.
 */
export async function onUserCreated(context: OnUserCreatedContext) {
  const { id, email } = context.user;

  try {
    // 1. Idempotency Check: Verify if a profile record mistakenly exists
    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, id),
    });

    if (existingProfile) {
      console.log(
        `[auth-hooks] Profile already exists for user: ${id}. Skipping.`,
      );
      return;
    }

    // 2. Insert the LibreDebt Core Profile Extension Row
    await db.insert(userProfiles).values({
      id: id,
      subscriptionTier: "free",
      currency: "NGN",
      onboardingCompleted: false,
    });

    console.log(
      `[auth-hooks] Successfully initialized app user_profile for: ${email}`,
    );

    // ─── FUTURE INTEGRATIONS (STAGE 2+) ──────────────────────────────────────
    // TODO: await sendWelcomeEmail(user.email, user.name)
    // TODO: await scheduleOnboardingReminder(user.id)
  } catch (error) {
    // Critical alert logging: Failure here means the user cannot use the app safely
    console.error(
      `[CRITICAL AUTH ERROR] Failed to instantiate companion profile row for user ${id}:`,
      error,
    );
    throw error; // Rethrow to prevent swallowing silent registration defects
  }
}
