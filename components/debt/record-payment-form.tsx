/**
 * components/debt/record-payment-form.tsx
 */

"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { recordPaymentAction } from "@/server/actions/debt.actions";
import { getReceiptUploadUrlAction } from "@/server/actions/storage.actions"; // ◄ Added
import {
  recordPaymentSchema,
  type RecordPaymentInput,
} from "@/server/validators/debt.schema";
import { formatCurrency, cn } from "@/lib/utils";

type RecordPaymentFormProps = {
  debtId: string;
  currency: string;
  currentBalanceMinor: number;
  onSuccess?: () => void;
};

export function RecordPaymentForm({
  debtId,
  currency,
  currentBalanceMinor,
  onSuccess,
}: RecordPaymentFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type RecordPaymentFormValues = Omit<RecordPaymentInput, "note"> & {
    note?: string;
  };

  const today = new Date().toISOString().split("T")[0]!;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      debtId,
      effectiveDate: today,
      amount: "",
      note: "",
      receiptUrl: "", // ◄ Explicitly set default value
    },
  });

  const watchedAmount = watch("amount");
  const watchedReceiptUrl = watch("receiptUrl");

  const { execute: executeRecordPayment, isPending: isRecordPending } =
    useAction(recordPaymentAction, {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Payment recorded", {
            description: "Your ledger and receipt references are stored.",
          });
          reset({
            debtId,
            effectiveDate: today,
            amount: "",
            note: "",
            receiptUrl: "",
          });
          setUploadedFileName(null);
          setServerError(null);
          onSuccess?.();
        } else {
          setServerError(data?.error ?? "Failed to record payment.");
        }
      },
      onError: () => {
        setServerError("An unexpected error occurred.");
      },
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size limit (5MB limit safeguard for user inputs)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size limit exceeded", {
        description: "Receipt must be smaller than 5MB.",
      });
      return;
    }

    setUploadingFile(true);
    setServerError(null);

    try {
      // 1. Fetch secure token parameters
      const signatureResult = await getReceiptUploadUrlAction({
        filename: file.name,
        contentType: file.type,
      });

      if (!signatureResult?.data?.success) {
        throw new Error(
          signatureResult?.data?.error || "Signature generation aborted.",
        );
      }

      const { presignedUrl, publicUrl } = signatureResult.data;

      // 2. Transmit raw binary directly to Cloudflare R2 edge servers
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok)
        throw new Error("Cloudflare R2 validation rejected data transmission.");

      // 3. Inject returned URL directly back into reactive form engine state
      setValue("receiptUrl", publicUrl);
      setUploadedFileName(file.name);
      toast.success("Receipt verified and staged successfully.");
    } catch (err: Error) {
      setServerError(err?.message || "Failed uploading asset securely.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploadingFile(false);
    }
  };

  const labelClass =
    "block text-[10px] font-bold tracking-widest uppercase text-[#374151] mb-1.5";
  const fieldClass = (hasError: boolean) =>
    cn(
      "w-full rounded-lg border px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8]",
      "outline-none transition-colors",
      "focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20",
      hasError
        ? "border-red-300 bg-red-50/50"
        : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]",
    );

  return (
    <form
      onSubmit={handleSubmit((data) => {
        if (uploadingFile) {
          toast.error("File upload in progress", {
            description: "Please wait until image analysis finishes.",
          });
          return;
        }
        setServerError(null);
        executeRecordPayment(data);
      })}
      className="space-y-4"
      noValidate
    >
      {/* Balance context */}
      <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest uppercase text-[#94A3B8]">
          Current balance
        </span>
        <span className="text-sm font-bold text-[#0F172A] tabular-nums">
          {formatCurrency(currentBalanceMinor, { currency })}
        </span>
      </div>

      {/* Server error */}
      {serverError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5"
          role="alert"
        >
          <p className="text-xs text-red-700">{serverError}</p>
        </div>
      )}

      <input type="hidden" {...register("debtId")} />
      <input type="hidden" {...register("receiptUrl")} />

      {/* Amount + Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pay-amount" className={labelClass}>
            Amount <span className="text-red-400">*</span>
          </label>
          <input
            id="pay-amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
            className={cn(
              fieldClass(!!errors.amount),
              "font-mono tabular-nums",
            )}
          />
          {watchedAmount &&
            !isNaN(parseFloat(watchedAmount)) &&
            parseFloat(watchedAmount) > 0 && (
              <p className="mt-1 text-xs font-semibold text-[#10B981]">
                {formatCurrency(Math.round(parseFloat(watchedAmount) * 100), {
                  currency,
                })}
              </p>
            )}
          {errors.amount && (
            <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="pay-date" className={labelClass}>
            Payment date <span className="text-red-400">*</span>
          </label>
          <input
            id="pay-date"
            type="date"
            max={today}
            {...register("effectiveDate")}
            className={fieldClass(!!errors.effectiveDate)}
          />
          {errors.effectiveDate && (
            <p className="mt-1 text-xs text-red-500">
              {errors.effectiveDate.message}
            </p>
          )}
        </div>
      </div>

      {/* Note */}
      <div>
        <label htmlFor="pay-note" className={labelClass}>
          Note (optional)
        </label>
        <input
          id="pay-note"
          type="text"
          placeholder="e.g. Monthly salary deduction"
          {...register("note")}
          className={fieldClass(false)}
        />
      </div>

      {/* File Upload Input Wrapper — Styled Integration */}
      <div>
        <label className={labelClass}>
          Proof of Payment (Optional Receipt)
        </label>
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-4 text-center transition-colors flex flex-col items-center justify-center cursor-pointer",
            watchedReceiptUrl
              ? "border-[#10B981] bg-[#10B981]/5"
              : "border-[#E2E8F0] bg-white hover:border-[#10B981]/40",
          )}
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploadingFile || isRecordPending}
          />
          {uploadingFile ? (
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#10B981]/30 border-t-[#10B981]" />
              <span>Uploading asset to Cloudflare...</span>
            </div>
          ) : watchedReceiptUrl ? (
            <div className="text-sm text-[#10B981] font-medium truncate max-w-full px-2">
              ✓ {uploadedFileName || "Receipt ready!"}
            </div>
          ) : (
            <div className="text-xs text-[#6B7280]">
              <span className="font-semibold text-[#10B981]">
                Click to choose receipt file
              </span>{" "}
              or drag files here
              <p className="text-[10px] text-[#94A3B8] mt-0.5">
                Images or PDFs up to 5MB
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isRecordPending || uploadingFile}
        className="w-full rounded-lg bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isRecordPending ? (
          <>
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Recording…
          </>
        ) : (
          "Record payment"
        )}
      </button>
    </form>
  );
}
