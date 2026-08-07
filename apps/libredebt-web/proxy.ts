// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Keep /admin in the protected routes list!
const PROTECTED_ROUTES = [
  "/overview",
  "/debts",
  "/payments",
  "/strategies",
  "/reminders",
  "/simulations",
  "/analytics",
  "/settings",
  "/admin", // <-- Added back
];

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── RULE 1: ABSOLUTE SYSTEM EXCLUSIONS ────────────────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Fast-path escape window
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // ─── RULE 2: LIGHTWEIGHT COOKIE CHECK (Zero Database Overhead) ───────────
  // Better-Auth stores its token in a cookie.
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthenticated = !!sessionToken;

  // CASE A: Unauthenticated user targeting a secure private route -> Instant Redirect
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // CASE B: Authenticated user attempting to access login/register -> Instant Redirect
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks|api/mobile|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
