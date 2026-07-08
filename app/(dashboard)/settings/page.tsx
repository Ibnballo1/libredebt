// app/(dashboard)/settings/page.tsx

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-session";
import {
  getActiveSubscription,
  isInTrial,
  trialDaysRemaining,
} from "@/server/services/billing.service";
import { Navbar } from "@/components/layout/navbar";
import { BillingTab } from "@/components/billing/billing-tab";
import { SettingsTabs } from "@/components/billing/settings-tabs";
import { ProfileTab } from "@/components/profile/profile-tab";
import { PaymentSuccessOverlay } from "@/components/billing/payment-success-overlay";

export const metadata: Metadata = { title: "Settings" };

type SettingsPageProps = {
  searchParams: Promise<{ tab?: string; status?: string }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const params = await searchParams;
  const tab = params.tab ?? "profile";
  const status = params.status;

  // Re-fetch data whenever the status changes
  const user = await requireUser();

  if (!user) {
    throw new Error("User not found");
  }
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  const showPaymentSuccess = status === "success" && tab === "billing";
  const subscription = await getActiveSubscription(user.id);
  const inTrial = isInTrial(user.createdAt);
  const daysLeft = trialDaysRemaining(user.createdAt);

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Settings" tier={tier} />

      <div className="flex-1 p-6 max-w-2xl">
        {showPaymentSuccess ? (
          <PaymentSuccessOverlay />
        ) : (
          <>
            <SettingsTabs activeTab={tab} />
            <div className="mt-6">
              {tab === "profile" && (
                <ProfileTab
                  user={{ name: user.name, email: user.email, currency }}
                />
              )}
              {tab === "billing" && (
                <BillingTab
                  key={status || "default"}
                  tier={tier}
                  isInTrial={inTrial}
                  trialDaysLeft={daysLeft}
                  subscription={
                    subscription
                      ? {
                          provider: "paystack",
                          status: subscription.status,
                          currentPeriodEnd: subscription.currentPeriodEnd,
                        }
                      : null
                  }
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
