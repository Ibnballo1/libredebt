/**
 * app/(dashboard)/debts/[id]/edit/page.tsx — Edit Debt Page
 *
 * Loads the existing debt and pre-fills the form.
 * Original amount is displayed as locked (cannot be changed).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-session";
import { getDebtById } from "@/server/services/debt.service";
import { Navbar } from "@/components/layout/navbar";
import { DebtForm } from "@/components/debt/debt-form";

type EditDebtPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: EditDebtPageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const debt = await getDebtById(id, user.id);
  if (!debt) return { title: "Debt not found" };
  return { title: `Edit — ${debt.name}` };
}

export default async function EditDebtPage({ params }: EditDebtPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const tier = user.subscriptionTier as "free" | "pro";

  const debt = await getDebtById(id, user.id);
  if (!debt) notFound();

  // Archived debts cannot be edited
  if (debt.status === "archived") notFound();

  return (
    <div className="flex flex-col flex-1">
      <Navbar
        title="Edit Debt"
        breadcrumb={[
          { label: "Debts", href: "/debts" },
          { label: debt.name, href: `/debts/${id}` },
          { label: "Edit" },
        ]}
        tier={tier}
      />

      <div className="flex-1 p-6">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-1">
              Edit debt
            </h2>
            <p className="text-sm text-[#64748B]">
              Update the details below. The original amount is fixed and cannot
              be changed — it anchors your repayment progress history.
            </p>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <DebtForm
              mode="edit"
              debtId={id}
              initialValues={{
                name: debt.name,
                creditor: debt.creditor,
                originalAmountMinor: debt.originalAmountMinor,
                interestRateBps: debt.interestRateBps,
                minimumPaymentMinor: debt.minimumPaymentMinor,
                // ✨ FIXED: Preserve numeric type for dueDay (use null when missing)
                dueDay: debt.dueDay ?? null,
                currency: debt.currency,
                // ✨ FIXED: Prevent React uncontrolled input warnings by replacing null values with standard empty strings
                notes: debt.notes ?? "",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
