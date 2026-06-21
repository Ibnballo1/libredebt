/**
 * app/(dashboard)/help/page.tsx — Help Page
 *
 * Static FAQ + contact page, matching the "Help" sidebar nav link
 * defined back in Step 4's config/nav.ts.
 */

import type { Metadata } from "next";
import { Mail, BookOpen, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import { Navbar } from "@/components/layout/navbar";
import { HelpAccordion } from "@/components/help/help-accordion";

export const metadata: Metadata = { title: "Help" };

const FAQS = [
  {
    question: "How do I add a debt?",
    answer:
      "Go to Debts → Add Debt. Enter the name, creditor, original amount, and optionally an interest rate, minimum payment, and due day. LibreDebt records an opening ledger entry for the full amount immediately.",
  },
  {
    question: "Why doesn't editing a debt change its original amount?",
    answer:
      "The original amount is the historical baseline used to calculate your repayment progress. Changing it after the fact would make your progress percentage meaningless. If you made a mistake, archive the debt and create a new one with the correct amount.",
  },
  {
    question: "What's the difference between Snowball and Avalanche?",
    answer:
      "Snowball pays off your smallest balance first regardless of interest rate, building motivation through quick wins. Avalanche pays off your highest interest rate first, which mathematically minimizes the total interest you pay. Compare both on the Strategies page.",
  },
  {
    question: "How many debts can I track on the free plan?",
    answer:
      "Up to 3 active debts. Archived debts don't count toward this limit. Upgrade to Pro for unlimited debts.",
  },
  {
    question: "Can I undo a payment I recorded by mistake?",
    answer:
      "Payments are stored in an append-only ledger and can't be deleted or edited, which keeps your financial history fully auditable. If you made an error, contact support and we can add a correcting adjustment entry.",
  },
  {
    question: "How do reminders work?",
    answer:
      "Pro users with a due day set on a debt automatically get email reminders 7, 3, and 1 day before that date, plus overdue alerts and a weekly summary. Manage these in Reminders settings.",
  },
] as const;

export default async function HelpPage() {
  const user = await requireUser();
  const tier = user.subscriptionTier as "free" | "pro";

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Help" description="Answers and support" tier={tier} />

      <div className="flex-1 p-6 max-w-3xl space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="mailto:support@libredebt.com"
            className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm hover:border-[#CBD5E1] transition-colors"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#10B981]/10">
              <Mail className="h-4 w-4 text-[#10B981]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">
                Email support
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                support@libredebt.com
              </p>
            </div>
          </a>

          <a
            href="/privacy"
            className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm hover:border-[#CBD5E1] transition-colors"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#38BDF8]/10">
              <ShieldCheck className="h-4 w-4 text-[#38BDF8]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">
                Privacy & Security
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                How we protect your data
              </p>
            </div>
          </a>

          <a
            href="/terms"
            className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm hover:border-[#CBD5E1] transition-colors"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9]">
              <BookOpen className="h-4 w-4 text-[#64748B]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">
                Terms of Service
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">Legal terms</p>
            </div>
          </a>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm px-6">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] pt-5 pb-2">
            Frequently asked questions
          </p>
          <HelpAccordion faqs={FAQS} />
        </div>
      </div>
    </div>
  );
}
