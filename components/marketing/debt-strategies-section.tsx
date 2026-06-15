/**
 * components/marketing/debt-strategies-section.tsx
 *
 * Side-by-side strategic analysis framework contrast panel.
 * Refactored to pass accessibility color-contrast benchmarks and semantic guidelines.
 */

import { Zap, TrendingDown } from "lucide-react";

export function DebtStrategiesSection() {
  return (
    <section
      className="bg-slate-900 py-20 md:py-24 dark:bg-slate-950"
      aria-labelledby="strategies-heading"
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* ─── Inverted Layout Index Marker ─────────────────────────────────── */}
        <div className="mb-12 flex items-center gap-4">
          <span
            className="font-mono text-[11px] font-bold tracking-widest text-slate-500 uppercase"
            aria-hidden="true"
          >
            04 / Strategies
          </span>
          <div className="h-px flex-1 bg-slate-800" aria-hidden="true" />
        </div>

        {/* Framing Header */}
        <div className="mb-14 max-w-xl">
          <h2
            id="strategies-heading"
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl leading-[1.15]"
          >
            A payoff plan built
            <br />
            for your situation.
          </h2>
          <p className="mt-4 text-base md:text-lg leading-relaxed text-slate-400">
            LibreDebt supports two proven debt payoff strategies. Choose the one
            that fits how you think — we&apos;ll handle the maths.
          </p>
        </div>

        {/* ─── Side-by-Side Dual Matrix Layout ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Strategy 01: Snowball Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 ring-1 ring-white/5 flex flex-col justify-between">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Zap
                    className="h-5 w-5 text-emerald-400"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
                    Strategy 01
                  </p>
                  <h3 className="text-lg font-bold text-white">
                    Debt Snowball
                  </h3>
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed mb-6 text-sm md:text-base">
                Pay off your{" "}
                <strong className="text-white font-semibold">
                  smallest balance first
                </strong>
                , regardless of interest rate. Each debt you clear builds
                momentum and motivation — like a snowball rolling downhill.
              </p>

              <div className="space-y-2.5">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3">
                  Best for
                </p>
                {[
                  "People who need motivational wins early",
                  "Those with many small debts to clear",
                  "Building a consistent repayment habit",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <span
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-slate-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Micro Live Order Simulator UI */}
            <div className="mt-8 rounded-lg bg-slate-950/60 p-4 space-y-2.5 border border-slate-800/40">
              <p className="text-[9px] font-bold tracking-widest uppercase text-slate-500">
                Payoff order
              </p>
              {[
                { name: "Salary Advance", amount: "₦112k", active: true },
                { name: "Credit Card", amount: "₦550k", active: false },
                { name: "Bank Loan", amount: "₦720k", active: false },
              ].map(({ name, amount, active }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-slate-700"}`}
                    />
                    <span
                      className={`text-xs ${active ? "text-white font-semibold" : "text-slate-500"}`}
                    >
                      {name}
                    </span>
                  </div>
                  <span
                    className={`text-xs tabular-nums ${active ? "text-emerald-400 font-bold" : "text-slate-600"}`}
                  >
                    {amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy 02: Avalanche Container */}
          <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-6 sm:p-8 ring-1 ring-emerald-500/5 flex flex-col justify-between">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                    <TrendingDown
                      className="h-5 w-5 text-sky-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-sky-400">
                      Strategy 02
                    </p>
                    <h3 className="text-lg font-bold text-white">
                      Debt Avalanche
                    </h3>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] font-bold tracking-wider text-emerald-400 uppercase border border-emerald-500/10">
                  Saves most
                </span>
              </div>

              <p className="text-slate-400 leading-relaxed mb-6 text-sm md:text-base">
                Pay off your{" "}
                <strong className="text-white font-semibold">
                  highest interest rate first
                </strong>
                , regardless of balance. This minimises the total interest you
                pay — mathematically the fastest route to debt freedom.
              </p>

              <div className="space-y-2.5">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3">
                  Best for
                </p>
                {[
                  "People focused on minimising total cost",
                  "Those with high-interest credit card debt",
                  "Disciplined savers who want pure efficiency",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <span
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-slate-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interest Delta Projections Canvas Block */}
            <div className="mt-8 rounded-lg bg-slate-950/60 p-4 border border-slate-800/40">
              <p className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-3">
                Estimated savings
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-slate-500">
                    Interest saved vs. mins
                  </p>
                  <p className="text-xl font-bold text-emerald-400 tabular-nums mt-1">
                    ₦284,000
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Months saved</p>
                  <p className="text-xl font-bold text-sky-400 tabular-nums mt-1">
                    14 mo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Strategy Attribution Sub-label */}
        <p className="mt-10 text-center text-xs text-slate-500">
          Both strategies are available on the{" "}
          <span className="font-semibold text-emerald-400">Pro plan</span>.
          LibreDebt calculates the optimal order automatically.
        </p>
      </div>
    </section>
  );
}
