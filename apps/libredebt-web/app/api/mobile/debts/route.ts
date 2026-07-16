/**
 * app/api/mobile/debts/route.ts
 * GET  — list all active debts with current balances
 * POST — create a new debt
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import {
  getActiveDebtsByUserId,
  createDebt,
} from "@/server/services/debt.service";

export async function GET(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const debts = await getActiveDebtsByUserId(auth.user.id);
    return NextResponse.json({ debts });
  } catch (error) {
    console.error("[mobile/debts] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load debts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const body = await request.json();
    const result = await createDebt(auth.user.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, debtId: result.debtId },
      { status: 201 },
    );
  } catch (error) {
    console.error("[mobile/debts] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create debt" },
      { status: 500 },
    );
  }
}
