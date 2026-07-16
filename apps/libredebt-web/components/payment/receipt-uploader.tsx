/**
 * components/payment/receipt-uploader.tsx
 *
 * Handles the client-side receipt upload flow using your existing
 * getReceiptUploadUrlAction (R2 presigned URL approach):
 *
 *   1. User picks a file (drag-drop or click)
 *   2. Client validates type + size immediately (no round-trip)
 *   3. Calls getReceiptUploadUrlAction to get a presigned R2 URL
 *   4. Uploads the file directly from the browser to R2 (PUT to presigned URL)
 *   5. Calls onUpload(publicUrl) so the parent form can include the URL
 *      when submitting the payment record
 *
 * WHY DIRECT BROWSER → R2 UPLOAD?
 * The presigned URL pattern means the file never passes through your
 * Next.js server — it goes directly from the user's browser to R2.
 * This avoids Next.js request size limits and keeps your server lean.
 *
 * ACCEPTED FILES: JPG, PNG, WEBP, HEIC, PDF — max 5MB
 */

"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  FileText,
  Image,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { getReceiptUploadUrlAction } from "@/server/actions/storage.actions";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_SIZE_LABEL = "5MB";

type ReceiptUploaderProps = {
  /** Called with the public R2 URL once upload succeeds */
  onUpload: (publicUrl: string) => void;
  /** Called when the user removes the uploaded receipt */
  onRemove: () => void;
  /** Current uploaded URL (if any — e.g. when editing) */
  currentUrl?: string | null;
};

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf")
    return <FileText className="h-5 w-5 text-red-400" />;
  return <Image className="h-5 w-5 text-[#38BDF8]" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ReceiptUploader({
  onUpload,
  onRemove,
  currentUrl,
}: ReceiptUploaderProps) {
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">(
    currentUrl ? "done" : "idle",
  );
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Invalid file type. Accepted: JPG, PNG, WEBP, HEIC, PDF`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File too large (${formatBytes(file.size)}). Maximum: ${MAX_SIZE_LABEL}`;
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      setErrorMsg(null);

      const validationError = validateFile(file);
      if (validationError) {
        setErrorMsg(validationError);
        setState("error");
        return;
      }

      setState("uploading");

      try {
        // Step 1: Get presigned upload URL from R2
        const result = await getReceiptUploadUrlAction({
          filename: file.name,
          contentType: file.type,
        });

        if (!result?.data?.success || !result.data.presignedUrl) {
          throw new Error(result?.data?.error ?? "Could not get upload URL");
        }

        const { presignedUrl, publicUrl } = result.data;

        // Step 2: Upload file directly to R2 from the browser
        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed (${uploadRes.status})`);
        }

        // Step 3: Notify parent with the public URL
        setUploadedFile({ name: file.name, size: file.size, type: file.type });
        setState("done");
        onUpload(publicUrl);
        toast.success("Receipt uploaded");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setErrorMsg(msg);
        setState("error");
        toast.error("Receipt upload failed", { description: msg });
      }
    },
    [onUpload],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setState("idle");
    setErrorMsg(null);
    onRemove();
  };

  // ── Done state: show uploaded file info ──────────────────────────────────────
  if (state === "done" && (uploadedFile || currentUrl)) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#10B981]/30 bg-[#10B981]/5 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 text-[#10B981] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {uploadedFile ? (
            <>
              <p className="text-xs font-semibold text-[#0F172A] truncate">
                {uploadedFile.name}
              </p>
              <p className="text-[10px] text-[#64748B]">
                {formatBytes(uploadedFile.size)} · Receipt attached
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold text-[#0F172A]">
              Receipt attached
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="flex-shrink-0 rounded-md p-1 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
          title="Remove receipt"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // ── Uploading state ───────────────────────────────────────────────────────────
  if (state === "uploading") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
        <Loader2 className="h-4 w-4 text-[#10B981] animate-spin flex-shrink-0" />
        <p className="text-xs text-[#64748B]">Uploading receipt…</p>
      </div>
    );
  }

  // ── Idle / Error state: dropzone ──────────────────────────────────────────────
  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed",
          "px-4 py-5 cursor-pointer transition-all",
          dragOver
            ? "border-[#10B981] bg-[#10B981]/5"
            : state === "error"
              ? "border-red-200 bg-red-50/50"
              : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1] hover:bg-white",
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            state === "error" ? "bg-red-100" : "bg-[#E2E8F0]",
          )}
        >
          <Upload
            className={cn(
              "h-4 w-4",
              state === "error" ? "text-red-400" : "text-[#64748B]",
            )}
          />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-[#0F172A]">
            {dragOver ? "Drop to upload" : "Attach receipt (optional)"}
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">
            JPG, PNG, WEBP, HEIC or PDF · Max {MAX_SIZE_LABEL}
          </p>
        </div>
      </div>

      {errorMsg && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <X className="h-3 w-3 flex-shrink-0" />
          {errorMsg}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Upload receipt"
      />
    </div>
  );
}
