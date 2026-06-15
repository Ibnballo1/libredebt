/**
 * components/layout/sidebar.tsx
 *
 * The primary application navigation sidebar canvas.
 * Implements a classic high-contrast fintech layout split (Slate-900 / Zinc-950 background)
 * to anchor the layout workspace structure against light main dashboard panels.
 */
import Link from "next/link";
import { type User } from "better-auth"; // Adjust this import based on your exact BetterAuth model location
import { SidebarNav } from "./sidebar-nav";
import { SidebarUser } from "./sidebar-user";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    subscriptionTier?: string;
  };
}

export async function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 dark:bg-zinc-950">
      {/* ─── Brand Logo Branding Container ─────────────────────────── */}
      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <Link href="/overview" className="flex items-center gap-2.5 group">
          {/*
           * Minimalist architectural logo mark: simple "L" geometry
           * rendered cleanly using a vibrant emerald fill.
           */}
          <div className="relative h-7 w-7 flex-shrink-0">
            <div className="absolute inset-0 rounded-md bg-emerald-500 group-hover:bg-emerald-400 transition-colors" />
            <div className="absolute bottom-1 left-1 h-3.5 w-1.5 rounded-sm bg-slate-900 dark:bg-zinc-950" />
            <div className="absolute bottom-1 left-1 h-1.5 w-4 rounded-sm bg-slate-900 dark:bg-zinc-950" />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-white leading-none">
              LibreDebt
            </span>
            <span className="text-[10px] tracking-widest text-slate-500 uppercase leading-none mt-1 font-medium">
              Debt Tracker
            </span>
          </div>
        </Link>
      </div>

      {/* ─── Navigation Link Registry ───────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <SidebarNav />
      </div>

      {/* ─── Bottom Profile / Subscription Block ───────────────────── */}
      <div className="border-t border-slate-800 p-3">
        <SidebarUser
          name={user.name}
          email={user.email}
          image={user.image ?? undefined}
          tier={user.subscriptionTier as "free" | "pro"}
        />
      </div>
    </aside>
  );
}
