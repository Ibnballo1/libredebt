/**
 * lib/auth-client.ts — BetterAuth Client Instance
 *
 * This is the CLIENT-SIDE auth instance.
 * Import this in Client Components (anything with "use client").
 *
 * NEVER import lib/auth.ts in a Client Component.
 * lib/auth.ts contains secrets and DB connections — importing it
 * client-side would expose them to the browser bundle.
 *
 * This file is safe to import anywhere.
 *
 * WHAT THIS PROVIDES:
 *   authClient.signIn.email()      — email/password login
 *   authClient.signUp.email()      — registration
 *   authClient.signOut()           — logout
 *   authClient.signIn.social()     — OAuth login
 *   authClient.useSession()        — React hook for session state
 *   authClient.getSession()        — async session fetch (non-hook)
 *
 * USAGE IN A CLIENT COMPONENT:
 *   "use client"
 *   import { authClient } from "@/lib/auth-client"
 *
 *   const { data: session, isPending } = authClient.useSession()
 */
import { createAuthClient } from "better-auth/react";
import { env } from "@/lib/env";

export const authClient = createAuthClient({
  /**
   * The base URL of the auth API.
   * In development: http://localhost:3000
   * In production: your Vercel domain
   *
   * This must match BETTER_AUTH_URL in your server config.
   */
  baseURL: env.NEXT_PUBLIC_APP_URL,
});

/**
 * Named exports for convenience.
 * Import these directly instead of destructuring authClient each time.
 *
 * Usage:
 *   import { signIn, signOut, useSession } from "@/lib/auth-client"
 */
export const { signIn, signOut, signUp, useSession, getSession } = authClient;
