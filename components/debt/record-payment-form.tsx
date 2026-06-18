/**
 * components/debt/record-payment-form.tsx
 *
 * Inline form for recording a payment against a specific debt.
 * Used on the debt detail page (/debts/[id]).
 *
 * Shows the current balance and prevents overpayment (service-level guard).
 * The live currency preview shows the formatted amount as the user types.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { recordPaymentAction } from "@/server/actions/debt.actions";
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
  type RecordPaymentFormValues = Omit<RecordPaymentInput, "note"> & {
    note?: string;
  };

  const today = new Date().toISOString().split("T")[0]!;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      debtId,
      effectiveDate: today,
      amount: "",
      note: "",
    },
  });

  const watchedAmount = watch("amount");

  const { execute, isPending } = useAction(recordPaymentAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Payment recorded", {
          description: "Your ledger has been updated.",
        });
        reset({ debtId, effectiveDate: today, amount: "", note: "" });
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
        setServerError(null);
        execute(data);
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

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full rounded-lg bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white",
          "transition-all hover:bg-[#059669]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50",
          "flex items-center justify-center gap-2",
        )}
      >
        {isPending ? (
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
