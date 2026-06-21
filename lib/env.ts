/**
 * lib/env.ts — Type-safe environment variable validation
 *
 * Uses @t3-oss/env-nextjs to validate ALL environment variables at build time.
 * If a required variable is missing, the build fails immediately with a clear
 * error message — not a cryptic runtime crash at 2am in production.
 *
 * WHY THIS MATTERS FOR FINTECH:
 * A missing BETTER_AUTH_SECRET means sessions are unsigned and forgeable.
 * A missing DATABASE_URL means every query silently fails.
 * Failing loudly at build time is infinitely better than failing silently
 * in production with user data at risk.
 *
 * USAGE:
 *   import { env } from "@/lib/env"
 *   env.DATABASE_URL        // type: string (guaranteed non-null)
 *   env.NEXT_PUBLIC_SUPABASE_URL  // available in client components too
 *
 * Do NOT use process.env directly in application code.
 * Always import from this file for type safety.
 */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables.
   * These are NEVER exposed to the browser.
   * Accessing these in Client Components will throw at build time.
   */
  server: {
    // ─── Database ─────────────────────────────────────────────────────
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),

    // ─── Supabase (server-only) ────────────────────────────────────────
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

    // ─── BetterAuth ───────────────────────────────────────────────────
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),

    // ─── Google OAuth ─────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

    // ─── Stage 2: Resend (optional until Stage 2) ─────────────────────
    RESEND_API_KEY: z.string().min(1).optional(),

    // ─── Stage 5: Paystack (optional until Stage 5) ───────────────────
    PAYSTACK_SECRET_KEY: z.string().min(1).optional(),

    // ─── Stage 5: Stripe (optional until Stage 5) ────────────────────
    // STRIPE_SECRET_KEY: z.string().min(1).optional(),

    // ─── Runtime ──────────────────────────────────────────────────────
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Client-side environment variables.
   * Must be prefixed with NEXT_PUBLIC_.
   * These ARE exposed to the browser — never put secrets here.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

    // Stage 5
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  },

  /**
   * Destructure from process.env here.
   * This is required by @t3-oss/env-nextjs — it cannot use process.env
   * directly due to Next.js's static analysis of env var usage.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    // STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },

  /**
   * Skip validation during builds if needed (e.g., Vercel preview builds
   * that don't have all env vars set yet).
   * Set SKIP_ENV_VALIDATION=1 in Vercel build settings for preview branches.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Makes it so that empty strings are treated as undefined.
   * Prevents bugs where someone sets DATABASE_URL="" and it passes validation.
   */
  emptyStringAsUndefined: true,
});
