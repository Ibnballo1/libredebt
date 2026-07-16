/**
 * components/receivable/receivable-form.tsx
 *
 * Mirrors components/debt/debt-form.tsx's structure and the live
 * currency-preview pattern, with fields swapped for the debtor's
 * contact info instead of creditor/interest/minimum-payment.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Lock, Info } from "lucide-react";
import { z } from "zod";
import {
  createReceivableAction,
  editReceivableAction,
} from "@/server/actions/receivable.actions";
import {
  createReceivableSchema,
  editReceivableSchema,
} from "@/server/validators/receivable.schema";
import { SUPPORTED_CURRENCIES } from "@/server/validators/debt.schema";
import { formatCurrency, cn } from "@/lib/utils";

type CreateMode = { mode: "create" };
type EditMode = {
  mode: "edit";
  receivableId: string;
  initialValues: {
    name: string;
    debtorName: string;
    debtorPhone: string | null;
    debtorRelationship: string | null;
    originalAmountMinor: number;
    currency: string;
    expectedByDate: Date | null;
    notes: string | null;
  };
};
type ReceivableFormProps = CreateMode | EditMode;

type CreateFormValues = z.infer<typeof createReceivableSchema>;
type EditFormValues = z.infer<typeof editReceivableSchema>;
// Combined fallback typing signature structure for form tracking state
type FormValues = CreateFormValues & EditFormValues;

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

function CurrencyPreview({
  value,
  currency,
}: {
  value: string | undefined;
  currency: string;
}) {
  if (!value) return null;
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#10B981]">
      <span className="h-1 w-1 rounded-full bg-[#10B981]" />
      {formatCurrency(Math.round(num * 100), { currency })}
    </p>
  );
}

export function ReceivableForm(props: ReceivableFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const defaultValues = isEdit
    ? {
        name: props.initialValues.name,
        debtorName: props.initialValues.debtorName,
        debtorPhone: props.initialValues.debtorPhone ?? "",
        debtorRelationship: props.initialValues.debtorRelationship ?? "",
        currency: props.initialValues.currency,
        expectedByDate: props.initialValues.expectedByDate
          ? new Date(props.initialValues.expectedByDate)
              .toISOString()
              .split("T")[0]
          : "",
        notes: props.initialValues.notes ?? "",
      }
    : {
        name: "",
        debtorName: "",
        debtorPhone: "",
        debtorRelationship: "",
        originalAmount: "",
        currency: "NGN",
        expectedByDate: "",
        notes: "",
      };

  const schema = isEdit ? editReceivableSchema : createReceivableSchema;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    // Fixed: Coerce via unknown first for intentionally incompatible generic overlap
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: defaultValues as unknown as FormValues,
  });

  const watchedAmount = watch("originalAmount");
  const watchedCurrency = watch("currency");
  const [serverError, setServerError] = useState<string | null>(null);

  const { execute: executeCreate, isPending: isCreating } = useAction(
    createReceivableAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Receivable added", {
            description: "The opening balance has been recorded.",
          });
          router.push("/receivables");
          router.refresh();
        } else {
          setServerError(data?.error ?? "Something went wrong.");
        }
      },
      onError: () =>
        setServerError("An unexpected error occurred. Please try again."),
    },
  );

  const { execute: executeEdit, isPending: isEditing } = useAction(
    editReceivableAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Receivable updated");
          router.push(`/receivables/${(props as EditMode).receivableId}`);
          router.refresh();
        } else {
          setServerError(data?.error ?? "Something went wrong.");
        }
      },
      onError: () =>
        setServerError("An unexpected error occurred. Please try again."),
    },
  );

  const isPending = isCreating || isEditing;

  function onSubmit(data: FormValues) {
    setServerError(null);
    if (isEdit) {
      executeEdit({ receivableId: (props as EditMode).receivableId, ...data });
    } else {
      executeCreate(data);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
          role="alert"
        >
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>
          Label <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g. Loan to Chidi for rent"
          autoFocus={!isEdit}
          {...register("name")}
          className={fieldClass(!!errors.name)}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="debtorName" className={labelClass}>
            Their name <span className="text-red-400">*</span>
          </label>
          <input
            id="debtorName"
            type="text"
            placeholder="e.g. Chidi Eze"
            {...register("debtorName")}
            className={fieldClass(!!errors.debtorName)}
          />
          {errors.debtorName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.debtorName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="debtorPhone" className={labelClass}>
            Their phone (optional)
          </label>
          <input
            id="debtorPhone"
            type="tel"
            placeholder="e.g. 0803 123 4567"
            {...register("debtorPhone")}
            className={fieldClass(!!errors.debtorPhone)}
          />
          {errors.debtorPhone && (
            <p className="mt-1 text-xs text-red-500">
              {errors.debtorPhone.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="debtorRelationship" className={labelClass}>
            Relationship (optional)
          </label>
          <input
            id="debtorRelationship"
            type="text"
            placeholder="e.g. Brother, Coworker, Friend"
            {...register("debtorRelationship")}
            className={fieldClass(!!errors.debtorRelationship)}
          />
          {errors.debtorRelationship && (
            <p className="mt-1 text-xs text-red-500">
              {errors.debtorRelationship.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="currency" className={labelClass}>
            Currency
          </label>
          <select
            id="currency"
            {...register("currency")}
            className={fieldClass(!!errors.currency)}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.currency && (
            <p className="mt-1 text-xs text-red-500">
              {errors.currency.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="originalAmount" className={labelClass}>
            Amount {!isEdit && <span className="text-red-400">*</span>}
          </label>
          {isEdit ? (
            <div>
              <div
                className={cn(
                  fieldClass(false),
                  "flex items-center gap-2 bg-[#F8FAFC] cursor-not-allowed",
                )}
              >
                <Lock className="h-3.5 w-3.5 text-[#94A3B8] flex-shrink-0" />
                <span className="text-[#64748B]">
                  {formatCurrency(
                    (props as EditMode).initialValues.originalAmountMinor,
                    {
                      currency: watchedCurrency,
                    },
                  )}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-[#94A3B8]">
                <Info className="h-2.5 w-2.5 flex-shrink-0" />
                The original amount is fixed — it&apos;s the baseline for
                tracking repayment.
              </p>
            </div>
          ) : (
            <div>
              <input
                id="originalAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register("originalAmount")}
                className={fieldClass(!!errors.originalAmount)}
              />
              <CurrencyPreview
                value={watchedAmount}
                currency={watchedCurrency}
              />
              {errors.originalAmount && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.originalAmount.message}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="expectedByDate" className={labelClass}>
            Expected by (optional)
          </label>
          <input
            id="expectedByDate"
            type="date"
            {...register("expectedByDate")}
            className={fieldClass(!!errors.expectedByDate)}
          />
          {errors.expectedByDate && (
            <p className="mt-1 text-xs text-red-500">
              {errors.expectedByDate.message}
            </p>
          )}
          <p className="mt-1 text-[10px] text-[#94A3B8]">
            Leave blank if there&apos;s no fixed date
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="e.g. Lent for emergency car repair"
          {...register("notes")}
          className={cn(fieldClass(!!errors.notes), "resize-none")}
        />
        {errors.notes && (
          <p className="mt-1 text-xs text-red-500">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || (isEdit && !isDirty)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all",
            "bg-[#0F172A] hover:bg-[#1E293B]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isPending ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {isEdit ? "Saving…" : "Adding…"}
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Add receivable"
          )}
        </button>
      </div>
    </form>
  );
}
