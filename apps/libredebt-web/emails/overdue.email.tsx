/**
 * emails/overdue.email.tsx — Overdue Payment Alert
 *
 * Sent when a payment has not been recorded by its due date.
 * Tone: concerned but not alarming. Factual. One clear action.
 *
 * "Overdue" doesn't mean the user missed payment — they may have
 * paid but not recorded it. The copy reflects this.
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

type OverdueEmailProps = {
  userName: string;
  debtName: string;
  creditor: string;
  daysOverdue: number;
  currentBalanceFormatted: string;
  recordPaymentUrl: string;
  unsubscribeUrl: string;
};

export function OverdueEmail({
  userName,
  debtName,
  creditor,
  daysOverdue,
  currentBalanceFormatted,
  recordPaymentUrl,
  unsubscribeUrl,
}: OverdueEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {debtName} — no payment recorded yet ({String(daysOverdue)}{" "}
        {daysOverdue === 1 ? "day" : "days"} past due)
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={{ marginBottom: 24 }}>
            <Text style={styles.logoText}>LibreDebt</Text>
          </Section>

          <Section style={{ marginBottom: 24 }}>
            <Text style={styles.tag}>PAYMENT OVERDUE</Text>
          </Section>

          <Heading style={styles.heading}>
            Hi {userName}, we haven&apos;t seen a payment for {debtName} yet.
          </Heading>

          <Text style={styles.body_text}>
            Your payment to <strong>{creditor}</strong> was due{" "}
            {daysOverdue === 1
              ? "yesterday"
              : `${String(daysOverdue)} days ago`}
            . If you&apos;ve already made the payment, record it in LibreDebt to
            keep your balance up to date.
          </Text>

          {/* Debt card */}
          <Section style={styles.card}>
            <Text style={styles.cardLabel}>Debt</Text>
            <Text style={styles.cardValue}>{debtName}</Text>
            <Hr style={{ borderColor: "#FEE2E2", margin: "12px 0" }} />
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tr>
                <td>
                  <Text style={styles.cardLabel}>Days past due</Text>
                  <Text
                    style={{ ...styles.cardValue, color: "#EF4444", margin: 0 }}
                  >
                    {daysOverdue} {daysOverdue === 1 ? "day" : "days"}
                  </Text>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Text style={styles.cardLabel}>Current balance</Text>
                  <Text style={{ ...styles.cardValue, margin: 0 }}>
                    {currentBalanceFormatted}
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          <Section style={{ textAlign: "center", marginTop: 28 }}>
            <Button style={styles.button} href={recordPaymentUrl}>
              Record Payment
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            LibreDebt sends overdue alerts to help you stay on track.{" "}
            <Link href={unsubscribeUrl} style={styles.footerLink}>
              Manage reminder settings
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

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
    color: "#EF4444",
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
    backgroundColor: "#FFF5F5",
    border: "1px solid #FEE2E2",
    borderLeft: "3px solid #EF4444",
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
    backgroundColor: "#EF4444",
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

export default OverdueEmail;
