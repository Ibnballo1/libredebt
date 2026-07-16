"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { MobileMenuProvider } from "@/context/mobile-menu";

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    image?: string | null;
    subscriptionTier?: string;
  };
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileOpenPathname, setMobileOpenPathname] = useState<string | null>(
    null,
  );
  const pathname = usePathname();

  // Auto-collapse mobile drawer whenever the user navigates pathways
  useEffect(() => {
    // Avoid synchronous setState in effect to prevent cascading renders.
    // Schedule closing on next tick only if the drawer is open.
    if (!mobileOpen) return;
    const t = window.setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  // Lock root background layout scrolling while the mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  const mobileDrawerOpen = mobileOpen && mobileOpenPathname === pathname;

  return (
    <MobileMenuProvider
      value={{
        openMenu: () => {
          setMobileOpenPathname(pathname);
          setMobileOpen(true);
        },
      }}
    >
      <>
        {/* ─── Mobile Drawer ─── */}
        {/* Changed pointer-events handling so clicks work when open, but don't block the page when closed */}
        <div
          className={`fixed inset-0 z-50 lg:hidden ${mobileDrawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop Mask */}
          <div
            className={`
              absolute inset-0 bg-slate-900/60 backdrop-blur-sm
              transition-opacity duration-300 cursor-pointer
              ${mobileDrawerOpen ? "opacity-100" : "opacity-0"}
            `}
            onClick={() => setMobileOpen(false)}
          />

          {/* Slider Container */}
          {/* Restored clean pointer control explicitly to the inner side pane element */}
          <div
            className={`
              absolute inset-y-0 left-0 z-50 w-64 flex flex-col pointer-events-auto
              transform transition-transform duration-300 ease-in-out
              ${mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <Sidebar user={user} />

            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3.5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 z-[60]"
              aria-label="Close navigation panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ─── Main Layout ─── */}
        <main className="flex flex-1 flex-col overflow-hidden min-w-0 w-full">
          <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950">
            {children}
          </div>
        </main>
      </>
    </MobileMenuProvider>
  );
}
