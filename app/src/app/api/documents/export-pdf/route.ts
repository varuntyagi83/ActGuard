import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const DOC_TYPE_LABELS: Record<string, string> = {
  technical_doc: "Technical Documentation",
  risk_management_plan: "Risk Management Plan",
  data_governance: "Data Governance Record",
  conformity_assessment: "Conformity Assessment",
  transparency_info: "Transparency Information",
  human_oversight_plan: "Human Oversight Plan",
  declaration_of_conformity: "EU Declaration of Conformity",
};

const SECTION_LABELS: Record<string, string> = {
  general_description: "1. General Description",
  elements_and_development_process: "2. Elements and Development Process",
  monitoring_functioning_control: "3. Monitoring, Functioning and Control",
  risk_management_system: "4. Risk Management System",
  data_requirements_and_governance: "5. Data Requirements and Governance",
  performance_metrics_robustness_cybersecurity: "6. Performance, Robustness and Cybersecurity",
  foreseeable_misuse_prevention: "7. Foreseeable Misuse and Prevention",
  human_oversight_measures: "8. Human Oversight Measures",
  expected_lifetime_and_maintenance: "9. Expected Lifetime and Maintenance",
  known_and_foreseeable_risks: "1. Known and Foreseeable Risks",
  risk_estimation_matrix: "2. Risk Estimation Matrix",
  risk_evaluation_thresholds: "3. Risk Evaluation Thresholds",
  mitigation_measures: "4. Mitigation Measures",
  residual_risk_assessment: "5. Residual Risk Assessment",
  testing_and_validation: "6. Testing and Validation",
  post_market_monitoring_plan: "7. Post-Market Monitoring Plan",
  review_schedule: "8. Review Schedule",
  data_collection_methods_and_sources: "1. Data Collection Methods and Sources",
  data_preprocessing_and_annotation: "2. Data Preprocessing and Annotation",
  data_preparation_operations: "3. Data Preparation Operations",
  assumptions_about_representativeness: "4. Assumptions About Representativeness",
  availability_quantity_suitability_assessment: "5. Availability, Quantity and Suitability",
  bias_examination_and_detection: "6. Bias Examination and Detection",
  gap_identification_and_mitigation: "7. Gap Identification and Mitigation",
  data_protection_impact_integration: "8. Data Protection Impact Integration",
  assessment_scope_and_objectives: "1. Assessment Scope and Objectives",
  applicable_requirements: "2. Applicable Requirements",
  quality_management_system_review: "3. Quality Management System Review",
  technical_documentation_review: "4. Technical Documentation Review",
  design_and_development_process_audit: "5. Design and Development Process Audit",
  post_market_monitoring_review: "6. Post-Market Monitoring Review",
  compliance_findings_and_gaps: "7. Compliance Findings and Gaps",
  declaration_of_conformity_draft: "8. Declaration of Conformity Draft",
  system_identity_and_provider: "1. System Identity and Provider",
  intended_purpose_and_use_cases: "2. Intended Purpose and Use Cases",
  capabilities_and_limitations: "3. Capabilities and Limitations",
  human_oversight_instructions: "4. Human Oversight Instructions",
  input_data_specifications: "5. Input Data Specifications",
  output_interpretation_guidance: "6. Output Interpretation Guidance",
  risk_communication_to_users: "7. Risk Communication to Users",
  contact_and_reporting_channels: "8. Contact and Reporting Channels",
  oversight_framework_and_objectives: "1. Oversight Framework and Objectives",
  roles_and_responsibilities: "2. Roles and Responsibilities",
  competency_requirements_and_training: "3. Competency Requirements and Training",
  human_machine_interface_design: "4. Human-Machine Interface Design",
  intervention_and_override_procedures: "5. Intervention and Override Procedures",
  decision_review_and_appeal_process: "6. Decision Review and Appeal Process",
  monitoring_and_escalation_protocols: "7. Monitoring and Escalation Protocols",
  oversight_effectiveness_evaluation: "8. Oversight Effectiveness Evaluation",
  // Declaration of Conformity (Article 47)
  provider_identification: "1. Provider Identification",
  system_identification: "2. AI System Identification",
  declaration_statement: "3. Declaration Statement",
  harmonised_standards_applied: "4. Harmonised Standards Applied",
  notified_body_involvement: "5. Notified Body Involvement",
  relevant_eu_ai_act_requirements: "6. Relevant EU AI Act Requirements",
  place_date_and_signature: "7. Place, Date and Signature",
};

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: "Helvetica", fontSize: 11, color: "#1a1a1a" },
  header: { borderBottomWidth: 2, borderBottomColor: "#2563eb", paddingBottom: 12, marginBottom: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  brandText: { fontSize: 9, fontWeight: "bold", color: "#2563eb", textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: "bold" },
  subtitle: { fontSize: 10, color: "#666", marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", marginTop: 18, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 4 },
  sectionContent: { fontSize: 10, lineHeight: 1.6, color: "#333" },
  riskCard: { borderWidth: 1, borderColor: "#ddd", borderRadius: 4, padding: 8, marginBottom: 6 },
  riskName: { fontSize: 10, fontWeight: "bold" },
  riskDesc: { fontSize: 9, color: "#555", marginTop: 2 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 4 },
  tableCell: { flex: 1, fontSize: 9, paddingHorizontal: 4 },
  tableCellBold: { flex: 1, fontSize: 9, fontWeight: "bold", paddingHorizontal: 4 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#ddd", paddingBottom: 4, marginBottom: 2 },
  tableHeaderCell: { flex: 1, fontSize: 9, fontWeight: "bold", color: "#888", textTransform: "uppercase", paddingHorizontal: 4 },
  footer: { position: "absolute", bottom: 30, left: 50, right: 50, borderTopWidth: 1, borderTopColor: "#ddd", paddingTop: 8, textAlign: "center", fontSize: 8, color: "#999" },
  fieldLabel: { fontSize: 8, fontWeight: "bold", color: "#888", textTransform: "uppercase", marginTop: 6, marginBottom: 2 },
  fieldValue: { fontSize: 10, color: "#333" },
});

function flattenValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  return JSON.stringify(value, null, 2);
}

