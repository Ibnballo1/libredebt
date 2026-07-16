/**
 * components/shared/pro-upgrade-badge.tsx
 *
 * The upgrade CTA shown to free-tier users.
 * Appears in: navbar (compact), debt limit gate (full).
 *
 * Design principle: calm, not pushy.
 * This is information, not an ad. The user can dismiss the context,
 * and the message is factual: "Upgrade to unlock X."
 */
"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ProUpgradeBadgeProps = {
  variant?: "compact" | "full";
  className?: string;
};

export function ProUpgradeBadge({
  variant = "compact",
  className,
}: ProUpgradeBadgeProps) {
  if (variant === "compact") {
    return (
      <Link
        href="/settings?tab=billing"
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1.5",
          "text-xs font-semibold text-[#10B981] transition-colors",
          "bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/20",
          className,
        )}
      >
        <Sparkles className="h-3 w-3" />
        Upgrade to Pro
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-[#10B981]/20 bg-[#10B981]/5 p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#10B981]/10">
          <Sparkles className="h-4 w-4 text-[#10B981]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Upgrade to Pro
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unlock unlimited debts, smart reminders, and payoff strategies.
          </p>
        </div>
        <Link
          href="/settings?tab=billing"
          className="flex-shrink-0 rounded-md bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#059669] transition-colors"
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
}
