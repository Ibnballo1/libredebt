/**
 * app/api/mobile/profile/route.ts
 * GET — current user profile
 * PUT — update name and/or currency preference
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  return NextResponse.json({ user: auth.user });
}

export async function PUT(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const body = await request.json();
    const { name, currency } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 },
      );
    }

    await db
      .update(users)
      .set({
        name: name.trim(),
        ...(currency && typeof currency === "string" ? { currency } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mobile/profile] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