function renderSectionContent(key: string, value: unknown): React.JSX.Element {
  // Try parsing JSON strings
  let parsed = value;
  if (typeof value === "string") {
    try {
      const p = JSON.parse(value);
      if (typeof p === "object" && p !== null) parsed = p;
    } catch { /* not JSON */ }
  }

  // Array of {risk, description} or similar objects
  if (Array.isArray(parsed)) {
    return React.createElement(View, null,
      ...parsed.map((item, i) => {
        if (typeof item === "object" && item !== null && "risk" in item) {
          return React.createElement(View, { key: i, style: styles.riskCard },
            React.createElement(Text, { style: styles.riskName }, item.risk),
            React.createElement(Text, { style: styles.riskDesc }, item.description || "")
          );
        }
        if (typeof item === "object" && item !== null && "name" in item) {
          return React.createElement(View, { key: i, style: styles.riskCard },
            React.createElement(Text, { style: styles.riskName }, item.name),
            React.createElement(Text, { style: styles.riskDesc }, item.description || "")
          );
        }
        return React.createElement(Text, { key: i, style: styles.sectionContent }, `• ${flattenValue(item)}`);
      })
    );
  }

  // Object (risk matrix style or generic)
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    const entries = Object.entries(parsed as Record<string, unknown>);

    // Risk matrix: values are objects with impact/likelihood
    const isMatrix = entries.every(([, v]) => typeof v === "object" && v !== null && ("impact" in v || "likelihood" in v));
    if (isMatrix && entries.length > 0) {
      const cols = Object.keys(entries[0][1] as Record<string, unknown>);
      return React.createElement(View, null,
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: styles.tableHeaderCell }, "Risk"),
          ...cols.map((c) => React.createElement(Text, { key: c, style: styles.tableHeaderCell }, c))
        ),
        ...entries.map(([name, data]) =>
          React.createElement(View, { key: name, style: styles.tableRow },
            React.createElement(Text, { style: styles.tableCellBold }, name),
            ...Object.values(data as Record<string, unknown>).map((v, i) =>
              React.createElement(Text, { key: i, style: styles.tableCell }, String(v))
            )
          )
        )
      );
    }

    // Generic object — render as labeled fields
    return React.createElement(View, null,
      ...entries.map(([k, v]) =>
        React.createElement(View, { key: k },
          React.createElement(Text, { style: styles.fieldLabel }, k.replace(/_/g, " ")),
          React.createElement(Text, { style: styles.fieldValue }, flattenValue(v))
        )
      )
    );
  }

  // Plain text
  return React.createElement(Text, { style: styles.sectionContent }, flattenValue(parsed));
}

