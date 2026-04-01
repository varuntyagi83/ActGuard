import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

export interface IncidentReportData {
  // Admin
  reportType: string; // initial, follow_up, combined, final
  reportNumber: number;
  reportDate: string;
  authorityName: string;
  authorityContact: string;
  memberState: string;
  // AI System
  systemName: string;
  systemDescription: string;
  euDatabaseId: string | null;
  riskTier: string;
  deploymentMemberStates: string[];
  // Incident
  incidentTitle: string;
  incidentDate: string;
  incidentType: string;
  severity: string;
  description: string;
  affectedPopulations: string[];
  remediationSteps: string[];
  // Analysis
  rootCause: string | null;
  resolutionNotes: string | null;
  investigationStatus: string;
  // Declaration
  submitterName: string;
  organizationName: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  initial: "Initial Report",
  follow_up: "Follow-Up Report",
  combined: "Combined Report",
  final: "Final Report",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#16a34a",
};

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: "Helvetica", fontSize: 11, color: "#1a1a1a" },
  header: { borderBottomWidth: 2, borderBottomColor: "#2563eb", paddingBottom: 12, marginBottom: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  brandText: { fontSize: 9, fontWeight: "bold", color: "#2563eb", textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  badgeRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 },
  badge: { backgroundColor: "#2563eb", borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, color: "#ffffff", fontWeight: "bold", textTransform: "uppercase" },
  headerMeta: { fontSize: 9, color: "#666", marginTop: 2 },
  sectionHeader: { backgroundColor: "#eff6ff", borderLeftWidth: 3, borderLeftColor: "#2563eb", paddingVertical: 6, paddingHorizontal: 10, marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: "#1e40af" },
  fieldRow: { flexDirection: "row", marginBottom: 6 },
  fieldLabel: { fontSize: 8, fontWeight: "bold", color: "#888", textTransform: "uppercase", marginBottom: 2, width: 160 },
  fieldValue: { fontSize: 10, color: "#333", flex: 1 },
  fieldBlock: { marginBottom: 8 },
  fieldBlockLabel: { fontSize: 8, fontWeight: "bold", color: "#888", textTransform: "uppercase", marginBottom: 3 },
  fieldBlockValue: { fontSize: 10, color: "#333", lineHeight: 1.6 },
  bulletItem: { fontSize: 10, color: "#333", marginBottom: 3, paddingLeft: 8 },
  severityBadge: { borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  severityText: { fontSize: 9, color: "#ffffff", fontWeight: "bold", textTransform: "uppercase" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 8 },
  declarationBox: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 4, padding: 12, marginTop: 8, backgroundColor: "#f9fafb" },
  declarationText: { fontSize: 10, color: "#374151", lineHeight: 1.6, fontStyle: "italic" },
  signatureRow: { flexDirection: "row", marginTop: 12 },
  signatureBlock: { flex: 1 },
  signatureLabel: { fontSize: 8, fontWeight: "bold", color: "#888", textTransform: "uppercase", marginBottom: 2 },
  signatureValue: { fontSize: 10, color: "#333", fontWeight: "bold" },
  footer: { position: "absolute", bottom: 30, left: 50, right: 50, borderTopWidth: 1, borderTopColor: "#ddd", paddingTop: 8, textAlign: "center", fontSize: 8, color: "#999" },
  emptyValue: { fontSize: 10, color: "#9ca3af", fontStyle: "italic" },
});

function fieldRow(label: string, value: string | null | undefined) {
  return React.createElement(View, { style: styles.fieldRow },
    React.createElement(Text, { style: styles.fieldLabel }, label),
    value
      ? React.createElement(Text, { style: styles.fieldValue }, value)
      : React.createElement(Text, { style: styles.emptyValue }, "Not provided")
  );
}

function fieldBlock(label: string, value: string | null | undefined) {
  return React.createElement(View, { style: styles.fieldBlock },
    React.createElement(Text, { style: styles.fieldBlockLabel }, label),
    value
      ? React.createElement(Text, { style: styles.fieldBlockValue }, value)
      : React.createElement(Text, { style: styles.emptyValue }, "Not provided")
  );
}

function bulletList(items: string[]) {
  if (items.length === 0) {
    return React.createElement(Text, { style: styles.emptyValue }, "None specified");
  }
  return React.createElement(View, null,
    ...items.map((item, i) =>
      React.createElement(Text, { key: i, style: styles.bulletItem }, `\u2022  ${item}`)
    )
  );
}

function sectionHeader(number: number, title: string) {
  return React.createElement(View, { style: styles.sectionHeader },
    React.createElement(Text, { style: styles.sectionTitle }, `Section ${number} \u2014 ${title}`)
  );
}

