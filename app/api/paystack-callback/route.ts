/**
 * app/api/paystack-callback/route.ts
 *
 * Catches Paystack's POST redirect, extracts the reference parameters safely,
 * and passes them via a clean GET redirect back to the billing dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
// import type { NextRequest } from "next/request";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let reference = "";

  try {
    // 1. Try to parse parameters out of the incoming POST form data body
    const formData = await request.formData();
    reference = (formData.get("reference") as string) || "";
  } catch {
    try {
      // 2. Fallback: Try parsing as JSON if Paystack sends it as a raw object payload
      const json = await request.json();
      reference = json.reference || json.data?.reference || "";
    } catch {
      // 3. Last resort: Try extracting directly from the URL parameters strings
      const url = new URL(request.url);
      reference = url.searchParams.get("reference") || "";
    }
  }

  // Fallback to URL search string if still missing
  if (!reference) {
    const url = new URL(request.url);
    reference = url.searchParams.get("reference") || "";
  }

  // Build a clean target destination URL using standard GET properties
  const baseUrl = process.env.APP_URL || "https://www.libredebt.com";
  const redirectUrl = new URL("/settings", baseUrl);
  redirectUrl.searchParams.set("tab", "billing");
  redirectUrl.searchParams.set("status", "success");
  if (reference) {
    redirectUrl.searchParams.set("reference", reference);
  }

  // Bounce the user back using a clean standard GET redirection status line
  return NextResponse.redirect(redirectUrl.toString(), 303);
}

// Support standard GET requests just in case
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") || "";

  const baseUrl = process.env.APP_URL || "https://www.libredebt.com";
  const redirectUrl = new URL("/settings", baseUrl);
  redirectUrl.searchParams.set("tab", "billing");
  redirectUrl.searchParams.set("status", "success");
  if (reference) {
    redirectUrl.searchParams.set("reference", reference);
  }

  return NextResponse.redirect(redirectUrl.toString());
}
