/**
 * app/api/mobile/debts/[id]/ledger/route.ts
 * GET — full ledger history for a debt (most recent first)
 * Includes receiptUrl on each payment entry.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { getLedgerEntriesByDebtId } from "@/server/services/debt.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { id } = await params;
    const entries = await getLedgerEntriesByDebtId(id, auth.user.id);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[mobile/debts/[id]/ledger] error:", error);
    return NextResponse.json(
      { error: "Failed to load ledger" },
      { status: 500 },
    );
  }
}
