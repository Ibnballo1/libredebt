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
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";
import { onUserCreated } from "./auth-hooks";
import { sendVerificationEmail } from "@/server/services/email.service";

export const auth = betterAuth({
  /**
   * The database adapter.
   */
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: schema,
  }),

  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  /**
   * Email + Password authentication.
   */
  emailAndPassword: {
    enabled: true,
    /**
     * Mandate email verification before generating active sessions.
     * Prevents false/typo accounts from accessing the dashboard platform.
     */
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  /**
   * Email Verification Pipeline Configurations
   */
  emailVerification: {
    /**
     * Triggered automatically by BetterAuth whenever a user signs up via email/password,
     * or requests an explicit verification resend trigger.
     */
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      // Handoff tracking payload immediately to our transactional Resend dispatcher
      await sendVerificationEmail({
        toEmail: user.email,
        userName: user.name || "there",
        verificationUrl: url,
      }).catch((err: Error) => {
        console.error(
          `[auth-verification-hook-error] Critical delivery crash:`,
          err,
        );
      });
    },
  },

  /**
   * Social OAuth providers.
   * Google sign-ins bypass requireEmailVerification automatically since emails are trusted.
   */
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      scope: ["openid", "email", "profile"],
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user, context) => {
          await onUserCreated({ ...context, user } as Parameters<
            typeof onUserCreated
          >[0]);
        },
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      subscriptionTier: {
        type: "string",
        defaultValue: "free",
        required: false,
        input: false,
      },
      currency: {
        type: "string",
        defaultValue: "NGN",
        required: false,
        input: true,
      },
      onboardingCompleted: {
        type: "boolean",
        defaultValue: false,
        required: false,
        input: false,
      },
      reminderDueSoonEnabled: {
        type: "boolean",
        defaultValue: true,
        required: false,
        input: true,
      },
      reminderOverdueEnabled: {
        type: "boolean",
        defaultValue: true,
        required: false,
        input: true,
      },
      reminderWeeklySummaryEnabled: {
        type: "boolean",
        defaultValue: true,
        required: false,
        input: true,
      },
    },
  },

  trustedOrigins: [
    env.BETTER_AUTH_URL,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],

  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
