/**
 * components/marketing/problem-section.tsx
 *
 * Agitates target audience pain points before introducing the solution.
 * Refactored to map semantic design utility standards and responsive padding.
 */

import { X } from "lucide-react";

const PAIN_POINTS = [
  {
    title: "You forget payment due dates",
    body: "A missed payment isn't just a late fee — it's damage to your credit and a step backwards on your payoff plan.",
  },
  {
    title: "You don't know your real balance",
    body: "Between interest, partial payments, and multiple lenders, you're guessing what you actually owe right now.",
  },
  {
    title: "Too many debts, no clear order",
    body: "You're paying the loudest debt, not the smartest one. Without a strategy, you're leaving months of interest on the table.",
  },
  {
    title: "Spreadsheets break under pressure",
    body: "A spreadsheet tracks yesterday's numbers. It doesn't alert you, it doesn't project your payoff date, and it breaks when life happens.",
  },
  {
    title: "The anxiety compounds",
    body: "Avoiding the numbers feels safer than facing them. But every month of avoidance costs more interest and more stress.",
  },
  {
    title: "No record of what you've done",
    body: "You've made real progress — but without a payment history, every month feels like starting over.",
  },
  {
    title: "I'm owed money, but I don't know how much",
    body: "You lent money to friends and family, but you don't know how much they owe you or when they'll pay it back.",
  },
] as const;

export function ProblemSection() {
  return (
    <section
      className="bg-slate-50 py-20 md:py-24 dark:bg-slate-950"
      aria-labelledby="problem-heading"
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* ─── Ledger Index Section Marker ──────────────────────────────────── */}
        <div className="mb-12 flex items-center gap-4">
          <span
            className="font-mono text-[11px] font-bold tracking-widest text-slate-400 uppercase"
            aria-hidden="true"
          >
            01 / The problem
          </span>
          <div
            className="h-px flex-1 bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          />
        </div>

        {/* ─── Main Aggregator Grid Layout ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          {/* Left Column: Context Thesis Anchor */}
          <div className="sticky top-24">
            <h2
              id="problem-heading"
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-[1.15] dark:text-slate-50"
            >
              The Problem
            </h2>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-400 max-w-md">
              Most people know they have debt. Few know exactly how much, which
              to pay first, or when each payment is due. That gap between
              knowing and acting is where debt grows.
            </p>
          </div>

          {/* Right Column: Pain Point Cards Matrix */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PAIN_POINTS.map(({ title, body }) => (
              <div
                key={title}
                className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="mb-2.5 flex items-start gap-2.5">
                  {/* Semantic negative indicator icon badge */}
                  <div
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400 mt-0.5"
                    aria-hidden="true"
                  >
                    <X className="h-3 w-3 stroke-[3]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {title}
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 pl-7">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
