/**
 * app/(dashboard)/settings/page.tsx — Settings Page (FINAL)
 *
 * Detects ?status=success in the URL (set by Paystack/Stripe callback)
 * and renders the PaymentSuccessOverlay instead of the normal billing tab.
 * Once the overlay confirms Pro status and the user clicks "Go to
 * dashboard", they are pushed to /overview.
 */

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-session";
import { getActiveSubscription } from "@/server/services/billing.service";
import { Navbar } from "@/components/layout/navbar";
import { BillingTab } from "@/components/billing/billing-tab";
import { SettingsTabs } from "@/components/billing/settings-tabs";
import { ProfileTab } from "@/components/profile/profile-tab";
import { PaymentSuccessOverlay } from "@/components/billing/payment-success-overlay";

export const metadata: Metadata = { title: "Settings" };

type SettingsPageProps = {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    provider?: string;
    reference?: string; // Add this line to accept Paystack references
    trxref?: string;
  }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const params = await searchParams;
  const tab = params.tab ?? "profile";
  const status = params.status;
  const user = await requireUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  const tier = user.subscriptionTier as "free" | "pro";
  const currency = user.currency ?? "NGN";

  // Payment success redirect — show confirmation overlay regardless of
  // current tier (webhook may not have fired yet when the user lands here)
  // Mount overlay if explicitly marked successful OR if redirected back with a transaction reference
  const showPaymentSuccess =
    tab === "billing" && (status === "success" || !!params.reference);

  const subscription = await getActiveSubscription(user.id);

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Settings" tier={tier} />

      <div className="flex-1 p-6 max-w-2xl">
        {showPaymentSuccess ? (
          // Full-page confirmation overlay — replaces the tab UI entirely
          // while waiting for webhook confirmation, then shows plan details
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
                  tier={tier}
                  currency={currency}
                  subscription={
                    subscription
                      ? {
                          provider: subscription.provider as
                            | "paystack"
                            | "stripe",
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
