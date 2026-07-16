/**
 * components/receivable/send-reminder-button.tsx
 *
 * v1 of the "remind them" feature: generates a friendly message
 * client-side and copies it to the clipboard, with a WhatsApp deep-link
 * as a bonus shortcut when a phone number is on file.
 *
 * This deliberately does NOT send anything automatically — no SMS
 * infrastructure required for v1. The user reviews and sends it
 * themselves, which avoids an automated message feeling presumptuous
 * for what is often a sensitive, personal conversation.
 */

"use client";

import { useState } from "react";
import { MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";

type SendReminderButtonProps = {
  debtorName: string;
  debtorPhone: string | null;
  amountMinor: number;
  currency: string;
  lenderName: string;
};

function buildMessage(params: {
  debtorName: string;
  amountFormatted: string;
  lenderName: string;
}): string {
  return `Hi ${params.debtorName}, just a friendly reminder about the ${params.amountFormatted} — whenever you get a chance to settle it would be appreciated. Thanks! — ${params.lenderName}`;
}

export function SendReminderButton({
  debtorName,
  debtorPhone,
  amountMinor,
  currency,
  lenderName,
}: SendReminderButtonProps) {
  const [copied, setCopied] = useState(false);

  const message = buildMessage({
    debtorName,
    amountFormatted: formatCurrency(amountMinor, { currency }),
    lenderName,
  });

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Reminder message copied");
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappUrl = debtorPhone
    ? `https://wa.me/${debtorPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-3">
        Send a reminder
      </p>
      <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3 mb-4">
        <p className="text-xs text-[#475569] leading-relaxed italic">
          &quot;{message}&quot;
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
            copied
              ? "border-[#10B981]/30 bg-[#10B981]/5 text-[#10B981]"
              : "border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]",
          )}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy message"}
        </button>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1EBE57] transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
