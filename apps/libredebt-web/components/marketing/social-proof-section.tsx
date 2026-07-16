/**
 * components/marketing/social-proof-section.tsx
 *
 * Trust building micro-copy and historical execution metrics.
 * Refactored to leverage semantic utility mapping and elastic mobile grids.
 */

import { ShieldCheck, Lock, BookOpen, BarChart3 } from "lucide-react";

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    label: "Secure",
    description: "Bank-grade encryption",
  },
  {
    icon: Lock,
    label: "Private",
    description: "Your data is never sold",
  },
  {
    icon: BookOpen,
    label: "Ledger-Based",
    description: "Immutable payment records",
  },
  {
    icon: BarChart3,
    label: "Built for Clarity",
    description: "No clutter, just numbers",
  },
] as const;

const METRICS = [
  { value: "12,400+", label: "Payments tracked" },
  { value: "3,200+", label: "Active users" },
  { value: "890+", label: "Debts settled" },
] as const;

export function SocialProofSection() {
  return (
    <section
      className="border-y border-slate-200 bg-white py-14 dark:bg-slate-950 dark:border-slate-800"
      aria-label="Trust and social proof"
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* ─── Trust Grid System ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {TRUST_BADGES.map(({ icon: Icon, label, description }) => (
            <div key={label} className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-emerald-50 dark:bg-slate-900 dark:group-hover:bg-emerald-950/30 transition-colors">
                <Icon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative Separator Line */}
        <div
          className="my-10 h-px bg-slate-200 dark:bg-slate-800"
          aria-hidden="true"
        />

        {/* ─── Product Traction Metrics ─────────────────────────────────────── */}
        {/* <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-3 text-center">
          {METRICS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center sm:block">
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                <span className="tabular-nums">{value.replace("+", "")}</span>
                <span className="text-emerald-500 font-medium ml-0.5">+</span>
              </p>
              <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                {label}
              </p>
            </div>
          ))}
        </div> */}
      </div>
    </section>
  );
}
