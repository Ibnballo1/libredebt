/**
 * components/layout/navbar.tsx
 *
 * The primary dashboard view header node.
 * Positioned permanently at the top of the viewport content area with structural blur properties
 * to allow table views and ledger grids to pass underneath cleanly when scrolled.
 */
"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { ProUpgradeBadge } from "@/components/shared/pro-upgrade-badge";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/context/mobile-menu";

type NavbarProps = {
  title: string;
  description?: string;
  /** Contextual link hierarchy: [{ label: "Debts", href: "/debts" }, { label: "Edit" }] */
  breadcrumb?: Array<{ label: string; href?: string }>;
  /** Flexible contextual button injectors (e.g., "New Transaction") */
  actions?: React.ReactNode;
  tier?: "free" | "pro";
};

export function Navbar({
  title,
  description,
  breadcrumb,
  actions,
  tier = "free",
}: NavbarProps) {
  const { openMenu } = useMobileMenu();
  const hasBreadcrumbs = breadcrumb && breadcrumb.length > 0;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 gap-4 dark:border-slate-800 dark:bg-slate-950/80">
      {/* Mobile Responsive Hamburger Drawer Trigger */}
      <button
        onClick={openMenu}
        className="inline-flex lg:hidden items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        aria-label="Toggle structural navigation drawer"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Dynamic Header Workspace Title Block */}
      <div className="flex flex-1 flex-col justify-center min-w-0">
        {hasBreadcrumbs && (
          <nav className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-zinc-500 mb-0.5">
            {breadcrumb.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span className="text-slate-300 dark:text-zinc-800 font-normal">
                    /
                  </span>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-slate-700 dark:hover:text-zinc-300 transition-colors truncate max-w-[120px]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-600 dark:text-zinc-400 font-semibold truncate max-w-[120px]">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex items-baseline gap-2">
          <h1
            className={cn(
              "font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight truncate",
              hasBreadcrumbs ? "text-sm" : "text-base sm:text-lg",
            )}
          >
            {title}
          </h1>
        </div>

        {description && (
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 truncate max-w-2xl font-medium">
            {description}
          </p>
        )}
      </div>

      {/* Right Side Adaptive Workspace Controls */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
        {tier === "free" && (
          <div className="hidden sm:block">
            <ProUpgradeBadge variant="compact" />
          </div>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
