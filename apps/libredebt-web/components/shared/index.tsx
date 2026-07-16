/**
 * components/shared/index.tsx
 *
 * Core shared component dictionary mapping the primary visual building blocks.
 * Enforces unified semantic typography bounds, accessible touch constraints,
 * and standard responsive focus rings across layout workflows.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── EmptyState Component ───────────────────────────────────────────────────

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center w-full",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 mb-4 flex-shrink-0">
        <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── PageHeader Component ────────────────────────────────────────────────────

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 w-full", className)}
    >
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}

// ─── LoadingSpinner Component ────────────────────────────────────────────────

type LoadingSpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
};

export function LoadingSpinner({
  className,
  size = "md",
  label = "Loading...",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-[2px]",
    md: "h-6 w-6 border-[2px]",
    lg: "h-8 w-8 border-[3px]",
  };

  return (
    <div
      className={cn("flex items-center justify-center", className)}
      role="status"
      aria-label={label}
    >
      <Loader2
        className={cn(
          "animate-spin text-slate-400 dark:text-zinc-500",
          sizeClasses[size],
        )}
      />
    </div>
  );
}

// ─── StatCard Component ──────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: string;
  subtext?: string;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "accent" | "warning" | "info";
  className?: string;
  loading?: boolean;
};

export function StatCard({
  label,
  value,
  subtext,
  trend,
  variant = "default",
  className,
  loading = false,
}: StatCardProps) {
  const borderColors = {
    default: "border-l-emerald-500 dark:border-l-emerald-400",
    accent: "border-l-sky-500 dark:border-l-sky-400",
    warning: "border-l-amber-500 dark:border-l-amber-400",
    info: "border-l-slate-400 dark:border-l-zinc-600",
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border border-slate-200 bg-white p-5 border-l-2 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
        borderColors[variant],
        className,
      )}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-6 w-28 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-zinc-500 mb-1.5">
            {label}
          </p>

          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums leading-none tracking-tight">
            {value}
          </p>

          {(subtext || trend) && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
              {trend && (
                <span
                  className={cn(
                    "font-bold text-xs",
                    trend.positive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {trend.positive ? "↑" : "↓"} {trend.value}
                </span>
              )}
              {subtext && <span className="truncate">{subtext}</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SectionLabel Component ──────────────────────────────────────────────────

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-zinc-500",
        className,
      )}
    >
      {children}
    </p>
  );
}

// ─── DebtLimitBanner Component ───────────────────────────────────────────────

type DebtLimitBannerProps = {
  current: number;
  limit: number;
  className?: string;
};

export function DebtLimitBanner({
  current,
  limit,
  className,
}: DebtLimitBannerProps) {
  const isAtLimit = current >= limit;

  if (!isAtLimit && current < limit - 1) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
        isAtLimit
          ? "border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"
          : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-zinc-300",
        className,
      )}
    >
      <p className="text-sm">
        {isAtLimit ? (
          <>
            <span className="font-bold">Debt limit reached.</span> You are
            utilizing {current} of {limit} free slot rules.
          </>
        ) : (
          <>
            Using <span className="font-semibold">{current}</span> of {limit}{" "}
            available free tracked slots.
          </>
        )}
      </p>

      <Link
        href="/settings?tab=billing"
        className="flex-shrink-0 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors whitespace-nowrap dark:text-emerald-400 dark:hover:text-emerald-300 focus-visible:outline-none focus-visible:underline"
      >
        Upgrade to Pro →
      </Link>
    </div>
  );
}
