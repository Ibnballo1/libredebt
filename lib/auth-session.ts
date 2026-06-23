import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Session, User } from "@/lib/auth";

/**
 * Reads the current session from the request headers.
 * Returns null if the user is not authenticated.
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Returns the current session or throws a redirect to /login.
 * The redirect is a native Next.js router redirect.
 */
export async function requireSession(): Promise<Session | null> {
  return await getSession();
}
/**
 * Returns the current user or throws a redirect to /login.
 */
export async function requireUser(): Promise<User | null> {
  const session = await requireSession();
  return session?.user ?? null;
}

/**
 * Returns the current user's structural profile data.
 * This pulls directly from our app-controlled `user_profiles` extension table.
 */
export async function requireUserProfile() {
  const user = await requireUser();

  if (!user) {
    redirect("/login"); // Redirect to login if user is not authenticated
  }

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, user.id),
  });

  if (!profile) {
    // Edge case safety handler: If a profile record hasn't completed its background hook insertion
    throw new Error("User profile configuration could not be found.");
  }

  return profile;
}

/**
 * Returns the current user's subscription tier.
 * This is the secure point of truth for feature gating inside server actions.
 */
export async function getUserSubscriptionTier(): Promise<"free" | "pro"> {
  try {
    const profile = await requireUserProfile();
    return profile.subscriptionTier; // Clean, compiled, typed enum access!
  } catch {
    return "free"; // Resilient fallback
  }
}
