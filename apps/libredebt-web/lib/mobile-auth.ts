/**
 * lib/mobile-auth.ts — Auth helper for /api/mobile/* route handlers
 *
 * WHY THIS EXISTS INSTEAD OF requireUser():
 * The existing requireUser() calls redirect("/login") when there's no
 * session. In Server Components and Server Actions that's correct — it
 * produces a Next.js redirect the browser follows. But in Route Handlers
 * called by the mobile app, a 307 redirect is useless — the app expects
 * a JSON 401. This helper returns a proper JSON error response instead.
 *
 * HOW BEARER TOKEN AUTH WORKS WITH BETTERAUTH:
 * BetterAuth stores sessions in the database and identifies them via a
 * session token. On the web, this token travels as a cookie. On mobile,
 * we send it as:
 *   Authorization: Bearer <token>
 *
 * BetterAuth's auth.api.getSession() reads from request headers. We
 * reconstruct a Cookie header from the Bearer token so BetterAuth can
 * validate it against the sessions table — same lookup, different
 * transport mechanism.
 *
 * The session token name defaults to "better-auth.session_token" for
 * BetterAuth. Check your lib/auth.ts config for the exact cookie name
 * if you customized it.
 *
 * USAGE IN ROUTE HANDLERS:
 *   const authResult = await requireMobileUser(request)
 *   if (authResult instanceof NextResponse) return authResult  // 401
 *   const { user } = authResult
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, type User } from "@/lib/auth"; // 👈 Imported User type from your config

const SESSION_COOKIE_NAME = "better-auth.session_token";

// 👈 Changed { user: any } to { user: User }
export type MobileAuthResult = { user: User } | NextResponse;

/**
 * Extracts and validates a Bearer token from the Authorization header.
 * Returns the user object on success, or a 401 NextResponse on failure.
 */
export async function requireMobileUser(
  request: NextRequest,
): Promise<MobileAuthResult> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    // Feed the Bearer token to BetterAuth as a cookie so it can
    // look it up in the sessions table via its normal validation path.
    const headers = new Headers(request.headers);
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 },
      );
    }

    return { user: session.user };
  } catch (error) {
    console.error("[mobile-auth] Session validation error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 },
    );
  }
}

/**
 * Type guard — use after requireMobileUser() to narrow the type.
 *
 * Example:
 *   const auth = await requireMobileUser(request)
 *   if (isUnauthorized(auth)) return auth
 *   const { user } = auth  // TypeScript now knows user exists
 */
export function isUnauthorized(
  result: MobileAuthResult,
): result is NextResponse {
  return result instanceof NextResponse;
}
