/**
 * app/api/export/payments/route.ts
 *
 * GET /api/export/payments?format=csv  → payments.csv
 * GET /api/export/payments?format=pdf  → payments.pdf
 */

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { getPaymentsForExport } from "@/server/services/export.service";
import { buildCsv, csvResponse } from "@/lib/csv";
import { DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { DebtsPdf, PaymentsPdf } from "@/lib/pdf-templates";
import React from "react";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const rows = await getPaymentsForExport(user.id);
  const filename = `libredebt-payments-${new Date().toISOString().split("T")[0]}`;

  if (format === "pdf") {
    const pdfElement = React.createElement(PaymentsPdf, {
      rows,
      userName: user.name,
    }) as React.ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(pdfElement);

    // ✅ Convert Buffer → Uint8Array (VERY IMPORTANT)
    const uint8Array = new Uint8Array(buffer);

    return new Response(uint8Array, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = buildCsv(
    ["Date", "Debt Name", "Creditor", "Currency", "Amount", "Type", "Note"],
    rows.map((r) => [
      r.date,
      r.debtName,
      r.creditor,
      r.currency,
      r.amount,
      r.type,
      r.note,
    ]),
  );
  return csvResponse(csv, `${filename}.csv`);
}
