/**
 * app/api/mobile/debts/[id]/payment/route.ts
 * POST — record a payment against a debt
 *
 * Body: { amount, effectiveDate, note?, receiptUrl? }
 * amount is a decimal string e.g. "1500.00" (service converts to minor units)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { recordPayment } from "@/server/services/debt.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    // Merge the debtId from the URL into the input object
    const result = await recordPayment(auth.user.id, {
      debtId: id,
      amount: body.amount,
      effectiveDate: body.effectiveDate,
      note: body.note,
      receiptUrl: body.receiptUrl,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ledgerEntryId: result.ledgerEntryId,
    });
  } catch (error) {
    console.error("[mobile/debts/[id]/payment] error:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 },
    );
  }
}
