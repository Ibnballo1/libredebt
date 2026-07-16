import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Lock,
  FileText,
  ArrowLeft,
} from "lucide-react";

export const metadata = {
  title: "Terms of Service | LibreDebt",
  description:
    "Read our terms of service and legal agreement prior to using the LibreDebt platform.",
};

export default function TermsPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-200">
      {/* Header Navigation Link */}
      <header className="mx-auto max-w-4xl px-6 pt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-6 py-8 pb-24">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-12">
          {/* Page Header */}
          <div className="border-b border-slate-100 pb-8 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-3">
              <FileText className="h-6 w-6" />
              <span className="text-sm font-semibold tracking-wider uppercase">
                Legal Agreements
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
              Last Updated: July 15, 2026
            </p>
          </div>

          {/* Quick Notice Banner / Disclaimer */}
          <div className="mt-8 rounded-xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-950/40 dark:bg-amber-950/10">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-300 text-sm md:text-base">
                  Financial Disclaimer &amp; Scope of Services
                </h3>
                <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-400/90 leading-relaxed">
                  LibreDebt is a software utility designed for planning,
                  organizing, and simulating personal debt payoff strategies. We
                  are <strong>not</strong> financial advisors, credit repair
                  organizations, or legal practitioners. All calculations,
                  graphs, and scenarios are for educational and informational
                  purposes only.
                </p>
              </div>
            </div>
          </div>

          {/* Core Terms Body */}
          <div className="mt-10 space-y-10">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">1.</span>{" "}
                Acceptance of Terms
              </h2>
              <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed md:text-base">
                By creating an account, upgrading to a premium tier, or
                accessing LibreDebt (collectively, the &ldquo;Services&rdquo;),
                you confirm that you are at least 18 years of age and agree to
                be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you
                disagree with any portion of these Terms, you must immediately
                terminate use of our web and mobile applications.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">2.</span>{" "}
                No Financial or Investment Advice
              </h2>
              <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed md:text-base">
                Our tools, engines, simulations, and algorithms run calculations
                based on mathematical debt payoff methods (e.g., Debt Snowball,
                Debt Avalanche) using variables you manually supply.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600 dark:text-zinc-300 md:text-base">
                <li>
                  We do not guarantee the completeness, reliability, or accuracy
                  of payoff plans.
                </li>
                <li>
                  Your financial situation is unique. You are urged to consult a
                  certified financial planner or tax expert before executing
                  financial decisions.
                </li>
                <li>
                  You agree that LibreDebt is not liable for any personal or
                  organizational financial losses resulting from actions taken
                  while utilizing our calculations.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">3.</span>{" "}
                Security, Accounts &amp; Authentication
              </h2>
              <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed md:text-base">
                We handle authentication, session parsing, and profiles through
                our secure integration of <code>@klasira/auth</code>.
              </p>
              <div className="flex gap-4 items-start rounded-xl bg-slate-50 p-4 dark:bg-zinc-800/40">
                <Lock className="h-5 w-5 mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 leading-normal">
                  You are solely responsible for securing your own login
                  sessions, credentials, device-level access tokens, and
                  passwords. We will never ask for password credentials. Notify
                  us immediately at <strong>support@libredebt.com</strong> if
                  you suspect unauthorized access.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">4.</span>{" "}
                Payments, Subscriptions &amp; Billing (Paystack)
              </h2>
              <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed md:text-base">
                LibreDebt offers premium functionality (such as Pro automated
                simulations or push notifications) on recurring 6-month or
                1-year subscription terms.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div className="rounded-xl border border-slate-100 p-5 dark:border-zinc-800">
                  <CreditCard className="h-5 w-5 text-indigo-500 mb-2" />
                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                    Paystack Gateway
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    All payment processing is isolated securely through
                    Paystack. We never directly store or handle your credit card
                    pins or account passwords.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 p-5 dark:border-zinc-800">
                  <ShieldCheck className="h-5 w-5 text-indigo-500 mb-2" />
                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                    Automatic Renewal
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    Your subscription will automatically renew at the current
                    tier rate unless cancelled within our settings interface
                    prior to the renewal date.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">5.</span>{" "}
                Acceptable Use Policy
              </h2>
              <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed md:text-base">
                You agree not to scrape, inject harmful scripts, or exploit
                server infrastructure. You agree not to attempt to bypass
                restrictions placed on API routing parameters or bypass any
                client-to-server security handshakes.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">6.</span>{" "}
                Limitation of Liability
              </h2>
              <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed md:text-base">
                IN NO EVENT SHALL LIBREDEBT, ITS FOUNDERS, EMPLOYEES, OR AGENTS
                BE LIABLE TO YOU FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
                OR CONSEQUENTIAL DAMAGES WHATSOEVER RESULTING FROM ERRORS,
                INACCURACIES, SYSTEM OUTAGES, OR IMPROPER DATA STORAGE IN
                CONNECTION WITH OUTCOME SIMULATORS OR PAYMENT RUNTIMES.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">7.</span>{" "}
                Governing Law
              </h2>
              <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed md:text-base">
                These terms are governed by and construed in accordance with the
                laws applicable in Lagos, Nigeria, without giving effect to
                conflicts of laws principles. Any legal actions or proceedings
                arising from these Terms will be filed exclusively in the
                relevant courts located within Lagos.
              </p>
            </section>
          </div>

          {/* Footer of the Box */}
          <div className="mt-12 border-t border-slate-100 pt-8 dark:border-zinc-800 text-center">
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Questions regarding these terms? Get in touch at{" "}
              <a
                href="mailto:support@libredebt.com"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                support@libredebt.com
              </a>
            </p>
          </div>
        </div>

        {/* Outer Page Footer */}
        <p className="mt-8 text-center text-xs text-slate-400 dark:text-zinc-500">
          &copy; {currentYear} LibreDebt Team. All rights reserved. Built for
          true financial freedom.
        </p>
      </main>
    </div>
  );
}
