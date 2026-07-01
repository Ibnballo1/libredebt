/**
 * components/receivable/receivable-card.tsx
 *
 * Mirrors components/debt/debt-card.tsx, with a sky-blue accent instead
 * of the red/amber/green debt-health colors — receivables aren't
 * "unhealthy" the way an unpaid debt is, they're just pending, so a
 * single calm accent fits better than a traffic-light system.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Archive,
  ChevronRight,
  Phone,
} from "lucide-react";
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
import { archiveReceivableAction } from "@/server/actions/receivable.actions";
import {
  formatCurrency,
  calculateProgressPercent,
  formatDate,
} from "@/lib/utils";

export type ReceivableCardData = {
  id: string;
  name: string;
  debtorName: string;
  debtorPhone: string | null;
  originalAmountMinor: number;
  currentBalanceMinor: number;
  currency: string;
  expectedByDate: Date | null;
  status: "active" | "settled" | "archived";
};

export function ReceivableCard({
  receivable,
}: {
  receivable: ReceivableCardData;
}) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const progressPct = calculateProgressPercent(
    receivable.originalAmountMinor,
    receivable.currentBalanceMinor,
  );

  const { execute: executeArchive, isPending: isArchiving } = useAction(
    archiveReceivableAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Receivable archived");
          setShowArchiveDialog(false);
        } else {
          toast.error(data?.error ?? "Failed to archive");
        }
      },
    },
  );

  return (
    <>
      <article
        className="group relative rounded-xl border border-[#E2E8F0] bg-white shadow-sm transition-shadow hover:shadow-md"
        style={{ borderLeftWidth: 3, borderLeftColor: "#38BDF8" }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <Link
                href={`/receivables/${receivable.id}`}
                className="block text-sm font-semibold text-[#0F172A] hover:text-[#38BDF8] transition-colors truncate"
              >
                {receivable.name}
              </Link>
              <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1">
                {receivable.debtorName}
                {receivable.debtorPhone && (
                  <>
                    <span className="text-[#E2E8F0]">·</span>
                    <Phone className="h-2.5 w-2.5" />
                    {receivable.debtorPhone}
                  </>
                )}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors opacity-0 group-hover:opacity-100"
                  aria-label={`Actions for ${receivable.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/receivables/${receivable.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/receivables/${receivable.id}/edit`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
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

          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-0.5">
                Owed to you
              </p>
              <p className="text-xl font-bold text-[#0F172A] tabular-nums">
                {formatCurrency(receivable.currentBalanceMinor, {
                  currency: receivable.currency,
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-0.5">
                Original
              </p>
              <p className="text-sm text-[#64748B] tabular-nums">
                {formatCurrency(receivable.originalAmountMinor, {
                  currency: receivable.currency,
                  compact: true,
                })}
              </p>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
                Repaid
              </span>
              <span className="text-[10px] font-bold tabular-nums text-[#38BDF8]">
                {progressPct}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#38BDF8] transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
            {receivable.expectedByDate ? (
              <p className="text-xs font-semibold text-[#475569]">
                Expected {formatDate(receivable.expectedByDate)}
              </p>
            ) : (
              <p className="text-[10px] text-[#CBD5E1]">No expected date</p>
            )}
          </div>
        </div>

        <Link
          href={`/receivables/${receivable.id}`}
          className="absolute inset-0 rounded-xl focus:outline-none"
          aria-hidden="true"
          tabIndex={-1}
        />
      </article>

      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive this receivable?</DialogTitle>
            <DialogDescription>
              <strong>{receivable.name}</strong> will be removed from your
              active list. All repayment history is preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setShowArchiveDialog(false)}
              disabled={isArchiving}
              className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              Keep active
            </button>
            <button
              onClick={() => executeArchive({ receivableId: receivable.id })}
              disabled={isArchiving}
              className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50"
            >
              {isArchiving ? "Archiving…" : "Archive"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
