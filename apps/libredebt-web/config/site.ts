/**
 * config/site.ts — Central Application & Brand Specification
 *
 * Consolidates all global marketing SEO, open-graph metadata tags, social references,
 * and system platform naming spaces in a single source of truth.
 */
export const siteConfig = {
  name: "LibreDebt",
  shortName: "LibreDebt",
  tagline: "Track • Plan • Settle • Be Free",
  description:
    "Take control of your debt. Track what you owe, record every payment, and see exactly when you'll be free.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  mainNav: [],
  links: {
    twitter: "https://x.com/libredebt",
    github: "https://github.com/libredebt",
  },
  keywords: [
    "debt tracker",
    "debt payoff",
    "personal finance",
    "Nigeria",
    "fintech",
    "snowball method",
    "avalanche method",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
