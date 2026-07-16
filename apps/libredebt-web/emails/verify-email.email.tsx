/**
 * emails/verify-email.email.tsx — Email Verification Template
 *
 * Sent automatically when a user registers via credentials or requests a new link.
 * Design: Matches the LibreDebt navy/emerald brand palette.
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

type VerifyEmailProps = {
  userName: string;
  verificationUrl: string;
};

export function VerifyEmail({ userName, verificationUrl }: VerifyEmailProps) {
  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <Html>
      <Head />
      <Preview>
        Verify your email address to access your LibreDebt account
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

          {/* Main Content */}
          <Heading style={styles.heading}>Verify your email address</Heading>

          <Text style={styles.bodyText}>
            Hi {firstName}, thank you for signing up for LibreDebt! Before we
            can get your financial ledger initialized, please confirm your email
            address by clicking the button below.
          </Text>

          {/* Action Button */}
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button style={styles.button} href={verificationUrl}>
              Verify Email Address
            </Button>
          </Section>

          <Text style={styles.bodyText}>
            This link will expire shortly. If the button above doesn&apos;t
            work, copy and paste this URL into your browser:
            <br />
            <Link href={verificationUrl} style={styles.link}>
              {verificationUrl}
            </Link>
          </Text>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            If you did not request this email, you can safely ignore it. Someone
            may have typed your address by mistake.
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
  heading: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0F172A",
    lineHeight: 1.3,
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
  link: {
    color: "#10B981",
    textDecoration: "none",
    wordBreak: "break-all" as const,
    fontSize: 12,
  },
  footer: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 1.6,
    margin: 0,
  },
};

export default VerifyEmail;
