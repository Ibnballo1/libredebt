"use client";

/**
 * components/marketing/navbar.tsx
 *
 * Sticky marketing navigation layer featuring dynamic glassmorphism layout thresholds.
 * Refactored to map semantic design tokens and lock layout jumps on open.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Lock body scroll and prevent right-hand horizontal layout shifting
  useEffect(() => {
    if (mobileOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-200",
          scrolled
            ? "bg-slate-50/90 backdrop-blur-md border-b border-slate-200 shadow-sm dark:bg-slate-950/90 dark:border-slate-800"
            : "bg-white",
        )}
      >
        <nav
          className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-6"
          aria-label="Main navigation"
        >
          {/* Logo Identity */}
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-md group"
            aria-label="LibreDebt home"
          >
            <div className="relative h-7 w-7 flex-shrink-0">
              <div className="absolute inset-0 rounded-md bg-slate-900 dark:bg-slate-50 group-hover:scale-105 transition-transform" />
              <div className="absolute bottom-[5px] left-[5px] h-[14px] w-[5px] rounded-sm bg-emerald-500" />
              <div className="absolute bottom-[5px] left-[5px] h-[5px] w-[14px] rounded-sm bg-emerald-500" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              LibreDebt
            </span>
          </Link>

          {/* Desktop Nav Actions */}
          <div className="hidden md:flex items-center gap-8" role="list">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="listitem"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Call To Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-900 hover:text-emerald-600 dark:text-slate-100 dark:hover:text-emerald-400 transition-colors px-3 py-1.5 rounded-md"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/50 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Hamburg Trigger Toggle */}
          <button
            className="flex md:hidden items-center justify-center h-9 w-9 rounded-md text-slate-900 hover:bg-slate-200/60 dark:text-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {/* Mobile Drawer Overlay Portal */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 md:hidden animate-in fade-in slide-in-from-top duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          {/* Top Header Bar */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              onClick={() => setMobileOpen(false)}
            >
              <div className="relative h-7 w-7 flex-shrink-0">
                <div className="absolute inset-0 rounded-md bg-slate-900 dark:bg-slate-50" />
                <div className="absolute bottom-[5px] left-[5px] h-[14px] w-[5px] rounded-sm bg-emerald-500" />
                <div className="absolute bottom-[5px] left-[5px] h-[5px] w-[14px] rounded-sm bg-emerald-500" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                LibreDebt
              </span>
            </Link>
            <button
              className="flex items-center justify-center h-9 w-9 rounded-md text-slate-900 hover:bg-slate-200/60 dark:text-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Link Traversal Matrix */}
          <nav className="flex flex-col px-6 pt-8 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-lg font-medium text-slate-900 border-b border-slate-200 dark:text-slate-100 dark:border-slate-800 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Call To Action Conversions */}
          <div className="mt-auto px-6 pb-10 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center rounded-md border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950 px-4 py-3 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
