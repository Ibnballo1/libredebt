/**
 * lib/pdf-templates.tsx
 *
 * React PDF components for all three export types.
 * Uses @react-pdf/renderer — no headless browser needed.
 *
 * Install: npm install @react-pdf/renderer
 */

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  DebtExportRow,
  PaymentExportRow,
  ReceivableExportRow,
} from "@/server/services/export.service";

const C = {
  navy: "#0F172A",
  accent: "#10B981",
  sky: "#38BDF8",
  border: "#E2E8F0",
  muted: "#64748B",
  light: "#F8FAFC",
  white: "#FFFFFF",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.navy,
    padding: 40,
    backgroundColor: C.white,
  },
  header: {
    backgroundColor: C.navy,
    padding: "14 20",
    marginBottom: 20,
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.white },
  headerSub: { fontSize: 9, color: "#94A3B8" },
  headerMeta: { fontSize: 8, color: "#94A3B8", textAlign: "right" },
  accentBar: { height: 3, borderRadius: 2, marginBottom: 14, width: 48 },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  th: {
    flexDirection: "row",
    backgroundColor: C.navy,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  thCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tr: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  trAlt: { backgroundColor: C.light },
  td: { fontSize: 8.5, color: C.navy },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: "#94A3B8" },
});

function Header({ title, sub }: { title: string; sub: string }) {
  const now = new Date().toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <View style={s.header}>
      <View>
        <Text style={s.headerTitle}>LibreDebt</Text>
        <Text style={s.headerSub}>{title}</Text>
      </View>
      <View>
        <Text style={s.headerMeta}>{sub}</Text>
        <Text style={s.headerMeta}>Exported {now}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>
        LibreDebt — Track • Plan • Settle • Be Free
      </Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

// ── Debts PDF ──────────────────────────────────────────────────────────────────

export function DebtsPdf({
  rows,
  userName,
}: {
  rows: DebtExportRow[];
  userName: string;
}) {
  const cols = [
    { label: "Name", flex: 2 },
    { label: "Creditor", flex: 1.5 },
    { label: "Currency", flex: 0.7 },
    { label: "Status", flex: 0.8 },
    { label: "Original", flex: 1 },
    { label: "Balance", flex: 1 },
    { label: "Repaid", flex: 0.8 },
    { label: "Progress", flex: 0.8 },
  ];
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Header title="Debt Report" sub={`Account: ${userName}`} />
        <View style={[s.accentBar, { backgroundColor: C.accent }]} />
        <Text style={s.sectionLabel}>{rows.length} debts</Text>
        <View>
          <View style={s.th}>
            {cols.map((c) => (
              <Text key={c.label} style={[s.thCell, { flex: c.flex }]}>
                {c.label}
              </Text>
            ))}
          </View>
          {rows.map((r, i) => (
            <View key={i} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr}>
              <Text style={[s.td, { flex: 2 }]}>{r.name}</Text>
              <Text style={[s.td, { flex: 1.5 }]}>{r.creditor}</Text>
              <Text style={[s.td, { flex: 0.7 }]}>{r.currency}</Text>
              <Text style={[s.td, { flex: 0.8 }]}>{r.status}</Text>
              <Text style={[s.td, { flex: 1 }]}>{r.originalAmount}</Text>
              <Text style={[s.td, { flex: 1 }]}>{r.currentBalance}</Text>
              <Text style={[s.td, { flex: 0.8 }]}>{r.amountRepaid}</Text>
              <Text style={[s.td, { flex: 0.8, color: C.accent }]}>
                {r.progressPercent}
              </Text>
            </View>
          ))}
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

// ── Payments PDF ───────────────────────────────────────────────────────────────

export function PaymentsPdf({
  rows,
  userName,
}: {
  rows: PaymentExportRow[];
  userName: string;
}) {
  const cols = [
    { label: "Date", flex: 1 },
    { label: "Debt", flex: 2 },
    { label: "Creditor", flex: 1.5 },
    { label: "Currency", flex: 0.7 },
    { label: "Amount", flex: 1 },
    { label: "Type", flex: 0.8 },
    { label: "Note", flex: 2 },
  ];
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Header title="Payment History" sub={`Account: ${userName}`} />
        <View style={[s.accentBar, { backgroundColor: C.accent }]} />
        <Text style={s.sectionLabel}>{rows.length} entries</Text>
        <View>
          <View style={s.th}>
            {cols.map((c) => (
              <Text key={c.label} style={[s.thCell, { flex: c.flex }]}>
                {c.label}
              </Text>
            ))}
          </View>
          {rows.map((r, i) => (
            <View key={i} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr}>
              <Text style={[s.td, { flex: 1 }]}>{r.date}</Text>
              <Text style={[s.td, { flex: 2 }]}>{r.debtName}</Text>
              <Text style={[s.td, { flex: 1.5 }]}>{r.creditor}</Text>
              <Text style={[s.td, { flex: 0.7 }]}>{r.currency}</Text>
              <Text style={[s.td, { flex: 1, color: C.accent }]}>
                {r.amount}
              </Text>
              <Text style={[s.td, { flex: 0.8 }]}>{r.type}</Text>
              <Text style={[s.td, { flex: 2, color: C.muted }]}>{r.note}</Text>
            </View>
          ))}
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

// ── Receivables PDF ────────────────────────────────────────────────────────────

export function ReceivablesPdf({
  rows,
  userName,
}: {
  rows: ReceivableExportRow[];
  userName: string;
}) {
  const cols = [
    { label: "Name", flex: 2 },
    { label: "Debtor", flex: 1.5 },
    { label: "Phone", flex: 1 },
    { label: "Currency", flex: 0.7 },
    { label: "Status", flex: 0.8 },
    { label: "Original", flex: 1 },
    { label: "Balance", flex: 1 },
    { label: "Progress", flex: 0.8 },
    { label: "Expected By", flex: 1 },
  ];
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Header title="Receivables Report" sub={`Account: ${userName}`} />
        <View style={[s.accentBar, { backgroundColor: C.sky }]} />
        <Text style={s.sectionLabel}>{rows.length} receivables</Text>
        <View>
          <View style={s.th}>
            {cols.map((c) => (
              <Text key={c.label} style={[s.thCell, { flex: c.flex }]}>
                {c.label}
              </Text>
            ))}
          </View>
          {rows.map((r, i) => (
            <View key={i} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr}>
              <Text style={[s.td, { flex: 2 }]}>{r.name}</Text>
              <Text style={[s.td, { flex: 1.5 }]}>{r.debtorName}</Text>
              <Text style={[s.td, { flex: 1 }]}>{r.debtorPhone}</Text>
              <Text style={[s.td, { flex: 0.7 }]}>{r.currency}</Text>
              <Text style={[s.td, { flex: 0.8 }]}>{r.status}</Text>
              <Text style={[s.td, { flex: 1 }]}>{r.originalAmount}</Text>
              <Text style={[s.td, { flex: 1 }]}>{r.currentBalance}</Text>
              <Text style={[s.td, { flex: 0.8, color: C.sky }]}>
                {r.progressPercent}
              </Text>
              <Text style={[s.td, { flex: 1 }]}>{r.expectedByDate}</Text>
            </View>
          ))}
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
