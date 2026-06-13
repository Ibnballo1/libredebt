/**
 * app/api/auth/[...all]/route.ts — BetterAuth HTTP Handler
 *
 * This single route handles ALL auth-related HTTP requests:
 *   POST /api/auth/sign-in/email         — email/password login
 *   POST /api/auth/sign-up/email         — registration
 *   POST /api/auth/sign-out              — logout
 *   GET  /api/auth/sign-in/google        — Google OAuth redirect
 *   GET  /api/auth/callback/google       — Google OAuth callback
 *   GET  /api/auth/get-session           — fetch current session
 *   POST /api/auth/verify-email          — email verification
 *   POST /api/auth/reset-password        — password reset
 *
 * The [...all] catch-all means BetterAuth handles its own routing
 * internally — we don't define separate routes for each endpoint.
 *
 * WHY A ROUTE HANDLER INSTEAD OF MIDDLEWARE:
 * OAuth flows require server-side redirects and token exchange that
 * must happen in a proper route handler, not middleware. Middleware
 * handles route protection; this file handles auth actions.
 */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * toNextJsHandler converts BetterAuth's handler to Next.js App Router format.
 * It exports named GET and POST handlers as required by the App Router.
 */
export const { GET, POST } = toNextJsHandler(auth);