const declarationStyles = StyleSheet.create({
  page: { padding: 60, fontFamily: "Helvetica", fontSize: 11, color: "#1a1a1a" },
  euBadge: { alignSelf: "center", borderWidth: 2, borderColor: "#003399", borderRadius: 4, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20 },
  euBadgeText: { fontSize: 10, fontWeight: "bold", color: "#003399", textTransform: "uppercase", letterSpacing: 1 },
  declarationTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  declarationSubtitle: { fontSize: 11, textAlign: "center", color: "#555", marginBottom: 6 },
  articleRef: { fontSize: 9, textAlign: "center", color: "#2563eb", marginBottom: 24 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#003399", marginBottom: 20 },
  fieldBlock: { marginBottom: 14 },
  fieldLabel: { fontSize: 8, fontWeight: "bold", color: "#555", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  fieldValue: { fontSize: 10, color: "#1a1a1a", lineHeight: 1.5 },
  sectionHeading: { fontSize: 11, fontWeight: "bold", marginTop: 16, marginBottom: 6, color: "#003399" },
  bodyText: { fontSize: 10, lineHeight: 1.6, color: "#333" },
  signatureBox: { borderWidth: 1, borderColor: "#ccc", borderRadius: 4, padding: 14, marginTop: 24 },
  signatureLabel: { fontSize: 8, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: "#555", marginTop: 28, marginBottom: 4 },
  signatureHint: { fontSize: 8, color: "#999" },
  footer: { position: "absolute", bottom: 30, left: 60, right: 60, borderTopWidth: 1, borderTopColor: "#ddd", paddingTop: 8, textAlign: "center", fontSize: 8, color: "#999" },
});

function buildDeclarationPdf(
  content: Record<string, unknown>,
  systemName: string,
  version: number,
  generatedAt: Date
): React.ReactElement<import("@react-pdf/renderer").DocumentProps> {
  function field(label: string, key: string): React.ReactElement {
    return React.createElement(View, { style: declarationStyles.fieldBlock },
      React.createElement(Text, { style: declarationStyles.fieldLabel }, label),
      React.createElement(Text, { style: declarationStyles.fieldValue }, flattenValue(content[key] ?? ""))
    );
  }

  function section(heading: string, key: string): React.ReactElement {
    return React.createElement(View, { key },
      React.createElement(Text, { style: declarationStyles.sectionHeading }, heading),
      React.createElement(Text, { style: declarationStyles.bodyText }, flattenValue(content[key] ?? ""))
    );
  }

  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: declarationStyles.page },

      // EU badge
      React.createElement(View, { style: declarationStyles.euBadge },
        React.createElement(Text, { style: declarationStyles.euBadgeText }, "European Union — EU AI Act")
      ),

      // Title block
      React.createElement(Text, { style: declarationStyles.declarationTitle }, "EU Declaration of Conformity"),
      React.createElement(Text, { style: declarationStyles.declarationSubtitle },
        `${systemName} — Version ${version} — ${generatedAt.toLocaleDateString()}`
      ),
      React.createElement(Text, { style: declarationStyles.articleRef },
        "Issued pursuant to Article 47 of Regulation (EU) 2024/1689 (EU AI Act)"
      ),
      React.createElement(View, { style: declarationStyles.divider }),

      // Provider & system identification
      field("Provider (name and address)", "provider_identification"),
      field("AI system name, version and purpose", "system_identification"),

      // Declaration statement
      section("Declaration Statement", "declaration_statement"),

      // Harmonised standards
      section("Harmonised Standards Applied", "harmonised_standards_applied"),

      // Notified body
      section("Notified Body Involvement", "notified_body_involvement"),

      // EU AI Act requirements
      section("Relevant EU AI Act Requirements", "relevant_eu_ai_act_requirements"),

      // Signature block
      React.createElement(View, { style: declarationStyles.signatureBox },
        React.createElement(Text, { style: declarationStyles.signatureLabel }, "Place, Date and Authorised Signature"),
        React.createElement(Text, { style: declarationStyles.bodyText }, flattenValue(content["place_date_and_signature"] ?? "")),
        React.createElement(View, { style: declarationStyles.signatureLine }),
        React.createElement(Text, { style: declarationStyles.signatureHint },
          "Authorised representative signature — name and position of signatory"
        )
      ),

      // Footer
      React.createElement(View, { style: declarationStyles.footer, fixed: true },
        React.createElement(Text, null, "Generated by ActGuard — EU AI Act Compliance Suite")
      )
    )
  );
}

