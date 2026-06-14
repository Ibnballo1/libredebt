/**
 * config/nav.ts — Navigation Configuration Registry
 *
 * Single point of truth defining application navigation structures.
 * Read concurrently by desktop layout structures, responsive drawer sheets,
 * and contextual access routing guards.
 */
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  TrendingDown,
  Bell,
  Settings,
  HelpCircle,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: "pro" | "new";
  disabled?: boolean;
  /** Development rollout phase tracking index to cleanly map future feature releases */
  stage?: 1 | 2 | 3 | 4 | 5;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

/**
 * Global Feature Flag Phase Runtime Limit
 * Modify this flag to automatically activate or safely grey-out items based on deployment milestones.
 */
const CURRENT_RELEASE_STAGE = 1;

/**
 * Primary Navigation Modules
 * Rendered within the upper section of the primary navigation pane canvas.
 */
export const primaryNav: NavSection[] = [
  {
    items: [
      {
        label: "Overview",
        href: "/overview",
        icon: LayoutDashboard,
        stage: 1,
        disabled: false,
      },
      {
        label: "Debts",
        href: "/debts",
        icon: CreditCard,
        stage: 1,
        disabled: false,
      },
      {
        label: "Payments",
        href: "/payments",
        icon: Receipt,
        stage: 1,
        disabled: false,
      },
    ],
  },
  {
    title: "Pro Features",
    items: [
      {
        label: "Strategies",
        href: "/strategies",
        icon: TrendingDown,
        badge: "pro",
        stage: 3,
        disabled: 3 > CURRENT_RELEASE_STAGE,
      },
      {
        label: "Reminders",
        href: "/reminders",
        icon: Bell,
        badge: "pro",
        stage: 2,
        disabled: 2 > CURRENT_RELEASE_STAGE,
      },
    ],
  },
];

/**
 * Bottom Utilities Module
 * Anchored explicitly to the baseline element of the interactive sidebar shell.
 */
export const bottomNav: NavItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    stage: 1,
    disabled: false,
  },
  {
    label: "Help",
    href: "/help",
    icon: HelpCircle,
    stage: 1,
    disabled: false,
  },
];
