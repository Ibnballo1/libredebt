/**
 * lib/csv.ts — Lightweight CSV Builder
 *
 * No external dependencies. Builds a valid RFC 4180 CSV string.
 *
 * RFC 4180 rules applied:
 *   - Fields containing commas, double-quotes, or newlines are wrapped
 *     in double-quotes
 *   - Double-quotes inside a field are escaped by doubling them
 *   - Line endings are CRLF per the spec
 *   - First row is the header
 */

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCell).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  return lines.join("\r\n");
}

export function csvResponse(content: string, filename: string): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
