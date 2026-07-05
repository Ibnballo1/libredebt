/**
 * components/debt/debt-form.tsx
 *
 * Shared form for creating and editing debts.
 * Used by both /debts/new and /debts/[id]/edit pages.
 *
 * SIGNATURE ELEMENT — Live currency preview:
 * As the user types an amount, a formatted display ("₦1,500.00")
 * appears immediately below the input field. This makes the
 * minor-unit conversion visible and builds trust in the numbers.
 *
 * MODE BEHAVIOUR:
 *   create mode: all fields editable, including original amount
 *   edit mode:   original amount is read-only (immutable after creation)
 *                shown as a locked display field with a padlock icon
 *
 * ERROR HANDLING:
 * Field-level errors appear below each input immediately on blur.
 * Server errors (from the action) appear as a toast + inline banner.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Lock, Info } from "lucide-react";
import {
  createDebtAction,
  editDebtAction,
} from "@/server/actions/debt.actions";
import {
  createDebtSchema,
  editDebtSchema,
  SUPPORTED_CURRENCIES,
  type CreateDebtInput,
  type EditDebtInput,
} from "@/server/validators/debt.schema";
import { formatCurrency, fromMinorUnits } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CreateMode = {
  mode: "create";
};

type EditMode = {
  mode: "edit";
  debtId: string;
  initialValues: {
    name: string;
    creditor: string;
    originalAmountMinor: number;
    interestRateBps: number;
    minimumPaymentMinor: number;
    dueDay: number | null;
    currency: string;
    notes?: string | null;
  };
};

type DebtFormProps = CreateMode | EditMode;

type DebtFormValues = {
  name: string;
  creditor: string;
  originalAmount?: string;
  interestRate?: string;
  minimumPayment?: string;
  dueDay?: string;
  currency?: string;
  notes?: string;
};

type CreateDebtActionInput = {
  name: string;
  creditor: string;
  originalAmount: string;
  interestRate?: string;
  minimumPayment?: string;
  dueDay?: string;
  currency?: string;
  notes?: string;
};

// ─── Shared field styles ──────────────────────────────────────────────────────

const fieldClass = (hasError: boolean) =>
  cn(
    "w-full rounded-lg border px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8]",
    "outline-none transition-colors font-mono tabular-nums",
    "focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20",
    hasError
      ? "border-red-300 bg-red-50/50"
      : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]",
  );

const labelClass =
  "block text-[10px] font-bold tracking-widest uppercase text-[#374151] mb-1.5";

// ─── Currency amount preview ──────────────────────────────────────────────────

function CurrencyPreview({
  value,
  currency,
}: {
  value: string;
  currency?: string;
}) {
  const num = parseFloat(value);
  if (!value || isNaN(num) || num <= 0) return null;

  const formatted = formatCurrency(Math.round(num * 100), { currency });

  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#10B981]">
      <span className="h-1 w-1 rounded-full bg-[#10B981]" aria-hidden="true" />
      {formatted}
    </p>
  );
}

// ─── Form field components ────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

type DebtFormErrors = FieldErrors<DebtFormValues>;

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-[10px] text-[#94A3B8]">
      <Info className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function DebtForm(props: DebtFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  // Derive default values based on mode
  const defaultValues = isEdit
    ? {
        name: props.initialValues.name,
        creditor: props.initialValues.creditor,
        interestRate:
          props.initialValues.interestRateBps > 0
            ? (props.initialValues.interestRateBps / 100).toFixed(2)
            : "",
        minimumPayment:
          props.initialValues.minimumPaymentMinor > 0
            ? fromMinorUnits(props.initialValues.minimumPaymentMinor)
            : "",
        dueDay: props.initialValues.dueDay?.toString() ?? "",
        currency: props.initialValues.currency,
        notes: props.initialValues.notes ?? "",
      }
    : {
        name: "",
        creditor: "",
        originalAmount: "",
        interestRate: "",
        minimumPayment: "",
        dueDay: "",
        currency: "NGN",
        notes: "",
      };

  const schema = isEdit ? editDebtSchema : createDebtSchema;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(schema) as Resolver<DebtFormValues>,
    defaultValues: defaultValues as DebtFormValues,
  });

  // Watch amount fields for the live preview
  const watchedAmount = watch(isEdit ? "name" : "originalAmount");
  const watchedMinimum = watch("minimumPayment");
  const watchedCurrency = watch("currency");
  const formErrors = errors as DebtFormErrors;

  const [serverError, setServerError] = useState<string | null>(null);

  // ── Create action hook ──────────────────────────────────────────────────────
  const { execute: executeCreate, isPending: isCreating } = useAction(
    createDebtAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Debt added", {
            description:
              "Your debt has been created and the opening balance recorded.",
          });
          router.push("/debts");
          router.refresh();
        } else if (
          data?.code === "LIMIT_REACHED" ||
          data?.code === "UPGRADE_REQUIRED"
        ) {
          setServerError(data.error ?? "Debt limit reached.");
          toast.error("Upgrade required", { description: data.error });
        } else {
          setServerError(data?.error ?? "Something went wrong.");
        }
      },
      onError: ({ error }) => {
        setServerError("An unexpected error occurred. Please try again.");
        console.error("[DebtForm] createDebtAction error:", error);
      },
    },
  );

  // ── Edit action hook ────────────────────────────────────────────────────────
  const { execute: executeEdit, isPending: isEditing } = useAction(
    editDebtAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Debt updated");
          router.push(`/debts/${(props as EditMode).debtId}`);
          router.refresh();
        } else {
          setServerError(data?.error ?? "Something went wrong.");
        }
      },
      onError: () => {
        setServerError("An unexpected error occurred. Please try again.");
      },
    },
  );

  const isPending = isCreating || isEditing;

  const onSubmit = useCallback(
    (data: DebtFormValues) => {
      setServerError(null);
      if (isEdit) {
        executeEdit({ debtId: (props as EditMode).debtId, ...data });
      } else {
        executeCreate(data as CreateDebtActionInput);
      }
    },
    [isEdit, executeCreate, executeEdit, props],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Server error banner */}
      {serverError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
          role="alert"
        >
          <p className="text-sm text-red-700">{serverError}</p>
          {serverError.includes("limit") && (
            <a
              href="/settings?tab=billing"
              className="mt-1 inline-block text-xs font-semibold text-[#10B981] hover:text-[#059669]"
            >
              Upgrade to Pro →
            </a>
          )}
        </div>
      )}

      {/* ── Row 1: Name + Creditor ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Debt name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. GTBank Credit Card"
            autoFocus={!isEdit}
            {...register("name")}
            className={fieldClass(!!errors.name)}
          />
          <FieldError message={errors.name?.message as string} />
        </div>

        <div>
          <label htmlFor="creditor" className={labelClass}>
            Creditor <span className="text-red-400">*</span>
          </label>
          <input
            id="creditor"
            type="text"
            placeholder="e.g. GTBank"
            {...register("creditor")}
            className={fieldClass(!!errors.creditor)}
          />
          <FieldError message={errors.creditor?.message as string} />
        </div>
      </div>

      {/* ── Row 2: Currency + Original amount ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="currency" className={labelClass}>
            Currency
          </label>
          <select
            id="currency"
            {...register("currency")}
            className={fieldClass(false)}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="originalAmount" className={labelClass}>
            Original amount <span className="text-red-400">*</span>
          </label>

          {isEdit ? (
            /* Locked field — original amount is immutable */
            <div className="relative">
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
                    { currency: watchedCurrency },
                  )}
                </span>
              </div>
              <FieldHint>
                Original amount is fixed. It is the historical baseline for
                progress tracking.
              </FieldHint>
            </div>
          ) : (
            /* Editable field for create mode */
            <div>
              <input
                id="originalAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register("originalAmount")}
                className={fieldClass(!!formErrors.originalAmount)}
              />
              <CurrencyPreview
                value={watchedAmount ?? ""}
                currency={watchedCurrency}
              />
              <FieldError message={formErrors.originalAmount?.message} />
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Interest rate + Minimum payment ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="interestRate" className={labelClass}>
            Annual interest rate (%)
          </label>
          <input
            id="interestRate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="e.g. 24.00"
            {...register("interestRate")}
            className={fieldClass(!!formErrors.interestRate)}
          />
          <FieldError message={formErrors.interestRate?.message} />
          <FieldHint>Leave blank if interest-free</FieldHint>
        </div>

        <div>
          <label htmlFor="minimumPayment" className={labelClass}>
            Minimum monthly payment
          </label>
          <input
            id="minimumPayment"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            {...register("minimumPayment")}
            className={fieldClass(!!formErrors.minimumPayment)}
          />
          <CurrencyPreview
            value={watchedMinimum ?? ""}
            currency={watchedCurrency}
          />
          <FieldError message={formErrors.minimumPayment?.message} />
        </div>
      </div>

      {/* ── Row 4: Due day ── */}
      <div className="max-w-[200px]">
        <label htmlFor="dueDay" className={labelClass}>
          Payment due day
        </label>
        <input
          id="dueDay"
          type="number"
          min="1"
          max="31"
          placeholder="e.g. 15"
          {...register("dueDay")}
          className={fieldClass(!!formErrors.dueDay)}
        />
        <FieldError message={formErrors.dueDay?.message} />
        <FieldHint>Day of month (1–31). Used for reminders.</FieldHint>
      </div>

      {/* ── Notes ── */}
      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="e.g. Salary deduction, speak to HR before overpaying"
          {...register("notes")}
          className={cn(
            fieldClass(!!formErrors.notes),
            "resize-none font-sans",
          )}
        />
        <FieldError message={formErrors.notes?.message} />
      </div>

      {/* ── Actions ── */}
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
            "inline-flex items-center gap-2 rounded-lg px-6 py-2.5",
            "text-sm font-semibold text-white transition-all",
            "bg-[#0F172A] hover:bg-[#1E293B]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/40",
          )}
        >
          {isPending ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {isEdit ? "Saving…" : "Adding debt…"}
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Add debt"
          )}
        </button>
      </div>
    </form>
  );
}
