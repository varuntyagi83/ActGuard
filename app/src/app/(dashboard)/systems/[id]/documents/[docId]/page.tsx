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
      </div>

      <DocumentViewer
        documentId={doc.id}
        docType={doc.docType}
        content={doc.content as Record<string, string>}
        sectionLabels={SECTION_LABELS}
      />
    </div>
  );
}
