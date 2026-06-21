/**
 * components/billing/settings-tabs.tsx
 *
 * Simple tab navigation for the settings page, using URL search params
 * so each tab is a shareable/bookmarkable link (e.g. /settings?tab=billing
 * is the exact URL used by "Upgrade to Pro" links throughout the app).
 */

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "billing", label: "Billing" },
] as const;

export function SettingsTabs({ activeTab }: { activeTab: string }) {
  return (
    <div className="flex items-center gap-1 border-b border-[#E2E8F0]">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/settings?tab=${tab.key}`}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === tab.key
              ? "border-[#10B981] text-[#0F172A]"
              : "border-transparent text-[#94A3B8] hover:text-[#64748B]",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
