"use client";

import { useRouter } from "next/navigation";
import { LogOut, ChevronUp, Sparkles } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type SidebarUserProps = {
  name: string;
  email: string;
  image?: string;
  tier: "free" | "pro";
};

/**
 * Generates profile initials from a user's full name.
 * Safe fallback guarantees characters even for non-spaced entries.
 */
function getInitials(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1)
    return (parts[0] ?? "??").substring(0, 2).toUpperCase();
  return (
    (
      (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
    ).toUpperCase() || "??"
  );
}

export function SidebarUser({ name, email, image, tier }: SidebarUserProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 outline-none",
            "hover:bg-slate-800/80 dark:hover:bg-zinc-900/80 group",
            "focus-visible:ring-2 focus-visible:ring-emerald-500/50",
          )}
        >
          <Avatar className="h-8 w-8 flex-shrink-0 border border-slate-800 dark:border-zinc-800">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="bg-slate-800 text-slate-400 text-xs font-semibold dark:bg-zinc-800 dark:text-zinc-500">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-white leading-tight">
              {name}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {tier === "pro" ? (
                <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                  <Sparkles className="h-2.5 w-2.5" />
                  Pro
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                  Free Plan
                </span>
              )}
            </div>
          </div>

          <ChevronUp className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={12}
        className="w-56 bg-slate-900 border-slate-800 text-slate-300 dark:bg-zinc-950 dark:border-zinc-800 shadow-xl"
      >
        <DropdownMenuLabel className="font-normal px-2.5 py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-white truncate">
              {name}
            </span>
            <span className="text-xs text-slate-400 dark:text-zinc-500 truncate">
              {email}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-slate-800 dark:bg-zinc-800" />

        {tier === "free" && (
          <>
            <DropdownMenuItem
              className="gap-2 px-2.5 py-2 text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10 cursor-pointer font-medium text-xs rounded-md"
              onClick={() => router.push("/settings?tab=billing")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade to Pro
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800 dark:bg-zinc-800" />
          </>
        )}

        <DropdownMenuItem
          className="gap-2 px-2.5 py-2 text-slate-400 focus:text-white focus:bg-slate-800 cursor-pointer font-medium text-xs rounded-md dark:text-zinc-400 dark:focus:bg-zinc-900"
          onClick={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
