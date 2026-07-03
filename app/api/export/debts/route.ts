/**
 * app/api/export/debts/route.ts
 */

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { getDebtsForExport } from "@/server/services/export.service";
import { buildCsv, csvResponse } from "@/lib/csv";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { DebtsPdf } from "@/lib/pdf-templates";
import React from "react";

export async function GET(request: NextRequest) {
  const user = await requireUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "csv";

  const rows = await getDebtsForExport(user.id);

  const filename = `libredebt-debts-${new Date().toISOString().split("T")[0]}`;

  // ✅ PDF EXPORT
  if (format === "pdf") {
    const pdfElement = React.createElement(DebtsPdf, {
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

  // ✅ CSV EXPORT
  const csv = buildCsv(
    [
      "Name",
      "Creditor",
      "Currency",
      "Status",
      "Original Amount",
      "Current Balance",
      "Amount Repaid",
      "Progress %",
      "Interest Rate",
      "Minimum Payment",
      "Due Day",
    ],
    rows.map((r) => [
      r.name,
      r.creditor,
      r.currency,
      r.status,
      r.originalAmount,
      r.currentBalance,
      r.amountRepaid,
      r.progressPercent,
      r.interestRatePercent,
      r.minimumPayment,
      r.dueDay,
    ]),
  );

  return csvResponse(csv, `${filename}.csv`);
}
