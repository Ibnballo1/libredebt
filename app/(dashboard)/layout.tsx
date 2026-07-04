/**
 * app/(dashboard)/layout.tsx — Dashboard Shell
 *
 * Structural foundation wrapping all authenticated sub-routes inside the application.
 * Manages server-side protection frameworks, sets responsive container bounds,
 * and passes client execution to an isolated layout Shell engine.
 *
 * LAYOUT STRUCTURE:
 * ┌─────────────────────────────────────────┐
 * │ sidebar (fixed, w-64) │ main content    │
 * │                       │ ┌─────────────┐ │
 * │  [Logo]               │ │  navbar     │ │
 * │                       │ ├─────────────┤ │
 * │  [Nav items]          │ │             │ │
 * │                       │ │  {children} │ │
 * │                       │ │             │ │
 * │  [User section]       │ │             │ │
 * └───────────────────────┴─┴─────────────┴─┘
 */
import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireSession, requireUser } from "@/lib/auth-session";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TrialBanner } from "@/components/layout/trial-banner";
import {
  isInTrial,
  trialDaysRemaining,
} from "@/server/services/billing.service";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Defense-in-depth security barrier layer
  const session = await requireSession();
  const user = await requireUser();

  if (!session || !user) {
    redirect("/login");
  }

  const inTrial = isInTrial(user.createdAt);
  const daysLeft = trialDaysRemaining(user.createdAt);

  return (
    <div>
      {inTrial && <TrialBanner daysLeft={daysLeft} />}
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Desktop Navigation Drawer (Hidden on Viewports < 1024px) */}
        <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col border-r border-slate-200 dark:border-slate-800">
          <Sidebar
            user={{
              ...session.user,
              subscriptionTier: session.user.subscriptionTier ?? undefined,
            }}
          />
        </div>

        {/* Responsive Structural Viewport Wrapper Core */}
        <DashboardShell
          user={{
            ...session.user,
            subscriptionTier: session.user.subscriptionTier ?? undefined,
          }}
        >
          {children}
        </DashboardShell>
      </div>
    </div>
  );
}
