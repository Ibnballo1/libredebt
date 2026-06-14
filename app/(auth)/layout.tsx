/**
 * app/(auth)/layout.tsx — Auth Page Shell
 *
 * Minimal centered container optimized for security access views (Login, Registration).
 * Provides structural isolation away from standard dashboard sidebars or navigation bars
 * to ensure focused user flows and establish a reliable, distraction-free entry boundary.
 */
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50/50 py-12 dark:bg-slate-950">
      {/* Subtle Dot Grid Canvas
        Renders an ultra-light mathematical visual texture onto the layout floor.
        Ensures smooth hardware acceleration scaling across high-DPI displays.
      */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Structured Content Shell Wrapper */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-4">
        {/* Brand Architecture Identification Badge */}
        <div className="flex items-center gap-3 mb-8 selection:bg-transparent">
          <div className="relative h-8 w-8 flex-shrink-0">
            <div className="absolute inset-0 rounded-md bg-slate-900 dark:bg-slate-50" />
            <div className="absolute bottom-1 left-1 h-4 w-1.5 rounded-sm bg-emerald-500" />
            <div className="absolute bottom-1 left-1 h-1.5 w-4 rounded-sm bg-emerald-500" />
          </div>

          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50 leading-none">
              {siteConfig.name}
            </span>
            <span className="text-[9px] tracking-widest text-slate-400 font-medium uppercase leading-none mt-1">
              {siteConfig.tagline}
            </span>
          </div>
        </div>

        {/* Child Form Authentication Layouts */}
        {children}

        {/* Hardened Trust Anchor Subtext Block */}
        <p className="mt-8 text-center text-xs text-slate-400 max-w-xs leading-normal">
          Your financial data is completely encrypted and never shared with
          third parties.
        </p>
      </div>
    </div>
  );
}
