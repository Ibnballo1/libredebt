/**
 * app/(admin)/admin/users/page.tsx — Admin Users Directory
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserCheck, Shield, Layers } from "lucide-react";
import { searchUsers } from "@/server/services/admin.service";
import { formatDate, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — Users" };

type UsersPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q ?? "";
  const usersList = await searchUsers(query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight md:text-2xl">
          System Users
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Observe and audit all active platform user ledger metrics.
        </p>
      </div>

      {/* ── Search Input Box Form ── */}
      <form
        method="GET"
        action="/admin/users"
        className="relative w-full max-w-md"
      >
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#475569]" />
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search users by name or email address..."
          className="w-full bg-[#11161F] border border-[#1E2530] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#475569] transition-colors"
        />
      </form>

      {/* ── Directory Layout Structure ── */}
      {usersList.length === 0 ? (
        <div className="rounded-lg border border-[#1E2530] bg-[#11161F] p-12 text-center">
          <Layers className="mx-auto h-6 w-6 text-[#475569] mb-2" />
          <p className="text-sm font-semibold text-white">No accounts found</p>
          <p className="text-xs text-[#475569] mt-0.5">
            No system accounts matched your search keyword criteria.
          </p>
        </div>
      ) : (
        <div className="w-full">
          {/* Mobile Card Layout (Visible only on standard mobile viewports) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {usersList.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="block rounded-lg border border-[#1E2530] bg-[#11161F] p-4 hover:border-[#475569] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  {user.subscriptionTier === "pro" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-400">
                      <Shield className="h-2 w-2" /> pro
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#1E2530] px-2 py-0.5 text-[9px] font-bold uppercase text-[#64748B]">
                      <UserCheck className="h-2 w-2" /> free
                    </span>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-[#1E2530]/60 flex items-center justify-between text-[11px] text-slate-300">
                  <div>
                    <span className="text-[#475569]">Debts:</span>{" "}
                    {user.activeDebtCount}
                  </div>
                  <div className="font-semibold text-white">
                    {formatCurrency(user.totalOutstandingMinor, {
                      currency: "NGN",
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Matrix Layout Table (Hidden on hand-held items) */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-[#1E2530] bg-[#11161F]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2530] bg-[#0B0E14] text-[#475569] font-semibold select-none">
                  <th className="p-4">User</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Active Debts</th>
                  <th className="p-4">Outstanding</th>
                  <th className="p-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2530] text-slate-300">
                {usersList.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#141B26] transition-colors group cursor-pointer"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="block focus:outline-none"
                      >
                        <p className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-[#475569] mt-0.5">
                          {user.email}
                        </p>
                      </Link>
                    </td>
                    <td className="p-4 align-middle">
                      {user.subscriptionTier === "pro" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
                          <Shield className="h-2.5 w-2.5" /> pro
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1E2530] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
                          <UserCheck className="h-2.5 w-2.5" /> free
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium tabular-nums">
                      {user.activeDebtCount}{" "}
                      {user.activeDebtCount === 1 ? "debt" : "debts"}
                    </td>
                    <td className="p-4 font-semibold text-white tabular-nums">
                      {formatCurrency(user.totalOutstandingMinor, {
                        currency: "NGN",
                        compact: false,
                      })}
                    </td>
                    <td className="p-4 text-[#64748B] tabular-nums">
                      {formatDate(user.createdAt, "short")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
