/**
 * components/marketing/analytics-section.tsx
 *
 * Server-rendered pure SVG data visualization showcasing interactive progression loops.
 * Refactored to leverage unified Tailwind utility parameters and resilient math bounds.
 */

import { Check } from "lucide-react";

export function AnalyticsSection() {
  // Simulated monthly balance dataset mapping parameters
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const balances = [2400, 2280, 2150, 1990, 1820, 1640, 1440, 1220];
  const maxBalance = 2400;

  // Explicit Vector Grid Coordinate Layout Definitions
  const w = 480;
  const h = 160;
  const pad = { top: 16, right: 16, bottom: 32, left: 48 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  // Compile coordinate maps safely before rendering JSX paths
  const points = balances.map((b, i) => {
    const xCoord = pad.left + (i / (balances.length - 1)) * innerW;
    const yCoord = pad.top + ((maxBalance - b) / maxBalance) * innerH;
    return {
      x: xCoord,
      y: yCoord,
      label: months[i] ?? "",
      value: b,
    };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  const areaD = `${pathD} L${points[points.length - 1]?.x},${pad.top + innerH} L${pad.left},${pad.top + innerH} Z`;

  return (
    <section
      className="bg-slate-50 py-20 md:py-24 dark:bg-slate-950"
      aria-labelledby="analytics-heading"
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* ─── Ledger Index Section Marker ──────────────────────────────────── */}
        <div className="mb-12 flex items-center gap-4">
          <span
            className="font-mono text-[11px] font-bold tracking-widest text-slate-400 uppercase"
            aria-hidden="true"
          >
            03 / Analytics
          </span>
          <div
            className="h-px flex-1 bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          />
        </div>

        {/* ─── Main Interface Presentation Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Left Column: Copywriting Pitch Metrics */}
          <div>
            <h2
              id="analytics-heading"
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-[1.15] dark:text-slate-50"
            >
              See your debt shrink
              <br />
              month by month.
            </h2>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              LibreDebt tracks every payment against your original balance and
              projects exactly when each debt reaches zero — updated
              automatically every time you record a payment.
            </p>

            {/* Value Checkpoints List */}
            <ul className="mt-8 space-y-3.5" role="list">
              {[
                "Balance curves updated after every payment",
                "Projected debt-free date shown at a glance",
                "Monthly repayment trend charts",
                "What-if simulations: add ₦10k/month, save 8 months",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  >
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✦ Pro feature
            </div>
          </div>

          {/* Right Column: Zero-JS SVG Linear Render Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                  Total outstanding balance
                </p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1 dark:text-slate-50">
                  ₦1,220,000
                </p>
              </div>
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ↓ 49.2%
              </span>
            </div>

            {/* Render Canvas Area */}
            <svg
              viewBox={`0 0 ${w} ${h}`}
              className="w-full overflow-visible"
              aria-label="Debt balance decreasing over 8 months from ₦2.4M to ₦1.22M"
              role="img"
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines Factor Iterator */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const yPos = pad.top + frac * innerH;
                const computedValue = Math.round(maxBalance * (1 - frac));
                return (
                  <g key={frac}>
                    <line
                      x1={pad.left}
                      y1={yPos}
                      x2={pad.left + innerW}
                      y2={yPos}
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="1"
                    />
                    <text
                      x={pad.left - 8}
                      y={yPos + 3}
                      textAnchor="end"
                      fontSize="9"
                      className="fill-slate-400 font-mono font-bold"
                    >
                      {computedValue >= 1000
                        ? `${computedValue / 1000}k`
                        : computedValue}
                    </text>
                  </g>
                );
              })}

              {/* SVG Area Vector Path */}
              <path d={areaD} fill="url(#areaGrad)" />

              {/* Main Trend Line Path */}
              <path
                d={pathD}
                fill="none"
                className="stroke-emerald-500"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Node Point Plotter */}
              {points.map((p) => (
                <g key={p.label}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    className="fill-emerald-500 stroke-white dark:stroke-slate-900"
                    strokeWidth="1"
                  />
                  <text
                    x={p.x}
                    y={h - 6}
                    textAnchor="middle"
                    fontSize="9"
                    className="fill-slate-400 font-mono font-bold"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>

            <p className="mt-5 text-[11px] text-slate-400 font-medium text-center border-t border-slate-100 dark:border-slate-800/60 pt-4">
              Projected debt-free:{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                March 2027
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
