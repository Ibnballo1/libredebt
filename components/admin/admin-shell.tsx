"use client";

import { useState } from "react";
import { Menu, X, ShieldAlert } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";

export function AdminShell({
  adminName,
  adminEmail,
  children,
}: {
  adminName: string;
  adminEmail: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F17]">
      {/* Desktop Sidebar Layout Wrapper */}
      <div className="hidden md:flex h-full w-60 flex-shrink-0">
        <AdminSidebar adminName={adminName} adminEmail={adminEmail} />
      </div>

      {/* Mobile Drawer (Slide out overlay animation) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative flex w-full max-w-xs flex-1 flex-col animate-in slide-in-from-left duration-200">
            {/* Close Toggle Target Button inside Sidebar Canvas */}
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#1E2530] bg-[#0B0F17] text-[#64748B] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AdminSidebar
              adminName={adminName}
              adminEmail={adminEmail}
              onNavClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Viewport Workspace Area Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header Bar Section */}
        <header className="flex h-16 w-full items-center justify-between border-b border-[#1E2530] bg-[#0B0F17] px-4 md:hidden flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <p className="text-sm font-semibold text-white">Control Room</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#1E2530] text-[#64748B] hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Core Content Layout Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
