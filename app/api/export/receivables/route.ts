/**
 * app/api/export/receivables/route.ts
 *
 * GET /api/export/receivables?format=csv  → receivables.csv
 * GET /api/export/receivables?format=pdf  → receivables.pdf
 */

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { getReceivablesForExport } from "@/server/services/export.service";
import { buildCsv, csvResponse } from "@/lib/csv";
import { DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { DebtsPdf, ReceivablesPdf } from "@/lib/pdf-templates";
import React from "react";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const rows = await getReceivablesForExport(user.id);
  const filename = `libredebt-receivables-${new Date().toISOString().split("T")[0]}`;

  if (format === "pdf") {
    const pdfElement = React.createElement(ReceivablesPdf, {
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
    [
      "Name",
      "Debtor Name",
      "Phone",
      "Relationship",
      "Currency",
      "Status",
      "Original Amount",
      "Current Balance",
      "Amount Repaid",
      "Progress %",
      "Expected By",
    ],
    rows.map((r) => [
      r.name,
      r.debtorName,
      r.debtorPhone,
      r.debtorRelationship,
      r.currency,
      r.status,
      r.originalAmount,
      r.currentBalance,
      r.amountRepaid,
      r.progressPercent,
      r.expectedByDate,
    ]),
  );
  return csvResponse(csv, `${filename}.csv`);
}
