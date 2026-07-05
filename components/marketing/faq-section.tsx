/**
 * components/marketing/faq-section.tsx
 *
 * Client-hydrated interactive accordions for handling conversion hesitations.
 * Refactored to pass absolute accessibility compliance and fluid dynamic sizing layouts.
 */
"use client";

import { useState, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "Is LibreDebt free?",
    answer:
      "Yes. The Free plan is free forever with no credit card required. You can track up to 3 debts, record payments, and view your dashboard at no cost. The Pro plan ($4.5/year) unlocks unlimited debts, smart reminders, payoff strategies, and analytics.",
  },
  {
    question: "Is my financial data secure?",
    answer:
      "Your data is encrypted in transit and at rest. LibreDebt uses an append-only ledger model — payment records cannot be altered or deleted, only added. We never sell your data to third parties. Row-level security ensures no user can ever access another user's records.",
  },
  {
    question: "Can I track multiple debts?",
    answer:
      "Free users can track up to 3 active debts simultaneously. Pro users have no limit. You can track loans, credit cards, buy-now-pay-later balances, informal debts — any obligation that has a balance and a repayment schedule.",
  },
  {
    question: "What payoff strategy should I use?",
    answer:
      "It depends on your psychology. The Avalanche (highest interest first) saves the most money mathematically. The Snowball (smallest balance first) builds momentum through early wins. LibreDebt shows you both options with projected timelines and interest savings so you can make the right choice for your situation.",
  },
  // {
  //   question: "Can I cancel Pro anytime?",
  //   answer:
  //     "Yes. You can cancel your Pro subscription at any time from your account settings. You'll retain Pro features until the end of your current billing period, then automatically move to the Free plan. No questions asked.",
  // },
] as const;

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const buttonId = useId();
  const panelId = useId();

  return (
    <div className="border-b border-slate-200 last:border-none dark:border-slate-800">
      <button
        id={buttonId}
        className="flex w-full items-center justify-between py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 rounded-sm group select-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="text-sm font-semibold text-slate-900 pr-8 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500",
            open && "rotate-180 text-emerald-500",
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dynamic CSS Grid Height Transform to avoid max-height animation snapping */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid transition-all duration-200 ease-in-out overflow-hidden",
          open
            ? "grid-rows-[1fr] opacity-100 pb-5"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section
      id="faq"
      className="bg-slate-50 py-20 md:py-24 dark:bg-slate-950"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* ─── Ledger Index Section Marker ──────────────────────────────────── */}
        <div className="mb-12 flex items-center gap-4">
          <span
            className="font-mono text-[11px] font-bold tracking-widest text-slate-400 uppercase"
            aria-hidden="true"
          >
            08 / FAQ
          </span>
          <div
            className="h-px flex-1 bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          />
        </div>

        {/* Primary Page Layout Split */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[280px,1fr] lg:items-start lg:gap-16">
          <div>
            <h2
              id="faq-heading"
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-[1.15] dark:text-slate-50"
            >
              Common
              <br />
              questions.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Anything else?{" "}
              <a
                href="mailto:hello@libredebt.com"
                className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                Email us
              </a>
              .
            </p>
          </div>

          {/* Accordion Wrapper Shell */}
          <div className="rounded-xl border border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900/40">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} {...faq} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
