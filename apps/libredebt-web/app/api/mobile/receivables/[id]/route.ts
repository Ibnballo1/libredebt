/**
 * app/api/mobile/receivables/[id]/route.ts
 * GET — single receivable with current balance
 * PUT — edit receivable metadata
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import {
  getReceivableById,
  editReceivable,
} from "@/server/services/receivable.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { id } = await params;
    const receivable = await getReceivableById(id, auth.user.id);

    if (!receivable) {
      return NextResponse.json(
        { error: "Receivable not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ receivable });
  } catch (error) {
    console.error("[mobile/receivables/[id]] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load receivable" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const result = await editReceivable(auth.user.id, id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mobile/receivables/[id]] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update receivable" },
      { status: 500 },
    );
  }
}
