/**
 * app/api/mobile/receivables/[id]/repayment/route.ts
 * POST — record a repayment on a receivable
 *
 * Body: { amount, effectiveDate, note? }
 * Auto-settles the receivable if balance reaches zero.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { recordRepayment } from "@/server/services/receivable.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    const result = await recordRepayment(auth.user.id, {
      receivableId: id,
      amount: body.amount,
      effectiveDate: body.effectiveDate,
      note: body.note,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      settled: result.settled,
      ledgerEntryId: result.ledgerEntryId,
    });
  } catch (error) {
    console.error("[mobile/receivables/[id]/repayment] error:", error);
    return NextResponse.json(
      { error: "Failed to record repayment" },
      { status: 500 },
    );
  }
}
