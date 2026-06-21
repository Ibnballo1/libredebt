/**
 * app/(dashboard)/settings/page.tsx — Settings Page
 *
 * Tab-based settings page. This stage implements the Billing tab fully.
 */

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-session";
import { getActiveSubscription } from "@/server/services/billing.service";
import { Navbar } from "@/components/layout/navbar";
import { BillingTab } from "@/components/billing/billing-tab";
import { SettingsTabs } from "@/components/billing/settings-tabs";

export const metadata: Metadata = { title: "Settings" };

type SettingsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const { tab = "profile" } = await searchParams;
  const user = await requireUser();
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  const subscription =
    tier === "pro" ? await getActiveSubscription(user.id) : null;

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Settings" tier={tier} />

      <div className="flex-1 p-6 max-w-2xl">
        <SettingsTabs activeTab={tab} />

        <div className="mt-6">
          {tab === "billing" && (
            <BillingTab
              tier={tier}
              currency={currency}
              subscription={
                subscription
                  ? {
                      provider: subscription.provider as "paystack" | "stripe",
                      status: subscription.status,
                      currentPeriodEnd: subscription.currentPeriodEnd,
                    }
                  : null
              }
            />
          )}

          {tab === "profile" && (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <p className="text-sm text-[#64748B]">
                Profile settings — name, email, currency preference.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
