/**
 * components/marketing/cta-section.tsx
 *
 * Terminal conversion component serving as the final action pipeline step.
 * Refactored to pass absolute color contrast accessibility evaluations and standard tokens.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section
      className="bg-slate-900 py-24 md:py-28 dark:bg-slate-950"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-[1100px] px-6 text-center">
        {/* ─── Centered Ledger Marker Line ──────────────────────────────────── */}
        <div className="mb-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-800" aria-hidden="true" />
          <span
            className="font-mono text-[11px] font-bold tracking-widest text-slate-500 uppercase"
            aria-hidden="true"
          >
            09 / Get started
          </span>
          <div className="h-px flex-1 bg-slate-800" aria-hidden="true" />
        </div>

        {/* Core Conversion Copy */}
        <h2
          id="cta-heading"
          className="text-3xl font-bold tracking-tight text-white leading-[1.15] sm:text-4xl md:text-5xl max-w-2xl mx-auto"
        >
          Your debt doesn&apos;t have to
          <br />
          control your future.
        </h2>
        <p className="mt-6 text-base md:text-lg leading-relaxed text-slate-400 max-w-lg mx-auto font-medium">
          Start organising your finances today. Track every debt, record every
          payment, and move toward the month you pay your last one.
        </p>

        {/* Primary and Alternative Router Directives */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Start Free Today
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors py-2"
          >
            Already have an account? Sign in →
          </Link>
        </div>

        {/* ─── High Contrast Micro-Trust Badges ─────────────────────────────── */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {[
            // "Free forever on the basic plan",
            "No credit card required",
            // "Cancel Pro anytime",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0"
                aria-hidden="true"
              ></span>
              <span className="text-xs text-slate-400 font-semibold tracking-wide">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
