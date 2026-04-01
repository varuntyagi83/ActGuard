import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DocumentViewer } from "@/components/document-viewer";

const DOC_TYPE_LABELS: Record<string, string> = {
  technical_doc: "Technical Documentation",
  risk_management_plan: "Risk Management Plan",
  data_governance: "Data Governance Record",
  conformity_assessment: "Conformity Assessment",
  transparency_info: "Transparency Information",
  human_oversight_plan: "Human Oversight Plan",
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
  // Conformity Assessment
  assessment_scope_and_objectives: "1. Assessment Scope and Objectives",
  applicable_requirements: "2. Applicable Requirements",
  quality_management_system_review: "3. Quality Management System Review",
  technical_documentation_review: "4. Technical Documentation Review",
  design_and_development_process_audit: "5. Design and Development Process Audit",
  post_market_monitoring_review: "6. Post-Market Monitoring Review",
  compliance_findings_and_gaps: "7. Compliance Findings and Gaps",
  declaration_of_conformity_draft: "8. Declaration of Conformity Draft",
  // Transparency Information
  system_identity_and_provider: "1. System Identity and Provider",
  intended_purpose_and_use_cases: "2. Intended Purpose and Use Cases",
  capabilities_and_limitations: "3. Capabilities and Limitations",
  human_oversight_instructions: "4. Human Oversight Instructions",
  input_data_specifications: "5. Input Data Specifications",
  output_interpretation_guidance: "6. Output Interpretation Guidance",
  risk_communication_to_users: "7. Risk Communication to Users",
  contact_and_reporting_channels: "8. Contact and Reporting Channels",
  // Human Oversight Plan
  oversight_framework_and_objectives: "1. Oversight Framework and Objectives",
  roles_and_responsibilities: "2. Roles and Responsibilities",
  competency_requirements_and_training: "3. Competency Requirements and Training",
  human_machine_interface_design: "4. Human-Machine Interface Design",
  intervention_and_override_procedures: "5. Intervention and Override Procedures",
  decision_review_and_appeal_process: "6. Decision Review and Appeal Process",
  monitoring_and_escalation_protocols: "7. Monitoring and Escalation Protocols",
  oversight_effectiveness_evaluation: "8. Oversight Effectiveness Evaluation",
};

export default async function DocumentViewPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const session = await auth();
  const orgId = session!.user.orgId!;
  const { id, docId } = await params;

  const doc = await db.complianceDocument.findFirst({
    where: { id: docId },
    include: { aiSystem: { select: { orgId: true, name: true } } },
  });

  if (!doc || doc.aiSystem.orgId !== orgId) notFound();

  // Fetch all versions of this document type for version navigation
  const allVersions = await db.complianceDocument.findMany({
    where: { aiSystemId: doc.aiSystemId, docType: doc.docType },
    select: { id: true, version: true, generatedAt: true },
    orderBy: { version: "desc" },
  });

  return (
    <div>
      <Link href={`/systems/${id}/documents`}>
        <Button variant="ghost" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Button>
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {DOC_TYPE_LABELS[doc.docType] || doc.docType}
            <Badge variant="secondary">v{doc.version}</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            {doc.aiSystem.name} — Generated{" "}
            {doc.generatedAt.toLocaleDateString()}
          </p>
        </div>
        {allVersions.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Version:</span>
            <div className="flex gap-1">
              {allVersions.map((v) => (
                <Link key={v.id} href={`/systems/${id}/documents/${v.id}`}>
                  <Button
                    variant={v.id === doc.id ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs min-w-[40px]"
                  >
                    v{v.version}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <DocumentViewer
        documentId={doc.id}
        docType={doc.docType}
        content={doc.content as Record<string, string>}
        sectionLabels={SECTION_LABELS}
        systemName={doc.aiSystem.name}
        docTypeLabel={DOC_TYPE_LABELS[doc.docType] || doc.docType}
        version={doc.version}
      />
    </div>
  );
}
