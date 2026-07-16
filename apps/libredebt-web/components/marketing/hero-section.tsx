import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 bg-slate-50"
      aria-labelledby="hero-heading"
      style={{
        backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}
    >
      {/* Smooth gradient fade transition to blend into sections below */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1100px] px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          {/* ─── Left Column: Core Value Pitch ───────────────────────────────── */}
          <div className="flex flex-col items-start animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Context Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold tracking-wide text-slate-900 uppercase">
                Debt management, simplified
              </span>
            </div>

            <h1
              id="hero-heading"
              className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl"
            >
              Take Control of Your Debt.{" "}
              <span className="relative inline-block">
                <span className="relative z-10">One Payment</span>
                <span
                  className="absolute inset-x-0 bottom-1 h-[4px] rounded-full bg-emerald-500/30"
                  aria-hidden="true"
                />
              </span>{" "}
              at a Time.
            </h1>

            <p className="mt-6 max-w-[480px] text-lg leading-relaxed text-slate-600">
              Track every debt, record every payment, and follow a clear payoff
              plan — so you can stop guessing and start moving toward financial
              freedom.
            </p>

            {/* Direct Call to Actions */}
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                See How It Works
              </a>
            </div>

            {/* Micro-Trust Footprints */}
            <p className="mt-6 text-xs text-slate-400 font-medium">
              Free forever · No credit card · Set up in 2 minutes
            </p>
          </div>

          {/* ─── Right Column: Live Interactive Mockup Canvas ───────────────── */}
          <div
            className="relative w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 lg:origin-right transform transition-all duration-500 animate-in fade-in slide-in-from-right-4"
            aria-hidden="true"
          >
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Static Server Mockup Interface Component ───────────────────────────── */
function DashboardMockup() {
  const debts = [
    {
      name: "Access Bank Loan",
      creditor: "Access Bank",
      balance: "₦720,000",
      original: "₦1,000,000",
      pct: 28,
      dotColor: "bg-red-500",
    },
    {
      name: "GTBank Credit Card",
      creditor: "GTBank",
      balance: "₦550,000",
      original: "₦1,000,000",
      pct: 45,
      dotColor: "bg-amber-500",
    },
    {
      name: "Salary Advance",
      creditor: "Employer",
      balance: "₦112,000",
      original: "₦400,000",
      pct: 72,
      dotColor: "bg-emerald-500",
    },
  ];

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden ring-1 ring-black/5">
      {/* Windows Window Header */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-3 flex-1 rounded-md bg-slate-200 h-5 max-w-[160px]" />
      </div>

      <div className="flex min-h-[380px]">
        {/* Navigation Sidebar Drawer Panel */}
        <div className="w-[52px] bg-slate-900 flex flex-col items-center py-4 gap-5 flex-shrink-0">
          <div className="relative h-6 w-6">
            <div className="absolute inset-0 rounded-sm bg-emerald-500" />
            <div className="absolute bottom-[3px] left-[3px] h-[9px] w-[4px] rounded-sm bg-slate-900" />
            <div className="absolute bottom-[3px] left-[3px] h-[4px] w-[10px] rounded-sm bg-slate-900" />
          </div>
          {/* Navigation Matrix Iterators */}
          {[true, false, false, false].map((active, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-sm flex items-center justify-center border transition-colors ${
                active
                  ? "bg-emerald-500/20 border-emerald-500/30"
                  : "bg-transparent border-slate-700/40"
              }`}
            >
              <div
                className={`h-1 w-1 rounded-full ${active ? "bg-emerald-500" : "bg-slate-600"}`}
              />
            </div>
          ))}
        </div>

        {/* Dashboard Work Area Content */}
        <div className="flex-1 p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                Overview
              </div>
              <div className="text-[13px] font-semibold text-slate-900 mt-0.5">
                Welcome back, Amaka
              </div>
            </div>
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-600 tracking-wide">
              ✦ Upgrade
            </div>
          </div>

          {/* Unified Summary Aggregations Cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                label: "Total Debt",
                value: "₦2.4M",
                indicator: "border-l-slate-600",
              },
              {
                label: "Repaid",
                value: "₦820K",
                indicator: "border-l-emerald-500",
              },
              {
                label: "Progress",
                value: "34.2%",
                indicator: "border-l-sky-400",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-lg bg-white border border-slate-200 p-3 border-l-2 ${stat.indicator}`}
              >
                <div className="text-[9px] font-bold tracking-widest uppercase text-slate-400 mb-1">
                  {stat.label}
                </div>
                <div className="text-[13px] font-bold text-slate-900 tabular-nums">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Aggregated Target Progression Lifter */}
          <div className="mb-4">
            <div className="flex justify-between mb-1.5">
              <span className="text-[9px] font-bold tracking-widest uppercase text-slate-400">
                Overall progress
              </span>
              <span className="text-[9px] font-bold text-emerald-600">
                34.2%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: "34.2%" }}
              />
            </div>
          </div>

          {/* Transactional Rows Map Container */}
          <div className="text-[9px] font-bold tracking-widest uppercase text-slate-400 mb-2">
            Active debts
          </div>
          <div className="rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {debts.map((debt) => (
              <div
                key={debt.name}
                className="flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${debt.dotColor}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-900 truncate">
                    {debt.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${debt.pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 tabular-nums flex-shrink-0">
                      {debt.pct}%
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[11px] font-bold text-slate-900 tabular-nums">
                    {debt.balance}
                  </div>
                  <div className="text-[9px] text-slate-400 tabular-nums">
                    {debt.original}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
