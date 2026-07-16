/**
 * app/(dashboard)/receivables/new/page.tsx — Add Receivable
 */

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-session";
import { Navbar } from "@/components/layout/navbar";
import { ReceivableForm } from "@/components/receivable/receivable-form";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Add Receivable" };

export default async function NewReceivablePage() {
  const user = await requireUser();
  if (!user) notFound();
  const tier = user.subscriptionTier as "free" | "pro";

  return (
    <div className="flex flex-col flex-1">
      <Navbar
        title="Add Receivable"
        description="Record money someone owes you"
        tier={tier}
      />
      <div className="flex-1 p-6 max-w-2xl">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <ReceivableForm mode="create" />
        </div>
      </div>
    </div>
  );
}
