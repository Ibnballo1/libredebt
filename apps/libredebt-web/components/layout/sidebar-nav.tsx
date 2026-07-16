"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { primaryNav, bottomNav } from "@/config/nav";
import type { NavItem } from "@/config/nav";

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();

  // Exact path equality string checks to safeguard nested sub-route evaluation loops
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 relative",
        isActive
          ? [
              "bg-emerald-500/10 text-white font-semibold",
              "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
              "before:h-5 before:w-0.5 before:rounded-full before:bg-emerald-500",
            ]
          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0 transition-colors",
          isActive
            ? "text-emerald-400"
            : "text-slate-500 group-hover:text-slate-300 dark:text-zinc-500 group-hover:dark:text-zinc-300",
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>

      {item.badge === "pro" && (
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/10">
          Pro
        </span>
      )}
    </Link>
  );
}

export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-6">
      {/* Primary Context Navigation Maps */}
      {primaryNav.map((section, sectionIndex) => (
        <div key={sectionIndex} className="flex flex-col gap-1">
          {section.title && (
            <p className="mb-1.5 px-3 text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-zinc-600">
              {section.title}
            </p>
          )}
          {section.items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      ))}

      {/* Account Control Settings Sections Pushed Down */}
      <div className="mt-auto flex flex-col gap-1">
        <p className="mb-1.5 px-3 text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-zinc-600">
          Account
        </p>
        {bottomNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </nav>
  );
}
