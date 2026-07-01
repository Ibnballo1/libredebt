/**
 * components/receivable/record-repayment-form.tsx
 *
 * Mirrors components/debt/record-payment-form.tsx. Shows a celebratory
 * note when a repayment fully settles the receivable.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { recordRepaymentAction } from "@/server/actions/receivable.actions";
import {
  recordRepaymentSchema,
  type RecordRepaymentInput,
} from "@/server/validators/receivable.schema";
import { formatCurrency, cn } from "@/lib/utils";

type RecordRepaymentFormProps = {
  receivableId: string;
  currency: string;
  currentBalanceMinor: number;
  onSuccess?: () => void;
};

type RecordRepaymentFormValues = Omit<RecordRepaymentInput, "note"> & {
  note?: string;
};

export function RecordRepaymentForm({
  receivableId,
  currency,
  currentBalanceMinor,
  onSuccess,
}: RecordRepaymentFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0]!;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RecordRepaymentFormValues>({
    resolver: zodResolver(recordRepaymentSchema),
    defaultValues: { receivableId, effectiveDate: today, amount: "", note: "" },
  });

  const watchedAmount = watch("amount");

  const { execute, isPending } = useAction(recordRepaymentAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        if (data.settled) {
          toast.success("Fully repaid! 🎉", {
            description: "This receivable has been marked as settled.",
          });
        } else {
          toast.success("Repayment recorded");
        }
        reset({ receivableId, effectiveDate: today, amount: "", note: "" });
        setServerError(null);
        onSuccess?.();
      } else {
        setServerError(data?.error ?? "Failed to record repayment.");
      }
    },
    onError: () => setServerError("An unexpected error occurred."),
  });

  const labelClass =
    "block text-[10px] font-bold tracking-widest uppercase text-[#374151] mb-1.5";
  const fieldClass = (hasError: boolean) =>
    cn(
      "w-full rounded-lg border px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8]",
      "outline-none transition-colors focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20",
      hasError
        ? "border-red-300 bg-red-50/50"
        : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]",
    );

  return (
    <form
      onSubmit={handleSubmit((data) => {
        setServerError(null);
        execute({ ...data, note: data.note });
      })}
      className="space-y-4"
      noValidate
    >
      <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest uppercase text-[#94A3B8]">
          Still owed to you
        </span>
        <span className="text-sm font-bold text-[#0F172A] tabular-nums">
          {formatCurrency(currentBalanceMinor, { currency })}
        </span>
      </div>

      {serverError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5"
          role="alert"
        >
          <p className="text-xs text-red-700">{serverError}</p>
        </div>
      )}

      <input type="hidden" {...register("receivableId")} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="repay-amount" className={labelClass}>
            Amount received <span className="text-red-400">*</span>
          </label>
          <input
            id="repay-amount"
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
              <p className="mt-1 text-xs font-semibold text-[#38BDF8]">
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
          <label htmlFor="repay-date" className={labelClass}>
            Date received <span className="text-red-400">*</span>
          </label>
          <input
            id="repay-date"
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

      <div>
        <label htmlFor="repay-note" className={labelClass}>
          Note (optional)
        </label>
        <input
          id="repay-note"
          type="text"
          placeholder="e.g. Paid via bank transfer"
          {...register("note")}
          className={fieldClass(false)}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full rounded-lg bg-[#38BDF8] px-4 py-2.5 text-sm font-semibold text-white",
          "transition-all hover:bg-[#0EA5E9] disabled:opacity-50 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2",
        )}
      >
        {isPending ? (
          <>
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Recording…
          </>
        ) : (
          "Record repayment"
        )}
      </button>
    </form>
  );
}
