/**
 * app/(dashboard)/receivables/[id]/edit/page.tsx — Edit Receivable
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-session";
import { getReceivableById } from "@/server/services/receivable.service";
import { Navbar } from "@/components/layout/navbar";
import { ReceivableForm } from "@/components/receivable/receivable-form";

export const metadata: Metadata = { title: "Edit Receivable" };

type EditReceivablePageProps = { params: Promise<{ id: string }> };

export default async function EditReceivablePage({
  params,
}: EditReceivablePageProps) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) notFound();
  const tier = user.subscriptionTier as "free" | "pro";

  const receivable = await getReceivableById(id, user.id);
  if (!receivable || receivable.status !== "active") notFound();

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Edit Receivable" tier={tier} />
      <div className="flex-1 p-6 max-w-2xl">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <ReceivableForm
            mode="edit"
            receivableId={id}
            initialValues={{
              name: receivable.name,
              debtorName: receivable.debtorName,
              debtorPhone: receivable.debtorPhone ?? null,
              debtorRelationship: receivable.debtorRelationship ?? null,
              originalAmountMinor: receivable.originalAmountMinor,
              currency: receivable.currency,
              expectedByDate: receivable.expectedByDate ?? null,
              notes: receivable.notes ?? null,
            }}
          />
        </div>
      </div>
    </div>
  );
}
