/**
 * components/layout/trial-banner.tsx
 *
 * A slim, persistent banner shown at the top of every dashboard page
 * while the user is in the 3-day trial. Links to /settings?tab=billing.
 *
 */

import Link from "next/link";
import { Clock } from "lucide-react";

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const message =
    daysLeft === 0
      ? "Your free trial ends today."
      : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial.`;

  return (
    <div className="flex items-center justify-between gap-4 bg-amber-400 px-5 py-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
        {message} Upgrade to Pro to unlock unlimited debts, reminders, and more.
      </div>
      <Link
        href="/settings?tab=billing"
        className="flex-shrink-0 rounded-md bg-amber-900 px-3 py-1 text-[10px] font-bold text-white hover:bg-amber-800 transition-colors"
      >
        Upgrade now →
      </Link>
    </div>
  );
}
