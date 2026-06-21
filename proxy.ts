import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/overview",
  "/debts",
  "/payments",
  "/strategies",
  "/reminders",
  "/settings",
];

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── RULE 1: ABSOLUTE SYSTEM EXCLUSIONS ────────────────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") || // Completely skips all auth endpoints/callbacks
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Temporary landing page pass-through rule
  if (pathname === "/") {
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

  // ─── RULE 2: LIGHTWEIGHT COOKIE CHECK (Zero Network/DB Overhead) ───────────
  // Better-Auth stores its token in a cookie. Default name is "better-auth.session_token"
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value; // Production fallback

  const isAuthenticated = !!sessionToken;

  // CASE A: Unauthenticated user targeting a secure private route -> Instant Redirect
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // CASE B: Authenticated user attempting to access login/register
  if (isAuthenticated && isAuthRoute) {
    // ONLY redirect to overview if they aren't explicitly being thrown back here via a clearance sign
    const hasCallback = request.nextUrl.searchParams.has("callbackUrl");

    if (!hasCallback) {
      return NextResponse.redirect(new URL("/overview", request.url));
    }

    // If a callbackUrl is present, it means a server-side route explicitly rejected their session.
    // Allow the request to pass through to /login so they can re-authenticate.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // matcher: ["/((?!api|_next/static|_next/image|favicon.ico|api/webhooks|).*)"],
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
