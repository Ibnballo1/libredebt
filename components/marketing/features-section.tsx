/**
 * components/marketing/features-section.tsx
 *
 * Solutions feature discovery board mapped against the identified user pain points.
 * Refactored to map explicit design variable paths and remove unoptimized inline styles.
 */

import {
  CreditCard,
  Receipt,
  Bell,
  TrendingDown,
  Layers,
  BarChart3,
  FileText,
} from "lucide-react";

const FEATURES = [
  {
    icon: CreditCard,
    title: "Debt Tracking",
    body: "Add every debt you carry — loans, credit cards, buy-now-pay-later, informal debts. See them all in one organised view.",
    pro: false,
    borderClass: "border-l-slate-900 dark:border-l-slate-100",
    iconBgClass: "bg-slate-900/10 dark:bg-slate-100/10",
    iconTextClass: "text-slate-900 dark:text-slate-100",
  },
  {
    icon: Receipt,
    title: "Payment History",
    body: "Every payment you record is stored permanently in an append-only ledger. Your repayment history is always accurate and auditable.",
    pro: false,
    borderClass: "border-l-slate-700 dark:border-l-slate-400",
    iconBgClass: "bg-slate-700/10 dark:bg-slate-400/10",
    iconTextClass: "text-slate-700 dark:text-slate-400",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    body: "Get email alerts before payments are due, when you're overdue, and weekly summaries to keep you on track without the anxiety.",
    pro: true,
    borderClass: "border-l-emerald-500",
    iconBgClass: "bg-emerald-500/10",
    iconTextClass: "text-emerald-500",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    body: "Visual charts showing your repayment progress, monthly trends, and projected payoff timeline. Know exactly where you stand.",
    pro: true,
    borderClass: "border-l-sky-400",
    iconBgClass: "bg-sky-400/10",
    iconTextClass: "text-sky-400",
  },
  {
    icon: Layers,
    title: "Debt Snowball",
    body: "Pay off your smallest debt first to build momentum. LibreDebt calculates the optimal order and shows the psychological wins along the way.",
    pro: true,
    borderClass: "border-l-emerald-500",
    iconBgClass: "bg-emerald-500/10",
    iconTextClass: "text-emerald-500",
  },
  {
    icon: TrendingDown,
    title: "Debt Avalanche",
    body: "Target your highest-interest debt first. See exactly how much interest you'll save and how many months earlier you'll be free.",
    pro: true,
    borderClass: "border-l-emerald-500",
    iconBgClass: "bg-emerald-500/10",
    iconTextClass: "text-emerald-500",
  },
  {
    icon: FileText,
    title: "Payoff Projections",
    body: "Your personalised debt-free date, updated automatically as you record payments. Know the month you'll be completely free.",
    pro: true,
    borderClass: "border-l-sky-400",
    iconBgClass: "bg-sky-400/10",
    iconTextClass: "text-sky-400",
  },
] as const;

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-white py-20 md:py-24 dark:bg-slate-900"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* ─── Ledger Index Section Marker ──────────────────────────────────── */}
        <div className="mb-12 flex items-center gap-4">
          <span
            className="font-mono text-[11px] font-bold tracking-widest text-slate-400 uppercase"
            aria-hidden="true"
          >
            02 / Features
          </span>
          <div
            className="h-px flex-1 bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          />
        </div>

        {/* Header Branding Row */}
        <div className="mb-14 max-w-xl">
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-[1.15] dark:text-slate-50"
          >
            Everything you need
            <br />
            to get out of debt faster.
          </h2>
          <p className="mt-4 text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Free features to build the habit. Pro features to accelerate the
            journey.
          </p>
        </div>

        {/* ─── Grid System Container ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(
            ({
              icon: Icon,
              title,
              body,
              pro,
              borderClass,
              iconBgClass,
              iconTextClass,
            }) => (
              <div
                key={title}
                className={`relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm transition-all hover:shadow-md border-l-[3px] dark:border-slate-800 dark:bg-slate-950/40 ${borderClass}`}
              >
                <div>
                  {/* Micro Pro Badge Layer */}
                  {pro && (
                    <span className="absolute right-4 top-4 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Pro
                    </span>
                  )}

                  {/* Vector Brand Accent Icon Wrapper */}
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${iconBgClass}`}
                  >
                    <Icon className={`h-5 w-5 ${iconTextClass}`} />
                  </div>

                  <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-50">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {body}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
