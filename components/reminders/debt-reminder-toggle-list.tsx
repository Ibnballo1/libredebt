/**
 * components/reminders/debt-reminder-toggle-list.tsx
 *
 * Lets a Pro user enable/disable reminders per individual debt.
 * Shows a professional "Overdue" indicator if the due day has passed this month.
 */

"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { toggleDebtReminderAction } from "@/server/actions/reminder.actions";
import { cn } from "@/lib/utils";

type DebtForToggle = {
  id: string;
  name: string;
  creditor: string;
  dueDay: number | null;
};

function MiniToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50",
        checked ? "bg-[#10B981]" : "bg-[#E2E8F0]",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

export function DebtReminderToggleList({ debts }: { debts: DebtForToggle[] }) {
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(
    Object.fromEntries(debts.map((d) => [d.id, !!d.dueDay])),
  );

  const { execute, isPending } = useAction(toggleDebtReminderAction, {
    onSuccess: ({ data }) => {
      if (!data?.success) {
        toast.error(data?.error ?? "Failed to update reminder");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  // ─── The Missing Function Restored ──────────────────────────────────────────
  function handleToggle(debt: DebtForToggle) {
    if (!debt.dueDay) {
      toast.error("Set a due day on this debt first", {
        description: "Reminders need a due date to know when to fire.",
      });
      return;
    }

    const next = !enabledMap[debt.id];
    setEnabledMap((prev) => ({ ...prev, [debt.id]: next }));
    execute({ debtId: debt.id, enabled: next });
  }

  if (debts.length === 0) return null;

  const today = new Date().getDate();

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
          Per-debt reminders
        </p>
        <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
          Control reminders for each debt individually
        </p>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {debts.map((debt) => {
          const isOverdue = debt.dueDay !== null && debt.dueDay < today;

          return (
            <div key={debt.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">
                    {debt.name}
                  </p>

                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                      <AlertCircle className="h-3 w-3" />
                      Overdue
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {debt.dueDay
                    ? `Due ${debt.dueDay}th of month`
                    : "No due day set"}
                </p>
              </div>

              <MiniToggle
                checked={!!enabledMap[debt.id]}
                onChange={() => handleToggle(debt)}
                disabled={isPending}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
