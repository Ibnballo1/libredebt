/**
 * components/marketing/pricing-section.tsx
 *
 * Strategic tiered pricing cards mapping conversion steps.
 * Refactored to pass absolute landmark checks and support global configuration tokens.
 */

import Link from "next/link";
import { Check } from "lucide-react";

const FREE_FEATURES = [
  "Up to 3 active debts",
  "Full debt tracking",
  "Payment recording",
  "Running balance (ledger-based)",
  "Repayment progress dashboard",
] as const;

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited debts",
  "Smart payment reminders",
  "Overdue & milestone alerts",
  "Debt Snowball strategy",
  "Debt Avalanche strategy",
  "Payoff projections",
  "What-if simulations",
  "Advanced analytics & charts",
  "Priority support",
] as const;

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="bg-slate-50 py-20 md:py-24 dark:bg-slate-950"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* ─── Ledger Index Section Marker ──────────────────────────────────── */}
        <div className="mb-12 flex items-center gap-4">
          <span
            className="font-mono text-[11px] font-bold tracking-widest text-slate-400 uppercase"
            aria-hidden="true"
          >
            06 / Pricing
          </span>
          <div
            className="h-px flex-1 bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          />
        </div>

        {/* Framing Text Rows */}
        <div className="mb-14 text-center">
          <h2
            id="pricing-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-tight dark:text-slate-50"
          >
            Start free. Upgrade when you&apos;re ready.
          </h2>
          <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-400">
            No trial periods. No hidden fees. Cancel Pro anytime.
          </p>
        </div>

        {/* ─── Pricing Grid Systems ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-3xl mx-auto items-stretch">
          {/* Standard Free Tier Box */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/40">
            <div>
              <div className="mb-6">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">
                  Free Plan
                </p>
                <p className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                  $0
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Perfect for getting started
                </p>
              </div>

              <ul className="space-y-3 mb-8" role="list">
                {FREE_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400"
                  >
                    <Check
                      className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/register"
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-6 py-3 text-center text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/80"
            >
              Get Started Free
            </Link>
          </div>

          {/* Featured Pro Tier Box */}
          <div className="flex flex-col justify-between rounded-2xl border-2 border-emerald-500 bg-white p-6 sm:p-8 relative shadow-lg shadow-emerald-500/5 dark:bg-slate-900/40">
            {/* Top-Tier Recommendation Badge */}
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-[11px] font-bold text-white tracking-wide shadow-sm"
              aria-label="Most popular plan"
            >
              Most Popular
            </div>

            <div>
              <div className="mb-6">
                <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-500 mb-2">
                  Pro Plan
                </p>
                <div className="flex items-end gap-1">
                  <p className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                    $5
                  </p>
                  <p className="text-slate-500 mb-1 text-sm dark:text-slate-400">
                    /month
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  For serious debt payoff
                </p>
              </div>

              <ul className="space-y-3 mb-8" role="list">
                {PRO_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400"
                  >
                    <Check
                      className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Link
                href="/register"
                className="block w-full rounded-lg bg-emerald-500 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600 shadow-sm shadow-emerald-500/10"
              >
                Start Pro Free Trial
              </Link>
              <p className="mt-3 text-center text-xs text-slate-400">
                No credit card required to start
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Stripe Integration Subtitle */}
        <p className="mt-12 text-center text-xs text-slate-400">
          Payments processed securely via Stripe and Paystack.
        </p>
      </div>
    </section>
  );
}
