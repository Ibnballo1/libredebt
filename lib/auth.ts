/**
 * lib/auth.ts — BetterAuth Server Configuration
 *
 * This is the ONLY place where auth behavior is defined.
 * It is imported by:
 *   1. app/api/auth/[...all]/route.ts  — handles HTTP auth requests
 *   2. lib/auth-session.ts             — reads sessions in Server Components
 *   3. middleware.ts                   — protects routes
 *
 * NEVER import this file into Client Components.
 * The server auth instance exposes secrets and DB access.
 *
 * BetterAuth manages its own tables:
 *   - user        (core identity)
 *   - session     (active sessions)
 *   - account     (OAuth provider links)
 *   - verification (email verification tokens)
 *
 * We extend the `user` table with our custom fields using the
 * `additionalFields` option, which adds columns directly to BetterAuth's
 * user table. This is simpler than the separate user_profiles approach
 * for fields that BetterAuth needs to be aware of (like subscriptionTier).
 *
 * For fields BetterAuth doesn't need to know about (like debt counts),
 * we still use the separate user_profiles table.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";
import { onUserCreated } from "./auth-hooks";

export const auth = betterAuth({
  /**
   * The database adapter.
   * BetterAuth will use our existing Drizzle instance to manage its tables.
   * This means BetterAuth's tables live in the same Supabase database as ours.
   *
   * `usePlural: true` matches Drizzle's convention of plural table names
   * (users, sessions, accounts, verifications).
   */
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: schema,
  }),

  /**
   * App-level configuration.
   * baseURL is used to construct callback URLs for OAuth.
   */
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  /**
   * Email + Password authentication.
   * This is the primary auth method for LibreDebt.
   */
  emailAndPassword: {
    enabled: true,
    /**
     * Require email verification before allowing login.
     * In Stage 1, this is disabled for faster onboarding.
     * Enable before production launch.
     */
    requireEmailVerification: false,
    /**
     * Password strength requirements.
     * 8 characters minimum — balances security with usability.
     */
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  /**
   * Social OAuth providers.
   * Google is the only provider in Stage 1.
   * Credentials are read from environment variables.
   */
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      /**
       * Scopes requested from Google.
       * We only need basic profile + email — nothing invasive.
       */
      scope: ["openid", "email", "profile"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        // BetterAuth expects the hook signature (user, context).
        // Wrap our existing onUserCreated which accepts a single context
        // object (OnUserCreatedContext) so types align.
        after: async (user, context) => {
          // Merge user into the context object expected by our hook.
          // Use any to avoid widening type issues here in this wrapper.
          await onUserCreated({ ...context, user } as Parameters<
            typeof onUserCreated
          >[0]);
        },
      },
    },
  },

  /**
   * Session configuration.
   * Sessions are stored in the database (not JWT-only).
   * This allows us to invalidate sessions server-side instantly —
   * critical for security (e.g., on password change or account deletion).
   */
  session: {
    /**
     * How long a session lasts without activity.
     * 30 days is standard for a productivity/finance app.
     * Users should not be logged out frequently — this causes frustration
     * and erodes the "source of truth" positioning of the product.
     */
    expiresIn: 60 * 60 * 24 * 30, // 30 days in seconds
    /**
     * If the user is active, extend the session automatically.
     * This means active users are never logged out unexpectedly.
     */
    updateAge: 60 * 60 * 24, // Update session timestamp if older than 1 day
    /**
     * Cookie configuration.
     * secure: true in production (HTTPS only)
     * sameSite: lax — allows OAuth redirects while preventing CSRF
     */
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache session in cookie for 5 minutes to reduce DB reads
    },
  },

  /**
   * Additional fields on BetterAuth's `user` table.
   * These are synced into BetterAuth's user table directly.
   * Use for fields that auth logic or the session needs to access quickly.
   */
  user: {
    additionalFields: {
      /**
       * The subscription tier is read on nearly every authenticated request.
       * Keeping it on the user table (not a join) means zero extra DB queries
       * to check feature access in Server Actions.
       */
      subscriptionTier: {
        type: "string",
        defaultValue: "free",
        required: false,
        input: false, // Cannot be set by the user directly
      },
      /**
       * Preferred display currency.
       * Defaults to NGN for our primary market.
       */
      currency: {
        type: "string",
        defaultValue: "NGN",
        required: false,
        input: true, // User can update this in settings
      },
      /**
       * Whether the user has completed the onboarding flow.
       */
      onboardingCompleted: {
        type: "boolean",
        defaultValue: false,
        required: false,
        input: false,
      },
    },
  },

  /**
   * Trusted origins for CORS.
   * In production, this should be your Vercel domain.
   */
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],

  /**
   * Rate limiting for auth endpoints.
   * Prevents brute-force attacks on login.
   * BetterAuth has built-in rate limiting — we enable it explicitly.
   */
  rateLimit: {
    enabled: true,
    window: 60, // 60 second window
    max: 10, // Max 10 auth attempts per window per IP
  },
});

/**
 * Exported type for the session.
 * Use this throughout the app instead of importing from better-auth directly,
 * so we have one place to update if the session shape changes.
 */
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
