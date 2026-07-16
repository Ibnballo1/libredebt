/**
 * app/api/mobile/receivables/route.ts
 * GET  — list all active receivables with current balances
 * POST — create a new receivable
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import {
  getActiveReceivablesByUserId,
  createReceivable,
} from "@/server/services/receivable.service";

export async function GET(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const receivables = await getActiveReceivablesByUserId(auth.user.id);
    return NextResponse.json({ receivables });
  } catch (error) {
    console.error("[mobile/receivables] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load receivables" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const body = await request.json();
    const result = await createReceivable(auth.user.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, receivableId: result.receivableId },
      { status: 201 },
    );
  } catch (error) {
    console.error("[mobile/receivables] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create receivable" },
      { status: 500 },
    );
  }
}
