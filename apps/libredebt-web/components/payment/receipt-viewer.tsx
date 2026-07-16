"use client";

import { useState } from "react";
import {
  Download,
  Trash2,
  X,
  ZoomIn,
  FileText,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { deleteReceiptAction } from "@/server/actions/receipt.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReceiptViewerProps = {
  receiptUrl: string;
  ledgerEntryId: string;
  debtId?: string;
  canDelete?: boolean;
};

function isPdf(url: string): boolean {
  return url.toLowerCase().includes(".pdf") || url.includes("application/pdf");
}

function getFilenameFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/");
    return parts[parts.length - 1] ?? "receipt";
  } catch {
    return "receipt";
  }
}

export function ReceiptViewer({
  receiptUrl,
  ledgerEntryId,
  debtId,
  canDelete = true,
}: ReceiptViewerProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isImage = !isPdf(receiptUrl);
  const filename = getFilenameFromUrl(receiptUrl);

  const { execute: deleteReceipt, isPending: isDeleting } = useAction(
    deleteReceiptAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Receipt deleted");
          setShowDeleteConfirm(false);
        } else {
          toast.error(data?.error ?? "Failed to delete receipt");
        }
      },
    },
  );

  // Cross-origin safe downloand handler
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const response = await fetch(receiptUrl, { method: "GET" });
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(
        "Could not download file. Please check bucket CORS configuration.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mt-2 w-2.5/5">
      {isImage ? (
        // ── Image receipt ────────────────────────────────────────────────────
        <div className="relative group inline-block">
          <img
            src={receiptUrl}
            alt="Payment receipt"
            crossOrigin="anonymous" // Tells the browser to request CORS access
            className="h-20 w-28 rounded-lg object-cover border border-[#E2E8F0] cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowFullscreen(true)}
            onError={(e) => {
              console.error("Image failed to load:", receiptUrl);
            }}
          />
          {/* Expand icon overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 group-hover:bg-black/20 transition-all cursor-pointer"
            onClick={() => setShowFullscreen(true)}
          >
            <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Action buttons */}
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F172A] text-white hover:bg-[#1E293B] transition-colors disabled:opacity-50"
              title="Download receipt"
            >
              {isDownloading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                title="Delete receipt"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ) : (
        // ── PDF receipt ──────────────────────────────────────────────────────
        <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
            <FileText className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0F172A] truncate">
              {filename}
            </p>
            <p className="text-[10px] text-[#94A3B8]">PDF Receipt</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
              title="View PDF"
            >
              <Eye className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50"
              title="Download PDF"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-red-100 text-red-400 hover:bg-red-50 transition-colors"
                title="Delete receipt"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen image viewer */}
      {isImage && (
        <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            {/* 1. Add an accessible description for screen readers */}
            {/* If your UI framework includes a "sr-only" class, use it to hide the text visually */}
            <div className="sr-only opacity-0 absolute w-px h-px p-0 m-[-1px] overflow-hidden whitespace-nowrap border-0">
              <DialogDescription>
                View and download your uploaded payment receipt image.
              </DialogDescription>
            </div>

            <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-[#E2E8F0]">
              <DialogTitle className="text-sm font-semibold">
                Receipt
              </DialogTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] px-3 py-1.5 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  Download
                </button>
                <button
                  onClick={() => setShowFullscreen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#F1F5F9] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </DialogHeader>

            <div className="p-4 flex items-center justify-center bg-[#F8FAFC] min-h-[300px] max-h-[70vh] overflow-auto">
              <img
                src={receiptUrl}
                alt="Payment receipt"
                crossOrigin="anonymous"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-700 mb-2">
            Delete this receipt? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteReceipt({ ledgerEntryId, debtId })}
              disabled={isDeleting}
              className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isDeleting && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {isDeleting ? "Deleting…" : "Delete receipt"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
