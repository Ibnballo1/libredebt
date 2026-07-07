/**
 * emails/welcome.email.tsx — Welcome Email
 *
 * Sent immediately after a user signs up. Goals:
 * 1. Warmly confirm their account was created
 * 2. Inform them of the free tier limits (up to 3 active debts)
 * 3. Preview the Pro features they unlock when they upgrade
 * 4. Give a clear 3-step "how to get started" guide
 *
 * Tone: warm, human, not corporate. Short enough to actually be read.
 * Design: matches the LibreDebt brand — navy/emerald, Geist-style fonts.
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type WelcomeEmailProps = {
  userName: string;
  dashboardUrl: string;
};

export function WelcomeEmail({ userName, dashboardUrl }: WelcomeEmailProps) {
  const firstName = userName.split(" ")[0] ?? userName;

  const steps = [
    {
      number: "1",
      title: "Add your first debt",
      description:
        "Go to Debts → Add Debt. Enter the name, creditor, and amount. Track up to 3 active debts completely free as you begin your journey.",
    },
    {
      number: "2",
      title: "Record payments as you make them",
      description:
        "Every time you make a payment, log it in LibreDebt. This keeps your running ledger balance accurate and tracks your lifetime progress.",
    },
    {
      number: "3",
      title: "See who owes you",
      description:
        "Use the 'Who Owes Me' (Receivables) feature to monitor money owed to you by friends, family, or business partners alongside your ledger.",
    },
  ];

  return (
    <Html>
      <Head />
      <Preview>
        {`Welcome to LibreDebt, ${firstName} — your account is ready!`}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <table style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td>
                    <div style={styles.logoMark}>
                      <div style={styles.logoAccent} />
                    </div>
                  </td>
                  <td style={{ paddingLeft: 8 }}>
                    <Text style={styles.logoText}>LibreDebt</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Account Badge */}
          <Section style={{ marginBottom: 8 }}>
            <Text style={styles.trialBadge}>🚀 Free Account Activated</Text>
          </Section>

          {/* Main heading */}
          <Heading style={styles.heading}>Welcome aboard, {firstName}.</Heading>

          <Text style={styles.bodyText}>
            Your LibreDebt account is officially ready. You can dive in right
            now to track
            <strong> up to 3 active debts and receivables</strong> completely
            free. When you are ready to accelerate your plan, you can upgrade to
            a Pro subscription to remove all limits and unlock our premium
            payoff strategies.
          </Text>

          {/* CTA */}
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button style={styles.button} href={dashboardUrl}>
              Go to your dashboard
            </Button>
          </Section>

          <Hr style={styles.divider} />

          {/* Getting started guide */}
          <Text style={styles.sectionLabel}>HOW TO GET STARTED</Text>

          {steps.map((step) => (
            <Section key={step.number} style={styles.stepRow}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <tbody>
                  <tr>
                    <td
                      style={{ verticalAlign: "top", width: 36, paddingTop: 2 }}
                    >
                      <div style={styles.stepNumber}>{step.number}</div>
                    </td>
                    <td style={{ verticalAlign: "top", paddingLeft: 12 }}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>
          ))}

          <Hr style={styles.divider} />

          {/* Pro Features Showcase */}
          <Text style={styles.sectionLabel}>UNLOCK WITH LIBREDEBT PRO</Text>

          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              marginBottom: 24,
            }}
          >
            <tbody>
              {[
                "Unlimited active debt & tracking profiles",
                "Smart payment reminders (7, 3, and 1-day alerts)",
                "Automated Snowball & Avalanche math strategies",
                "Interactive 'What-If' visual payoff projections",
                "Advanced analytics graphs & ledger charts",
                "Clean receivable report exports (CSV & PDF)",
                "Priority developer support desk",
              ].map((feature) => (
                <tr key={feature}>
                  <td
                    style={{
                      width: 20,
                      paddingBottom: 8,
                      verticalAlign: "top",
                    }}
                  >
                    <Text style={styles.checkmark}>✦</Text>
                  </td>
                  <td style={{ paddingBottom: 8, paddingLeft: 8 }}>
                    <Text style={styles.featureText}>{feature}</Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing reminder */}
          <Section style={styles.pricingNote}>
            <Text style={styles.pricingText}>
              Ready for unlimited tracking? LibreDebt Pro plans cost just{" "}
              <strong>₦3,000 (~$2.00) for 6 months</strong> or{" "}
              <strong>₦5,500 (~$3.67) for a full year</strong>. You can upgrade
              securely anytime right from your account Settings.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Support */}
          <Text style={styles.bodyText}>
            If you have any questions or feedback as you configure your first
            ledger, simply hit reply or reach us at{" "}
            <Link href="mailto:support@libredebt.com" style={styles.link}>
              support@libredebt.com
            </Link>
            . We read every message.
          </Text>

          <Text style={{ ...styles.bodyText, marginTop: 16 }}>
            Here&apos;s to becoming debt-free, 🤝
            <br />
            <strong>The LibreDebt Team</strong>
          </Text>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            You received this email because you created a LibreDebt account. If
            this wasn&apos;t you,{" "}
            <Link href="mailto:support@libredebt.com" style={styles.footerLink}>
              let us know
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#F8FAFC",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    margin: 0,
    padding: "40px 0",
  },
  container: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    margin: "0 auto",
    maxWidth: 560,
    padding: "36px 40px",
  },
  header: {
    marginBottom: 28,
  },
  logoMark: {
    width: 28,
    height: 28,
    backgroundColor: "#0F172A",
    borderRadius: 6,
    position: "relative" as const,
    display: "inline-block",
  },
  logoAccent: {
    width: 10,
    height: 10,
    backgroundColor: "#10B981",
    borderRadius: 3,
    position: "absolute" as const,
    bottom: 5,
    left: 5,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0F172A",
    margin: 0,
    letterSpacing: "-0.01em",
  },
  trialBadge: {
    display: "inline-block",
    backgroundColor: "#E6F4EA",
    color: "#137333",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 20,
    padding: "4px 12px",
    margin: 0,
  },
  heading: {
    fontSize: 26,
    fontWeight: 800,
    color: "#0F172A",
    lineHeight: 1.25,
    margin: "8px 0 16px",
    letterSpacing: "-0.02em",
  },
  bodyText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.7,
    margin: "0 0 16px",
  },
  button: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 700,
    padding: "13px 32px",
    textDecoration: "none",
    display: "inline-block",
    letterSpacing: "0.01em",
  },
  divider: {
    borderColor: "#E2E8F0",
    margin: "28px 0",
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#94A3B8",
    margin: "0 0 16px",
  },
  stepRow: {
    marginBottom: 20,
  },
  stepNumber: {
    width: 26,
    height: 26,
    backgroundColor: "#0F172A",
    borderRadius: 6,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: 800,
    textAlign: "center" as const,
    lineHeight: "26px",
    display: "inline-block",
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0F172A",
    margin: "0 0 4px",
  },
  stepDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 1.6,
    margin: 0,
  },
  checkmark: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: 700,
    margin: 0,
  },
  featureText: {
    fontSize: 13,
    color: "#475569",
    margin: 0,
  },
  pricingNote: {
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: "14px 18px",
    marginBottom: 24,
  },
  pricingText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.6,
    margin: 0,
  },
  link: {
    color: "#10B981",
    textDecoration: "none",
  },
  footer: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 1.6,
    margin: 0,
  },
  footerLink: {
    color: "#10B981",
    textDecoration: "none",
  },
};

export default WelcomeEmail;
