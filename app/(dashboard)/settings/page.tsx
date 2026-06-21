/**
 * app/(dashboard)/settings/page.tsx — Settings Page (UPDATED)
 *
 * Replaces the Stage 6 stub. The "profile" tab now renders the full
 * ProfileTab component instead of a placeholder paragraph.
 */

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-session";
import { getActiveSubscription } from "@/server/services/billing.service";
import { Navbar } from "@/components/layout/navbar";
import { BillingTab } from "@/components/billing/billing-tab";
import { SettingsTabs } from "@/components/billing/settings-tabs";
import { ProfileTab } from "@/components/profile/profile-tab";

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
          {tab === "profile" && (
            <ProfileTab
              user={{ name: user.name, email: user.email, currency }}
            />
          )}

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
        </div>
      </div>
    </div>
  );
}
