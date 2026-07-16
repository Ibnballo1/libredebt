/**
 * app/api/mobile/debts/[id]/archive/route.ts
 * POST — archive a debt (soft-delete, preserves ledger history)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { archiveDebtById } from "@/server/services/debt.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { id } = await params;
    const result = await archiveDebtById(auth.user.id, id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mobile/debts/[id]/archive] error:", error);
    return NextResponse.json(
      { error: "Failed to archive debt" },
      { status: 500 },
    );
  }
}