export function createIncidentReportDocument(data: IncidentReportData) {
  const reportTypeLabel = REPORT_TYPE_LABELS[data.reportType] || data.reportType;
  const severityColor = SEVERITY_COLORS[data.severity?.toLowerCase()] || "#6b7280";

  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: styles.page },

      // ── Header ──
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.brandRow },
          React.createElement(Text, { style: styles.brandText }, "ACTGUARD")
        ),
        React.createElement(Text, { style: styles.title }, "INCIDENT REPORT TO NATIONAL AUTHORITY"),
        React.createElement(View, { style: styles.badgeRow },
          React.createElement(View, { style: styles.badge },
            React.createElement(Text, { style: styles.badgeText }, reportTypeLabel)
          ),
          React.createElement(Text, { style: styles.headerMeta }, `Report #${data.reportNumber}`),
          React.createElement(Text, { style: styles.headerMeta }, data.reportDate)
        )
      ),

      // ── Section 1 — Administrative Information ──
      sectionHeader(1, "Administrative Information"),
      fieldRow("Authority Name", data.authorityName),
      fieldRow("Authority Contact", data.authorityContact),
      fieldRow("Member State", data.memberState),
      fieldRow("Report Date", data.reportDate),
      fieldRow("Report Type", reportTypeLabel),
      fieldRow("Previous Report References", data.reportNumber > 1 ? `Reports 1\u2013${data.reportNumber - 1}` : "N/A \u2014 Initial report"),

      // ── Section 2 — AI System Information ──
      sectionHeader(2, "AI System Information"),
      fieldRow("System Name", data.systemName),
      fieldRow("EU Database ID", data.euDatabaseId),
      fieldRow("Risk Tier", data.riskTier),
      fieldBlock("System Description", data.systemDescription),
      React.createElement(View, { style: styles.fieldBlock },
        React.createElement(Text, { style: styles.fieldBlockLabel }, "Deployment Member States"),
        React.createElement(Text, { style: styles.fieldBlockValue },
          data.deploymentMemberStates.length > 0
            ? data.deploymentMemberStates.join(", ")
            : "Not specified"
        )
      ),

      // ── Section 3 — Incident Description ──
      sectionHeader(3, "Incident Description"),
      fieldRow("Incident Title", data.incidentTitle),
      fieldRow("Incident Date", data.incidentDate),
      fieldRow("Type Classification", data.incidentType),
      React.createElement(View, { style: styles.fieldRow },
        React.createElement(Text, { style: styles.fieldLabel }, "Severity"),
        React.createElement(View, { style: { ...styles.severityBadge, backgroundColor: severityColor } },
          React.createElement(Text, { style: styles.severityText }, data.severity)
        )
      ),
      fieldBlock("Full Description", data.description),
      React.createElement(View, { style: styles.fieldBlock },
        React.createElement(Text, { style: styles.fieldBlockLabel }, "Affected Populations"),
        bulletList(data.affectedPopulations)
      ),
      React.createElement(View, { style: styles.fieldBlock },
        React.createElement(Text, { style: styles.fieldBlockLabel }, "Remediation Steps Taken"),
        bulletList(data.remediationSteps)
      ),

      // ── Section 4 — Provider Analysis ──
      sectionHeader(4, "Provider Analysis"),
      fieldBlock("Root Cause", data.rootCause),
      fieldBlock("Resolution Notes", data.resolutionNotes),
      fieldRow("Investigation Status", data.investigationStatus),
      fieldBlock("Corrective Actions",
        data.remediationSteps.length > 0
          ? data.remediationSteps.join("; ")
          : null
      ),

      // ── Section 5 — Declaration ──
      sectionHeader(5, "Declaration"),
      React.createElement(View, { style: styles.declarationBox },
        React.createElement(Text, { style: styles.declarationText },
          "I declare that the information provided in this report is accurate and complete to the best of my knowledge. This report does not constitute an admission of fault or liability."
        ),
        React.createElement(View, { style: styles.signatureRow },
          React.createElement(View, { style: styles.signatureBlock },
            React.createElement(Text, { style: styles.signatureLabel }, "Submitter"),
            React.createElement(Text, { style: styles.signatureValue }, data.submitterName)
          ),
          React.createElement(View, { style: styles.signatureBlock },
            React.createElement(Text, { style: styles.signatureLabel }, "Organization"),
            React.createElement(Text, { style: styles.signatureValue }, data.organizationName)
          ),
          React.createElement(View, { style: styles.signatureBlock },
            React.createElement(Text, { style: styles.signatureLabel }, "Date"),
            React.createElement(Text, { style: styles.signatureValue }, data.reportDate)
          )
        )
      ),

      // ── Footer ──
      React.createElement(View, { style: styles.footer, fixed: true },
        React.createElement(Text, null, "Generated by ActGuard \u2014 EU AI Act Compliance Suite")
      )
    )
  );
}

export async function renderIncidentReportPdf(data: IncidentReportData): Promise<Buffer> {
  const document = createIncidentReportDocument(data);
  const buffer = await renderToBuffer(document);
  return Buffer.from(buffer);
}
