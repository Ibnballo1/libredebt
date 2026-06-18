/**
 * components/debt/debt-card.tsx
 *
 * A single debt card in the debt list.
 * Shows: name, creditor, balance, progress bar, due day.
 * The left-border color encodes urgency (green=healthy, amber=due soon, red=overdue).
 *
 * Client component — needs the archive confirmation dialog.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Archive, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { archiveDebtAction } from "@/server/actions/debt.actions";
import {
  formatCurrency,
  calculateProgressPercent,
  fromMinorUnits,
  cn,
} from "@/lib/utils";

export type DebtCardData = {
  id: string;
  name: string;
  creditor: string;
  originalAmountMinor: number;
  currentBalanceMinor: number;
  minimumPaymentMinor: number;
  dueDay: number | null;
  currency: string;
  status: "active" | "archived" | "paused" | "settled";
};

function getDebtColor(progressPct: number): string {
  if (progressPct >= 75) return "#10B981";
  if (progressPct >= 25) return "#F59E0B";
  return "#EF4444";
}

export function DebtCard({ debt }: { debt: DebtCardData }) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const progressPct = calculateProgressPercent(
    debt.originalAmountMinor,
    debt.currentBalanceMinor,
  );
  const accentColor = getDebtColor(progressPct);

  const { execute: executeArchive, isPending: isArchiving } = useAction(
    archiveDebtAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Debt archived", {
            description: `${debt.name} has been archived. Your payment history is preserved.`,
          });
          setShowArchiveDialog(false);
        } else {
          toast.error(data?.error ?? "Failed to archive debt.");
        }
      },
    },
  );

  return (
    <>
      <article
        className="group relative rounded-xl border border-[#E2E8F0] bg-white shadow-sm transition-shadow hover:shadow-md"
        style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
        aria-label={`${debt.name} — ${formatCurrency(debt.currentBalanceMinor, { currency: debt.currency })} remaining`}
      >
        <div className="p-5">
          {/* Top row: name + actions */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1 relative z-10">
              <Link
                href={`/debts/${debt.id}`}
                className="block text-sm font-semibold text-[#0F172A] hover:text-[#10B981] transition-colors truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50 rounded"
              >
                {debt.name}
              </Link>
              <p className="text-xs text-[#64748B] mt-0.5">{debt.creditor}</p>
            </div>

            {/* Action menu — Added relative z-10 context stack layer to bypass full-card clickable overlays */}
            <div className="relative z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Actions for ${debt.name}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/debts/${debt.id}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      View details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/debts/${debt.id}/edit`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit debt
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                    onClick={() => setShowArchiveDialog(true)}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Balance row */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-0.5">
                Remaining
              </p>
              <p className="text-xl font-bold text-[#0F172A] tabular-nums">
                {formatCurrency(debt.currentBalanceMinor, {
                  currency: debt.currency,
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-0.5">
                Original
              </p>
              <p className="text-sm text-[#64748B] tabular-nums">
                {formatCurrency(debt.originalAmountMinor, {
                  currency: debt.currency,
                  compact: true,
                })}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
                Progress
              </span>
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ color: accentColor }}
              >
                {progressPct}%
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progressPct}% repaid`}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, background: accentColor }}
              ></div>
            </div>
          </div>

          {/* Footer: minimum payment + due day */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
            {debt.minimumPaymentMinor > 0 ? (
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
                  Min. payment
                </p>
                <p className="text-xs font-semibold text-[#475569] tabular-nums">
                  {formatCurrency(debt.minimumPaymentMinor, {
                    currency: debt.currency,
                  })}
                  /mo
                </p>
              </div>
            ) : (
              <div />
            )}

            {debt.dueDay ? (
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
                  Due
                </p>
                <p className="text-xs font-semibold text-[#475569]">
                  {debt.dueDay}
                  {["st", "nd", "rd"][
                    ((debt.dueDay % 100) - 11) % 10 < 3 &&
                    ((debt.dueDay % 100) - 11) % 10 >= 0
                      ? 0
                      : Math.min((debt.dueDay % 10) - 1, 2)
                  ] ?? "th"}{" "}
                  of month
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-[#CBD5E1]">No due date set</p>
            )}
          </div>
        </div>

        {/* Quick action overlay on hover */}
        <Link
          href={`/debts/${debt.id}`}
          className="absolute inset-0 rounded-xl focus:outline-none"
          aria-hidden="true"
          tabIndex={-1}
        />
      </article>

      {/* Archive confirmation dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive this debt?</DialogTitle>
            <DialogDescription>
              <strong>{debt.name}</strong> will be removed from your active debt
              list. All payment history and ledger entries are preserved —
              nothing is deleted. You can view archived debts in settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setShowArchiveDialog(false)}
              disabled={isArchiving}
              className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
            >
              Keep active
            </button>
            <button
              onClick={() => executeArchive({ debtId: debt.id })}
              disabled={isArchiving}
              className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isArchiving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Archiving…
                </>
              ) : (
                "Archive debt"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
