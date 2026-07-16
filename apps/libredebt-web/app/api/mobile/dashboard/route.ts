/**
 * app/api/mobile/dashboard/route.ts
 * GET — dashboard stats for the mobile overview screen
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { getDashboardStats } from "@/server/services/dashboard.service";

export async function GET(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const stats = await getDashboardStats(auth.user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[mobile/dashboard] error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 },
    );
  }
}
