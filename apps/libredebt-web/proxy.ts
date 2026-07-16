// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// const PROTECTED_ROUTES = [
//   "/overview",
//   "/debts",
//   "/payments",
//   "/strategies",
//   "/reminders",
//   "/simulations",
//   "/analytics",
//   "/settings",
//   "/help",
//   "/admin",
// ];

// const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// export async function proxy(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // ─── RULE 1: ABSOLUTE SYSTEM EXCLUSIONS ────────────────────────────────────
//   if (
//     pathname.startsWith("/_next") ||
//     pathname.startsWith("/api") || // Completely skips all auth endpoints/callbacks
//     pathname === "/favicon.ico" ||
//     pathname.includes(".")
//   ) {
//     return NextResponse.next();
//   }

//   // Temporary landing page pass-through rule
//   if (pathname === "/") {
//     return NextResponse.next();
//   }

//   const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
//     pathname.startsWith(route),
//   );
//   const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

//   // Fast-path escape window
//   if (!isProtectedRoute && !isAuthRoute) {
//     return NextResponse.next();
//   }

//   // ─── RULE 2: LIGHTWEIGHT COOKIE CHECK (Zero Network/DB Overhead) ───────────
//   // Better-Auth stores its token in a cookie. Default name is "better-auth.session_token"
//   const sessionToken =
//     request.cookies.get("better-auth.session_token")?.value ||
//     request.cookies.get("__Secure-better-auth.session_token")?.value; // Production fallback

//   console.log("SessionToken in middleware", sessionToken);
//   const isAuthenticated = !!sessionToken;

//   // CASE A: Unauthenticated user targeting a secure private route -> Instant Redirect
//   if (!isAuthenticated && isProtectedRoute) {
//     const loginUrl = new URL("/login", request.url);
//     loginUrl.searchParams.set("callbackUrl", pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   // CASE B: Authenticated user attempting to access login/register -> Instant Redirect
//   if (isAuthenticated && isAuthRoute) {
//     return NextResponse.redirect(new URL("/overview", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
// };

// // middleware.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { auth } from "@/lib/auth"; // Ensure this points to your Better-Auth instance

// const PROTECTED_ROUTES = [
//   "/overview",
//   "/debts",
//   "/payments",
//   "/strategies",
//   "/reminders",
//   "/simulations",
//   "/analytics",
//   "/settings",
// ];
// const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// export async function proxy(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   if (
//     pathname.startsWith("/_next") ||
//     pathname.startsWith("/api") ||
//     pathname === "/favicon.ico" ||
//     pathname.includes(".") ||
//     pathname === "/"
//   ) {
//     return NextResponse.next();
//   }

//   const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
//     pathname.startsWith(route),
//   );
//   const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

//   if (!isProtectedRoute && !isAuthRoute) {
//     return NextResponse.next();
//   }

//   // ─── CRITICAL FIX: Make sure the session actually exists in the DB ───
//   const session = await auth.api.getSession({
//     headers: request.headers, // Passes cookies and context safely
//   });

//   const isAuthenticated = !!session;

//   // CASE A: User is not authenticated but trying to access a secure route
//   if (!isAuthenticated && isProtectedRoute) {
//     const loginUrl = new URL("/login", request.url);
//     loginUrl.searchParams.set("callbackUrl", pathname);

//     const response = NextResponse.redirect(loginUrl);
//     // Clean up ghost cookies to prevent future loops
//     response.cookies.delete("better-auth.session_token");
//     response.cookies.delete("__Secure-better-auth.session_token");
//     return response;
//   }

//   // CASE B: User is authenticated but trying to access login/register
//   if (isAuthenticated && isAuthRoute) {
//     return NextResponse.redirect(new URL("/overview", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks|api/mobile|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
//   ],
// };

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
