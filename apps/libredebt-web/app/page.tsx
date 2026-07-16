/**
 * app/page.tsx — Root Marketing Portfolio Page
 *
 * Server-side asynchronous session routing combined with a zero-JS marketing block.
 * Refactored to pass standard color-token tests and scale structural metadata anchors.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";

import { MarketingNavbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { SocialProofSection } from "@/components/marketing/social-proof-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { AnalyticsSection } from "@/components/marketing/analytics-section";
import { DebtStrategiesSection } from "@/components/marketing/debt-strategies-section";
import { ReminderSection } from "@/components/marketing/reminder-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "LibreDebt — Track · Plan · Settle · Be Free",
  description:
    "Track every debt, record every payment, and follow smart payoff strategies that help you become debt-free faster. Free forever on the basic plan.",
  keywords: [
    "debt tracker",
    "debt payoff",
    "debt snowball",
    "debt avalanche",
    "personal finance",
    "Nigeria",
    "fintech",
    "debt management",
  ],
  metadataBase: new URL("https://libredebt.com"),
  openGraph: {
    title: "LibreDebt — Take Control of Your Debt",
    description:
      "Track debts, record payments, receive reminders, and follow payoff strategies that help you become debt-free faster.",
    type: "website",
    url: "https://libredebt.com",
    locale: "en_NG", // Regionalized West Africa localization context locale
    siteName: "LibreDebt",
  },
  twitter: {
    card: "summary_large_image",
    title: "LibreDebt — Take Control of Your Debt",
    description:
      "Track debts, record payments, receive reminders, and follow payoff strategies that help you become debt-free faster.",
  },
};

export default async function RootPage() {
  // Server-side auth check — fast evaluation before mounting content tree
  const session = await getSession();

  if (session) {
    redirect("/overview");
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50">
      {/* ─── Keyboard Focus Access Anchor ───────────────────────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all"
      >
        Skip to main content
      </a>

      {/* Global Navigation Hub */}
      <MarketingNavbar />

      {/* ─── Conversions Pipeline Flow Matrix ────────────────────────────── */}
      <main id="main-content">
        <HeroSection />
        <SocialProofSection />
        <ProblemSection />
        <FeaturesSection />
        <AnalyticsSection />
        <DebtStrategiesSection />
        <ReminderSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>

      {/* Global Page Closure Layer */}
      <Footer />
    </div>
  );
}
