/**
 * components/export/export-buttons.tsx
 *
 * Client component that renders CSV and PDF download buttons.
 * Uses window.open() on the export route handler URL — the browser
 * handles the download natively, no fetch/blob needed.
 *
 * Add this to the Debts, Payments, and Receivables page navbars.
 */

"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ExportType = "debts" | "payments" | "receivables";

type ExportButtonsProps = {
  type: ExportType;
  count: number;
};

const LABELS: Record<ExportType, string> = {
  debts: "Debts",
  payments: "Payments",
  receivables: "Receivables",
};

export function ExportButtons({ type, count }: ExportButtonsProps) {
  const [loading, setLoading] = useState<"csv" | "pdf" | null>(null);

  function handleExport(format: "csv" | "pdf") {
    setLoading(format);
    window.open(`/api/export/${type}?format=${format}`, "_blank");
    setTimeout(() => setLoading(null), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] hidden md:flex font-bold tracking-widest uppercase text-[#94A3B8] mr-1">
        Export
      </span>
      <button
        onClick={() => handleExport("csv")}
        disabled={loading !== null || count === 0}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white",
          "px-3 py-1.5 text-xs font-semibold text-[#0F172A] transition-colors",
          "hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed",
        )}
        title={
          count === 0
            ? "Nothing to export"
            : `Download ${count} ${LABELS[type].toLowerCase()} as CSV`
        }
      >
        {loading === "csv" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3 w-3 text-[#10B981]" />
        )}
        CSV
      </button>
      <button
        onClick={() => handleExport("pdf")}
        disabled={loading !== null || count === 0}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white",
          "px-3 py-1.5 text-xs font-semibold text-[#0F172A] transition-colors",
          "hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed",
        )}
        title={
          count === 0
            ? "Nothing to export"
            : `Download ${count} ${LABELS[type].toLowerCase()} as PDF`
        }
      >
        {loading === "pdf" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <FileText className="h-3 w-3 text-red-400" />
        )}
        PDF
      </button>
    </div>
  );
}
