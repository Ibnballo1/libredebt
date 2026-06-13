import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAuthClient } from "better-auth/client";

/**
 * Edge-Compatible Better-Auth Client instance.
 * Using "better-auth/client" keeps it lightweight and safe for the network proxy.
 */
const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

const PROTECTED_ROUTES = [
  "/overview",
  "/debts",
  "/payments",
  "/strategies",
  "/reminders",
  "/settings",
];

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

/**
 * Next.js Edge Network Proxy Handler
 * Explicitly typing 'request: NextRequest' eliminates the implicit 'any' compiler error.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Fast path fallback
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  /**
   * Safe Edge Cookie Inspection
   */
  const session = await authClient.getSession({
    fetchOptions: {
      headers: {
        "x-forwarded-host": request.headers.get("host") || "",
      },
    },
  });

  // ─── CASE A: Unauthenticated user targeting a protected resource ──────────
  if (!session && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── CASE B: Authenticated user attempting to revisit auth forms ──────────
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  return NextResponse.next();
}

/**
 * Route Matching Matrix Configuration
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
