/**
 * emails/due-soon.email.tsx — Payment Due Soon Reminder
 *
 * Sent 7 days, 3 days, and 1 day before a debt's due date.
 *
 * DESIGN PRINCIPLES FOR THIS EMAIL:
 * - Single clear action (Record Payment)
 * - Show the exact amount and debt name upfront
 * - No anxiety-inducing language — calm, factual, helpful
 * - Brand colours maintained: navy primary, emerald CTA
 * - Mobile-first: works in Gmail, Apple Mail, Outlook
 *
 * Built with React Email (react-email package).
 * Install: npm install react-email @react-email/components
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type DueSoonEmailProps = {
  userName: string;
  debtName: string;
  creditor: string;
  daysUntilDue: number;
  minimumPaymentFormatted: string;
  currentBalanceFormatted: string;
  recordPaymentUrl: string;
  unsubscribeUrl: string;
};

export function DueSoonEmail({
  userName,
  debtName,
  creditor,
  daysUntilDue,
  minimumPaymentFormatted,
  currentBalanceFormatted,
  recordPaymentUrl,
  unsubscribeUrl,
}: DueSoonEmailProps) {
  const daysText =
    daysUntilDue === 1
      ? "tomorrow"
      : daysUntilDue === 7
        ? "in 7 days"
        : `in ${daysUntilDue} days`;

  return (
    <Html>
      <Head />
      <Preview>
        Your {debtName} payment is due {daysText} — {minimumPaymentFormatted}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <table style={{ borderCollapse: "collapse" }}>
              <tr>
                <td>
                  <div style={styles.logoMark}>
                    <div style={styles.logoMarkInner} />
                  </div>
                </td>
                <td style={{ paddingLeft: 8 }}>
                  <Text style={styles.logoText}>LibreDebt</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Tag */}
          <Section style={{ marginBottom: 24 }}>
            <Text style={styles.tag}>
              PAYMENT DUE{" "}
              {daysUntilDue === 1 ? "TOMORROW" : `IN ${daysUntilDue} DAYS`}
            </Text>
          </Section>

          {/* Heading */}
          <Heading style={styles.heading}>
            Hi {userName}, your {debtName} payment is coming up.
          </Heading>

          <Text style={styles.body_text}>
            Your payment to <strong>{creditor}</strong> is due {daysText}.
            Record it in LibreDebt when you make it to keep your balance
            accurate.
          </Text>

          {/* Debt summary card */}
          <Section style={styles.card}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tr>
                <td style={styles.cardLabel}>Debt</td>
                <td style={{ ...styles.cardLabel, textAlign: "right" }}>Due</td>
              </tr>
              <tr>
                <td style={styles.cardValue}>{debtName}</td>
                <td
                  style={{
                    ...styles.cardValue,
                    textAlign: "right",
                    color: "#F59E0B",
                  }}
                >
                  {daysText}
                </td>
              </tr>
            </table>
            <Hr style={{ borderColor: "#F1F5F9", margin: "14px 0" }} />
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tr>
                <td>
                  <Text style={styles.cardLabel}>Minimum payment</Text>
                  <Text
                    style={{ ...styles.cardValue, fontSize: 20, margin: 0 }}
                  >
                    {minimumPaymentFormatted}
                  </Text>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Text style={styles.cardLabel}>Current balance</Text>
                  <Text
                    style={{ ...styles.cardValue, fontSize: 20, margin: 0 }}
                  >
                    {currentBalanceFormatted}
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: "center", marginTop: 28 }}>
            <Button style={styles.button} href={recordPaymentUrl}>
              Record Payment in LibreDebt
            </Button>
          </Section>

          <Hr style={styles.divider} />

          {/* Footer */}
          <Text style={styles.footer}>
            You&apos;re receiving this because you enabled payment reminders on
            LibreDebt. You can{" "}
            <Link href={unsubscribeUrl} style={styles.footerLink}>
              manage your reminder settings
            </Link>{" "}
            at any time.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  body: {
    backgroundColor: "#F8FAFC",
    fontFamily: "'Inter', -apple-system, sans-serif",
    margin: 0,
    padding: "40px 0",
  },
  container: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    margin: "0 auto",
    maxWidth: 520,
    padding: "32px 36px",
  },
  header: {
    marginBottom: 24,
  },
  logoMark: {
    width: 28,
    height: 28,
    backgroundColor: "#0F172A",
    borderRadius: 6,
    display: "inline-block",
    position: "relative" as const,
  },
  logoMarkInner: {
    width: 10,
    height: 10,
    backgroundColor: "#10B981",
    borderRadius: 3,
    position: "absolute" as const,
    bottom: 5,
    left: 5,
  },
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0F172A",
    margin: 0,
    letterSpacing: "-0.01em",
  },
  tag: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#94A3B8",
    margin: 0,
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0F172A",
    lineHeight: 1.3,
    margin: "0 0 16px",
    letterSpacing: "-0.01em",
  },
  body_text: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.6,
    margin: "0 0 24px",
  },
  card: {
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderLeft: "3px solid #F59E0B",
    borderRadius: 8,
    padding: "16px 20px",
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#94A3B8",
    margin: "0 0 4px",
  },
  cardValue: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0F172A",
    margin: 0,
    fontVariantNumeric: "tabular-nums",
  },
  button: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 700,
    padding: "12px 28px",
    textDecoration: "none",
    display: "inline-block",
  },
  divider: {
    borderColor: "#E2E8F0",
    margin: "28px 0 20px",
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

export default DueSoonEmail;
