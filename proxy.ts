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
    const hasCallback = request.nextUrl.searchParams.has("callbackUrl");
    const isServerSideRedirect = request.headers.has("x-next-js-redirect");

    // If they are explicitly being sent here by requireUser() failing,
    // do NOT trap them. Let them see the login page to enter clean credentials.
    if (hasCallback || isServerSideRedirect) {
      return NextResponse.next();
    }

    // Otherwise, if they just manually typed /login while validly authenticated, send to dashboard
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // matcher: ["/((?!api|_next/static|_next/image|favicon.ico|api/webhooks|).*)"],
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