export async function GET(req: Request) {
  try {
    const { session, error } = await requireRole("viewer");
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const doc = await db.complianceDocument.findFirst({
      where: { id: documentId },
      include: { aiSystem: { select: { orgId: true, name: true } } },
    });

    if (!doc || doc.aiSystem.orgId !== session!.user.orgId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const content = doc.content as Record<string, unknown>;
    const sections = Object.keys(content).sort((a, b) => {
      const numA = parseInt(SECTION_LABELS[a]?.match(/^(\d+)/)?.[1] || "99");
      const numB = parseInt(SECTION_LABELS[b]?.match(/^(\d+)/)?.[1] || "99");
      return numA - numB;
    });

    const docTypeLabel = DOC_TYPE_LABELS[doc.docType] || doc.docType;
    const systemName = doc.aiSystem.name;

    // Declaration of Conformity gets its own legal-document layout
    if (doc.docType === "declaration_of_conformity") {
      const pdfDoc = buildDeclarationPdf(content, systemName, doc.version, doc.generatedAt);
      const buffer = await renderToBuffer(pdfDoc);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="declaration-of-conformity-v${doc.version}.pdf"`,
        },
      });
    }

    const pdfDoc = React.createElement(Document, null,
      React.createElement(Page, { size: "A4", style: styles.page },
        // Header
        React.createElement(View, { style: styles.header },
          React.createElement(View, { style: styles.brandRow },
            React.createElement(Text, { style: styles.brandText }, "ACTGUARD")
          ),
          React.createElement(Text, { style: styles.title }, docTypeLabel),
          React.createElement(Text, { style: styles.subtitle },
            `${systemName} — Version ${doc.version} — ${doc.generatedAt.toLocaleDateString()}`
          )
        ),
        // Sections
        ...sections.map((key) =>
          React.createElement(View, { key, wrap: false },
            React.createElement(Text, { style: styles.sectionTitle },
              SECTION_LABELS[key] || key
            ),
            renderSectionContent(key, content[key])
          )
        ),
        // Footer
        React.createElement(View, { style: styles.footer, fixed: true },
          React.createElement(Text, null, "Generated by ActGuard — EU AI Act Compliance Suite")
        )
      )
    );

    const buffer = await renderToBuffer(pdfDoc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.docType}-v${doc.version}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF export error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
