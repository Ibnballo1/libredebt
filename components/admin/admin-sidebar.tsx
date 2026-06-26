"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, LogOut, ShieldAlert } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
];

export function AdminSidebar({
  adminName,
  adminEmail,
  onNavClick,
}: {
  adminName: string;
  adminEmail: string;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="flex h-full w-full flex-col bg-[#0B0F17] border-r border-[#1E2530]">
      <div className="flex h-16 items-center gap-2.5 border-b border-[#1E2530] px-6 flex-shrink-0">
        <ShieldAlert className="h-5 w-5 text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-white leading-none">
            Control Room
          </p>
          <p className="text-[10px] text-[#64748B] mt-0.5">LibreDebt Admin</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-0.5",
                isActive
                  ? "bg-amber-400/10 text-amber-300"
                  : "text-[#64748B] hover:bg-[#1E2530] hover:text-[#94A3B8]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1E2530] p-3 flex-shrink-0">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-white truncate">{adminName}</p>
          <p className="text-[10px] text-[#64748B] truncate">{adminEmail}</p>
        </div>
        <button
          onClick={async () => {
            if (onNavClick) onNavClick();
            await signOut();
            router.push("/login");
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#64748B] hover:bg-[#1E2530] hover:text-[#94A3B8] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <Link
          href="/overview"
          onClick={onNavClick}
          className="block px-3 pt-2 text-[10px] text-[#475569] hover:text-[#64748B]"
        >
          ← Back to regular dashboard
        </Link>
      </div>
    </aside>
  );
}
