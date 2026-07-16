/**
 * components/admin/admin-user-search.tsx
 *
 * Search box that updates the ?q= URL param. The page (a Server
 * Component) re-runs searchUsers() on navigation — no client-side
 * fetching needed, just a debounced router.push.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

export function AdminUserSearch({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email…"
        className="w-full rounded-lg border border-[#1E2530] bg-[#11161F] pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#475569] outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-colors"
      />
    </div>
  );
}
