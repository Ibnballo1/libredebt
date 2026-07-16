/**
 * app/privacy/page.tsx — Privacy Policy Page
 *
 * A clean, highly legible, accessible legal disclosure layout
 * that shifts gracefully between light and dark themes.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | LibreDebt",
  description:
    "Learn how LibreDebt safely secures, manages, and protects your private financial data.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "July 15, 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 mb-12 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to landing page
        </Link>

        {/* Header */}
        <header className="border-b border-slate-200 dark:border-slate-800 pb-8 mb-12">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-3">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Data Protection
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
            Last Updated:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {lastUpdated}
            </span>
          </p>
        </header>

        {/* Content Body */}
        <div className="space-y-12 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          <section>
            <p>
              At <strong>LibreDebt</strong>, we take your financial privacy
              extremely seriously. We believe that mapping your path to
              financial freedom shouldn&apos;t cost you control of your personal
              data. This Privacy Policy outlines exactly how we collect, handle,
              and ruthlessly safeguard your information when using our platform.
            </p>
          </section>

          {/* Core Core Commitments Callout */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500" /> Our Absolute Data
              Guarantee
            </h3>
            <p className="text-sm">
              We will{" "}
              <strong>
                never sell, rent, trade, or distribute your financial profiles
                or debt entries
              </strong>{" "}
              to third-party lenders, credit bureaus, collection agencies, or
              advertising networks. Your numbers stay private to you.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-xs flex h-5 w-5 items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                1
              </span>
              Information We Collect
            </h2>
            <p>
              To effectively track, optimize, and organize your debt repayment
              schedules, we securely process the following categories of
              information:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong className="text-slate-900 dark:text-slate-200">
                  Account Information:
                </strong>{" "}
                Your email address and basic profile credentials provided during
                sign-up to manage your secure session.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-200">
                  Financial Records:
                </strong>{" "}
                The individual debt balances, interest margins, outstanding
                liabilities, and minimum payment benchmarks you input manually.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-200">
                  Payment Information:
                </strong>{" "}
                Transactions are handled seamlessly via our secure third-party
                payment gateways (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Stripe / Paystack
                </span>
                ). We do not record or retain your physical credit card digits
                or raw banking credentials on our infrastructure.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-xs flex h-5 w-5 items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                2
              </span>
              How We Use Your Information
            </h2>
            <p>
              Your details are processed strictly under legitimate operations to
              support your goals:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                Configuring and maintaining your active, personal LibreDebt
                profile dashboard.
              </li>
              <li>
                Calculating automated debt-payoff timelines using our customized
                Snowball or Avalanche visual strategy matrices.
              </li>
              <li>
                Processing infrastructure billing tiers and verifying active Pro
                subscriptions.
              </li>
              <li>
                Dispatching explicit account operational indicators, automated
                payment reminders, and proactive financial system notifications.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-xs flex h-5 w-5 items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                3
              </span>
              Security and Encryption Protocol
            </h2>
            <p>
              We implement industry-grade protective logic, utilizing robust
              SSL/TLS transit encryptions and secure database layouts. Access to
              your portfolio balances is strictly walled off behind system
              configurations, keeping your profile isolated from intercept
              hazards or public vectors.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-xs flex h-5 w-5 items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                4
              </span>
              Your Data Rights & Deletion
            </h2>
            <p>
              In strict adherence to regional framework standards (such as the{" "}
              <strong>Nigeria Data Protection Act [NDPA]</strong> and{" "}
              <strong>GDPR</strong>), you preserve final authority over your
              information ecosystem. At any given notice, you maintain the
              absolute right to fetch, amend, or command the{" "}
              <strong>complete, permanent erasure</strong> of your account and
              entire debt history ledger right out of our database networks.
            </p>
          </section>

          {/* Footer Contact Callout */}
          <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-200">
                Have questions or want your data erased?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Our secure support pipeline is monitored daily.
              </p>
            </div>
            <a
              href="mailto:support@libredebt.com"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm"
            >
              support@libredebt.com
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
