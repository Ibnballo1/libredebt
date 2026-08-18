/**
 * emails/weekly-summary.email.tsx — Weekly Progress Summary
 *
 * Sent every Monday morning. Summarises the user's debt position
 * and any upcoming payments this week.
 *
 * Tone: encouraging, positive, progress-focused.
 * "You've paid ₦X so far" — celebrate progress.
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
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type WeeklySummaryDebt = {
  name: string;
  currentBalanceFormatted: string;
  progressPercent: number;
  dueDay: number | null;
};

type WeeklySummaryEmailProps = {
  userName: string;
  totalRepaidFormatted: string;
  totalRemainingFormatted: string;
  totalOutstandingMinor: number;
  overallProgressPercent: number;
  debts: WeeklySummaryDebt[];
  activeDebts: number;
  paymentsThisWeek: number;
  dueThisWeek: string[];
  upcomingDueCount: number;
  currency: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
};

export function WeeklySummaryEmail({
  userName,
  totalRepaidFormatted,
  totalRemainingFormatted,
  totalOutstandingMinor,
  overallProgressPercent,
  debts,
  activeDebts,
  paymentsThisWeek,
  dueThisWeek,
  upcomingDueCount,
  currency,
  dashboardUrl,
  unsubscribeUrl,
}: WeeklySummaryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your weekly debt summary — {String(overallProgressPercent)}% repaid
        overall
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header with Dashboard Link */}
          <Section style={{ marginBottom: 24 }}>
            <Link href={dashboardUrl} style={{ textDecoration: "none" }}>
              <Text style={styles.logoText}>LibreDebt</Text>
            </Link>
          </Section>

          <Section style={{ marginBottom: 24 }}>
            <Text style={styles.tag}>WEEKLY SUMMARY</Text>
          </Section>

          <Heading style={styles.heading}>Good morning, {userName}.</Heading>

          <Text style={styles.body_text}>
            Here&apos;s where your debt repayment stands this week across your{" "}
            <strong>
              {activeDebts} active {activeDebts === 1 ? "debt" : "debts"}
            </strong>
            .
            {upcomingDueCount > 0
              ? ` You have ${upcomingDueCount} payment${upcomingDueCount === 1 ? "" : "s"} coming up.`
              : " No payments are due in the next 7 days."}
          </Text>

          {/* Overall stats */}
          <Section style={styles.statsRow}>
            <Row>
              <Column style={styles.statCell}>
                <Text style={styles.statLabel}>Total Repaid ({currency})</Text>
                <Text style={styles.statValue}>{totalRepaidFormatted}</Text>
              </Column>
              <Column style={styles.statCell}>
                <Text style={styles.statLabel}>Remaining ({currency})</Text>
                <Text style={styles.statValue}>{totalRemainingFormatted}</Text>
                <Text style={styles.statMinor}>
                  ({totalOutstandingMinor.toLocaleString()} minor units)
                </Text>
              </Column>
              <Column style={{ ...styles.statCell, borderRight: "none" }}>
                <Text style={styles.statLabel}>Progress</Text>
                <Text style={{ ...styles.statValue, color: "#10B981" }}>
                  {overallProgressPercent}%
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Progress bar */}
          <Section style={{ margin: "20px 0" }}>
            <div
              style={{
                backgroundColor: "#F1F5F9",
                borderRadius: 999,
                height: 8,
                overflow: "hidden",
                width: "100%",
              }}
            >
              <div
                style={{
                  backgroundColor: "#10B981",
                  borderRadius: 999,
                  height: 8,
                  width: `${overallProgressPercent}%`,
                }}
              />
            </div>
          </Section>

          {/* Activity & Due This Week */}
          <Section style={styles.activityCard}>
            <Text style={styles.sectionLabel}>This Week&apos;s Snapshot</Text>
            <Text style={styles.activityText}>
              • <strong>Payments Made:</strong> {paymentsThisWeek} payment
              {paymentsThisWeek === 1 ? "" : "s"} recorded
            </Text>
            <Text style={{ ...styles.activityText, margin: "6px 0 0" }}>
              • <strong>Due This Week:</strong>{" "}
              {dueThisWeek.length > 0 ? dueThisWeek.join(", ") : "None"}
            </Text>
          </Section>

          {/* Individual debts */}
          {debts.length > 0 && (
            <Section style={{ marginTop: 24 }}>
              <Text style={styles.sectionLabel}>
                Your Active Debts ({activeDebts})
              </Text>
              {debts.map((debt, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.debtRow,
                    borderBottom:
                      i < debts.length - 1 ? "1px solid #F1F5F9" : "none",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td>
                          <Text style={styles.debtName}>{debt.name}</Text>
                          {debt.dueDay && (
                            <Text style={styles.debtMeta}>
                              Due {debt.dueDay}th of month
                            </Text>
                          )}
                        </td>
                        <td
                          style={{ textAlign: "right", verticalAlign: "top" }}
                        >
                          <Text style={styles.debtBalance}>
                            {debt.currentBalanceFormatted}
                          </Text>
                          <Text
                            style={{
                              ...styles.debtMeta,
                              color:
                                debt.progressPercent >= 50
                                  ? "#10B981"
                                  : "#94A3B8",
                            }}
                          >
                            {debt.progressPercent}% repaid
                          </Text>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {/* Mini progress bar */}
                  <div
                    style={{
                      backgroundColor: "#F1F5F9",
                      borderRadius: 999,
                      height: 3,
                      marginTop: 8,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor:
                          debt.progressPercent >= 75
                            ? "#10B981"
                            : debt.progressPercent >= 25
                              ? "#F59E0B"
                              : "#EF4444",
                        borderRadius: 999,
                        height: 3,
                        width: `${debt.progressPercent}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </Section>
          )}

          <Section style={{ textAlign: "center", marginTop: 28 }}>
            <Button style={styles.button} href={dashboardUrl}>
              View Your Dashboard
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            You&apos;re receiving weekly summaries from LibreDebt.{" "}
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
  statsRow: {
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: "16px 0",
  },
  statCell: {
    borderRight: "1px solid #E2E8F0",
    padding: "0 16px",
    textAlign: "center" as const,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#94A3B8",
    margin: "0 0 4px",
  },
  statValue: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0F172A",
    margin: 0,
    fontVariantNumeric: "tabular-nums",
  },
  statMinor: {
    fontSize: 9,
    color: "#94A3B8",
    margin: "2px 0 0",
  },
  activityCard: {
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: "16px 20px",
    marginTop: 16,
  },
  activityText: {
    fontSize: 13,
    color: "#334155",
    margin: 0,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#94A3B8",
    margin: "0 0 12px",
  },
  debtRow: {
    padding: "12px 0",
  },
  debtName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0F172A",
    margin: 0,
  },
  debtMeta: {
    fontSize: 10,
    color: "#94A3B8",
    margin: "2px 0 0",
  },
  debtBalance: {
    fontSize: 13,
    fontWeight: 800,
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

export default WeeklySummaryEmail;
