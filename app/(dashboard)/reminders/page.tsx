/**
 * app/(dashboard)/reminders/page.tsx — Reminders Settings Page
 *
 * Free users see a calm upgrade prompt explaining the feature.
 * Pro users see:
 *   - Global toggles (due-soon, overdue, weekly summary)
 *   - List of upcoming scheduled reminders
 *   - Per-debt reminder status
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth-session";
import { getActiveDebtsByUserId } from "@/server/repositories/debt.repository";
import { getUpcomingRemindersForUser } from "@/server/services/reminder.service";
import { Navbar } from "@/components/layout/navbar";
import { ReminderPreferencesForm } from "@/components/reminders/reminder-preferences-form";
import { UpcomingRemindersList } from "@/components/reminders/upcoming-reminders-list";
import { DebtReminderToggleList } from "@/components/reminders/debt-reminder-toggle-list";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Reminders" };

type UserWithReminderPreferences = Awaited<ReturnType<typeof requireUser>> & {
  reminderDueSoonEnabled?: boolean;
  reminderOverdueEnabled?: boolean;
  reminderWeeklySummaryEnabled?: boolean;
};

export default async function RemindersPage() {
  const user = (await requireUser()) as UserWithReminderPreferences;
  if (!user) {
    redirect("/login"); // ✅ ONLY place redirect happens
  }
  const tier = user.subscriptionTier as "free" | "pro";

  if (tier === "free") {
    return <FreeUpgradeGate />;
  }

  const [debts, upcoming] = await Promise.all([
    getActiveDebtsByUserId(user.id),
    getUpcomingRemindersForUser(user.id),
  ]);

  return (
    <div className="flex flex-col flex-1">
      <Navbar
        title="Reminders"
        description="Stay on top of every due date"
        tier={tier}
      />

      <div className="flex-1 p-6 max-w-3xl space-y-6">
        <ReminderPreferencesForm
          initialPreferences={{
            dueSoonEnabled: user.reminderDueSoonEnabled ?? true,
            overdueEnabled: user.reminderOverdueEnabled ?? true,
            weeklySummaryEnabled: user.reminderWeeklySummaryEnabled ?? true,
          }}
        />

        <UpcomingRemindersList reminders={upcoming} />

        <DebtReminderToggleList debts={debts} />
      </div>
    </div>
  );
}

// ─── Free plan gate ───────────────────────────────────────────────────────────

function FreeUpgradeGate() {
  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Reminders" tier="free" />
      <div className="flex-1 p-6 flex items-start justify-center">
        <div className="max-w-md w-full mt-8">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/10 mx-auto mb-5">
              <Bell className="h-5 w-5 text-[#10B981]" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
              Never miss a payment again
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
              Smart reminders are a Pro feature. Get email alerts 7 days, 3
              days, and 1 day before each payment is due, overdue notifications,
              and a weekly progress summary.
            </p>
            <Link
              href="/settings?tab=billing"
              className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
