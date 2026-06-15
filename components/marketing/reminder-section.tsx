/**
 * components/marketing/reminder-section.tsx
 *
 * Micro-copy detailing automated notifications and transactional email templates.
 * Refactored to eliminate dynamic hex style values and improve responsive layouts.
 */

import { Bell, Mail, AlertTriangle, Star } from "lucide-react";

const REMINDER_TYPES = [
  {
    icon: Bell,
    title: "Due date reminders",
    body: "Get notified 7 days, 3 days, and 1 day before each payment is due. Never pay a late fee again.",
    iconBgClass: "bg-emerald-500/10",
    iconTextClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: AlertTriangle,
    title: "Overdue alerts",
    body: "If a payment hasn't been recorded by its due date, LibreDebt flags it immediately so you can act.",
    iconBgClass: "bg-amber-500/10",
    iconTextClass: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Star,
    title: "Milestone notifications",
    body: "Celebrate every 25% milestone. Knowing you're halfway there makes the rest easier to finish.",
    iconBgClass: "bg-sky-500/10",
    iconTextClass: "text-sky-600 dark:text-sky-400",
  },
] as const;

export function ReminderSection() {
  return (
    <section
      className="bg-white py-20 md:py-24 dark:bg-slate-900"
      aria-labelledby="reminders-heading"
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* ─── Ledger Index Section Marker ──────────────────────────────────── */}
        <div className="mb-12 flex items-center gap-4">
          <span
            className="font-mono text-[11px] font-bold tracking-widest text-slate-400 uppercase"
            aria-hidden="true"
          >
            05 / Reminders
          </span>
          <div
            className="h-px flex-1 bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          />
        </div>

        {/* ─── Main Conversion Layout Grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Left Column: Context Branding Block */}
          <div className="max-w-xl">
            <h2
              id="reminders-heading"
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-[1.15] dark:text-slate-50"
            >
              Stop worrying about
              <br />
              what you might forget.
            </h2>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              LibreDebt tracks your due dates and sends smart reminders so you
              never have to hold a payment schedule in your head. Peace of mind,
              delivered to your inbox.
            </p>

            {/* Structured Alert Class Matrix */}
            <div className="mt-8 space-y-5">
              {REMINDER_TYPES.map(
                ({ icon: Icon, title, body, iconBgClass, iconTextClass }) => (
                  <div key={title} className="flex gap-4">
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg mt-0.5 ${iconBgClass}`}
                      aria-hidden="true"
                    >
                      <Icon className={`h-4 w-4 ${iconTextClass}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {body}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✦ Pro feature
            </div>
          </div>

          {/* Right Column: Responsive Interface Email Client Mockup */}
          <div
            aria-hidden="true"
            className="w-full max-w-md mx-auto lg:max-w-none"
          >
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
              {/* Mock Chrome Head Module */}
              <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-3 flex items-center gap-3 dark:border-slate-800 dark:bg-slate-900/40">
                <Mail className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    LibreDebt · Payment Reminder
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    to: amaka@email.com
                  </p>
                </div>
                <span className="text-[10px] font-medium text-slate-400">
                  9:00 AM
                </span>
              </div>

              {/* Client Content Container */}
              <div className="p-5 sm:p-6">
                {/* Brand Identifier */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="relative h-6 w-6">
                    <div className="absolute inset-0 rounded-sm bg-slate-900 dark:bg-slate-100" />
                    <div className="absolute bottom-[3px] left-[3px] h-[9px] w-[4px] rounded-sm bg-emerald-500" />
                    <div className="absolute bottom-[3px] left-[3px] h-[4px] w-[10px] rounded-sm bg-emerald-500" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    LibreDebt
                  </span>
                </div>

                <p className="text-[10px] font-bold text-slate-400 mb-1 font-mono tracking-wider">
                  PAYMENT DUE IN 3 DAYS
                </p>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 dark:text-slate-100 leading-snug">
                  Hi Amaka, your GTBank Credit Card payment is due soon.
                </h3>

                {/* Simulated Ledger Entry Notification Row */}
                <div className="rounded-lg border border-slate-200 p-4 mb-5 border-l-2 border-l-amber-500 dark:border-slate-800 dark:bg-slate-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      GTBank Credit Card
                    </p>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded dark:text-amber-400">
                      Due 1st
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 mb-0.5">
                        Minimum payment
                      </p>
                      <p className="text-base font-bold text-slate-900 tabular-nums dark:text-slate-50">
                        ₦25,000
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium text-slate-400 mb-0.5">
                        Balance
                      </p>
                      <p className="text-base font-bold text-slate-900 tabular-nums dark:text-slate-50">
                        ₦550,000
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pseudo Action Route Trigger Button */}
                <div className="rounded-lg bg-slate-900 px-4 py-2.5 text-center cursor-pointer hover:bg-slate-800 transition-colors dark:bg-slate-100 dark:hover:bg-slate-200 group">
                  <span className="text-xs sm:text-sm font-semibold text-white dark:text-slate-900">
                    Record Payment in LibreDebt →
                  </span>
                </div>

                <p className="mt-4 text-[10px] text-slate-400 text-center leading-relaxed">
                  You can manage reminder preferences in your LibreDebt
                  settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
