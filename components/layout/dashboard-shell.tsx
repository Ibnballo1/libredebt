"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

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
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const pathname = usePathname();

  const isMobileDrawerOpen = mobileOpen && mobileOpenPath === pathname;

  // Lock root background layout scrolling while the responsive layout overlay layer is active
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

  /**
   * Deep-walks children elements to inject the mobile menu handler into the component tree.
   * This bridges page-level Navbars to the layout drawer toggle without messy context managers.
   */
  const childrenWithMobileTrigger = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(
        child as React.ReactElement<{ onMobileMenuClick?: () => void }>,
        {
          onMobileMenuClick: () => {
            setMobileOpenPath(pathname);
            setMobileOpen(true);
          },
        },
      );
    }
    return child;
  });

  return (
    <>
      {/* ─── Responsive Sidebar Mobile Drawer Overlay ───────────────────────── */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop Blur Mask */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slider Core Container */}
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col animate-in slide-in-from-left duration-200">
            <Sidebar user={user} />

            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3.5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label="Close navigation panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Viewport Core Layout Canvas ───────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden min-w-0 w-full">
        <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {childrenWithMobileTrigger}
        </div>
      </main>
    </>
  );
}
