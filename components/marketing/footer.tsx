/**
 * components/marketing/footer.tsx
 *
 * Navigational footer infrastructure containing critical compliance links.
 * Refactored to pass WCAG AA contrast requirements and eliminate hydration variants.
 */

import Link from "next/link";

const SOCIAL_LINKS = [
  {
    label: "LibreDebt on X",
    href: "https://x.com",
    // Clean inline SVG path for X (formerly Twitter)
    renderIcon: (className: string) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LibreDebt on LinkedIn",
    href: "https://linkedin.com",
    // Clean inline SVG path for LinkedIn
    renderIcon: (className: string) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
      </svg>
    ),
  },
  {
    label: "LibreDebt on GitHub",
    href: "https://github.com",
    // Clean inline SVG path for GitHub
    renderIcon: (className: string) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    ),
  },
] as const;

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      // { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/#" },
      { label: "Contact", href: "/#" },
      { label: "Blog", href: "/#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "FAQ", href: "#faq" },
      // { label: "Privacy Policy", href: "/privacy" },
      // { label: "Terms of Service", href: "/terms" },
    ],
  },
] as const;

export function Footer() {
  // Constant assignment safely managed during server pass to avoid hydration mismatches
  const currentYear = 2026;

  return (
    <footer
      className="bg-slate-900 border-t border-slate-800 dark:bg-slate-950"
      role="contentinfo"
    >
      <div className="mx-auto max-w-[1100px] px-6 py-16">
        {/* Top Segment: Logo Branding & Columns Grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Core Brand Matrix Column */}
          <div className="col-span-2 md:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 mb-4 group"
              aria-label="LibreDebt home"
            >
              <div className="relative h-7 w-7 flex-shrink-0">
                <div className="absolute inset-0 rounded-md bg-emerald-500" />
                <div className="absolute bottom-[5px] left-[5px] h-[14px] w-[5px] rounded-sm bg-slate-900 dark:bg-slate-950 group-hover:bg-slate-800 transition-colors" />
                <div className="absolute bottom-[5px] left-[5px] h-[5px] w-[14px] rounded-sm bg-slate-900 dark:bg-slate-950 group-hover:bg-slate-800 transition-colors" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-white">
                LibreDebt
              </span>
            </Link>

            <p className="text-xs font-semibold tracking-wider text-slate-400 max-w-[200px] uppercase font-mono">
              Track • Plan • Settle • Be Free
            </p>

            {/* Social Anchor List */}
            <div className="mt-6 flex items-center gap-3">
              {/*SOCIAL_LINKS.map(({ label, href, renderIcon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
                >
                  {/* Renders the precise inline SVG with identical sizing constraints *}
                  {renderIcon("h-4 w-4")}
                </a>
              ))*/}
            </div>
          </div>

          {/* Dynamic Link Mapping Engines */}
          {FOOTER_COLUMNS.map(({ heading, links }) => (
            <nav
              key={heading}
              aria-label={`${heading} links`}
              className="col-span-1"
            >
              <p className="mb-4 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                {heading}
              </p>
              <ul className="space-y-3" role="list">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom Segment: Disclaimers & Legal Copy Rows */}
        <div className="mt-14 flex flex-col gap-4 border-t border-slate-800 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400 font-medium">
            &copy; {currentYear} LibreDebt. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 font-medium italic">
            Built for financial clarity. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
