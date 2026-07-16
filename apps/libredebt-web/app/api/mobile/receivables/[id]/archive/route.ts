/**
 * app/api/mobile/receivables/[id]/archive/route.ts
 * POST — archive a receivable (mark as uncollectable)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { archiveReceivable } from "@/server/services/receivable.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { id } = await params;
    const result = await archiveReceivable(auth.user.id, id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mobile/receivables/[id]/archive] error:", error);
    return NextResponse.json(
      { error: "Failed to archive receivable" },
      { status: 500 },
    );
  }
}
