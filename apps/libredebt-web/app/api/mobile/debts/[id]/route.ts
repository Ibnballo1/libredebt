/**
 * app/api/mobile/debts/[id]/route.ts
 * GET — single debt with current balance
 * PUT — edit debt metadata (name, creditor, interest rate, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { getDebtById, editDebt } from "@/server/services/debt.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { id } = await params;
    const debt = await getDebtById(id, auth.user.id);

    if (!debt) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    return NextResponse.json({ debt });
  } catch (error) {
    console.error("[mobile/debts/[id]] GET error:", error);
    return NextResponse.json({ error: "Failed to load debt" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const result = await editDebt(auth.user.id, id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mobile/debts/[id]] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update debt" },
      { status: 500 },
    );
  }
}
