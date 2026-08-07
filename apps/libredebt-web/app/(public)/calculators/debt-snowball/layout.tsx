import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Debt Snowball Calculator | LibreDebt",
  description:
    "Calculate your exact debt-free date using the Debt Snowball strategy. See how adding extra monthly payments accelerates your payoff schedule.",
  keywords: [
    "debt snowball calculator",
    "payoff calculator",
    "debt payoff schedule",
    "free debt tool",
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
