import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { getContextForPrompt } from "@/lib/rag";
import { requireRole } from "@/lib/rbac";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DOC_PROMPTS: Record<string, { ragQuery: string; systemPrompt: string; sections: string[] }> = {
  technical_doc: {
    ragQuery: "Article 11 technical documentation Annex IV requirements",
    systemPrompt: `You are an EU AI Act compliance documentation specialist. Generate technical documentation per Article 11 and Annex IV requirements for the following AI system.

Each section must be specific, actionable, and auditable — not generic boilerplate. Reference the system's actual data types, deployment context, and risk factors. Flag any sections where additional information from the provider is needed with [ACTION REQUIRED: description].

Return a JSON object where each key is a section name and the value is the detailed content for that section. Use these exact section keys:`,
    sections: [
      "general_description",
      "elements_and_development_process",
      "monitoring_functioning_control",
      "risk_management_system",
      "data_requirements_and_governance",
      "performance_metrics_robustness_cybersecurity",
      "foreseeable_misuse_prevention",
      "human_oversight_measures",
      "expected_lifetime_and_maintenance",
    ],
  },
  risk_management_plan: {
    ragQuery: "Article 9 risk management system continuous iterative process",
    systemPrompt: `You are an EU AI Act risk management specialist. Generate a risk management plan per Article 9 requirements for the following AI system.

The plan must identify specific risks based on the system's actual data types, affected populations, and deployment context. Each risk must have a concrete mitigation measure. Do not use generic placeholders.

Return a JSON object with these exact section keys:`,
    sections: [
      "known_and_foreseeable_risks",
      "risk_estimation_matrix",
      "risk_evaluation_thresholds",
      "mitigation_measures",
      "residual_risk_assessment",
      "testing_and_validation",
      "post_market_monitoring_plan",
      "review_schedule",
    ],
  },
  data_governance: {
    ragQuery: "Article 10 data governance training validation testing data sets",
    systemPrompt: `You are an EU AI Act data governance specialist. Generate a data governance record per Article 10 requirements for the following AI system.

Document specific data practices based on the system's actual data types and processing activities. Be concrete about bias detection measures and data quality standards.

Return a JSON object with these exact section keys:`,
    sections: [
      "data_collection_methods_and_sources",
      "data_preprocessing_and_annotation",
      "data_preparation_operations",
      "assumptions_about_representativeness",
      "availability_quantity_suitability_assessment",
      "bias_examination_and_detection",
      "gap_identification_and_mitigation",
      "data_protection_impact_integration",
    ],
  },
  conformity_assessment: {
    ragQuery: "Article 43 conformity assessment procedures notified bodies Annex VI Annex VII",
    systemPrompt: `You are an EU AI Act conformity assessment specialist. Generate a conformity assessment document per Article 43, Annex VI, and Annex VII requirements for the following AI system.

The assessment must evaluate whether the system meets all applicable requirements of the regulation. Be specific about the assessment methodology, evidence gathered, and compliance gaps identified. Reference the system's actual risk tier, data practices, and deployment context.

Return a JSON object with these exact section keys:`,
    sections: [
      "assessment_scope_and_objectives",
      "applicable_requirements",
      "quality_management_system_review",
      "technical_documentation_review",
      "design_and_development_process_audit",
      "post_market_monitoring_review",
      "compliance_findings_and_gaps",
      "declaration_of_conformity_draft",
    ],
  },
  transparency_info: {
    ragQuery: "Article 13 transparency provision information to deployers Article 50 transparency obligations",
    systemPrompt: `You are an EU AI Act transparency specialist. Generate a transparency information document per Article 13 and Article 50 requirements for the following AI system.

The document must clearly communicate the system's capabilities, limitations, and intended use to deployers and end-users. Include specific instructions for human oversight and interpretation of outputs. Be concrete based on the system's actual functionality.

Return a JSON object with these exact section keys:`,
    sections: [
      "system_identity_and_provider",
      "intended_purpose_and_use_cases",
      "capabilities_and_limitations",
      "human_oversight_instructions",
      "input_data_specifications",
      "output_interpretation_guidance",
      "risk_communication_to_users",
      "contact_and_reporting_channels",
    ],
  },
  human_oversight_plan: {
    ragQuery: "Article 14 human oversight measures appropriate human-machine interface tools",
    systemPrompt: `You are an EU AI Act human oversight specialist. Generate a human oversight plan per Article 14 requirements for the following AI system.

The plan must define specific oversight measures proportionate to the system's risk level. Include concrete procedures for human intervention, override mechanisms, and decision-review processes based on the system's actual deployment context and affected populations.

Return a JSON object with these exact section keys:`,
    sections: [
      "oversight_framework_and_objectives",
      "roles_and_responsibilities",
      "competency_requirements_and_training",
      "human_machine_interface_design",
      "intervention_and_override_procedures",
      "decision_review_and_appeal_process",
      "monitoring_and_escalation_protocols",
      "oversight_effectiveness_evaluation",
    ],
  },
  declaration_of_conformity: {
    ragQuery: "Article 47 EU declaration of conformity high-risk AI systems provider signed",
    systemPrompt: `You are an EU AI Act compliance specialist. Generate an EU Declaration of Conformity per Article 47 for the following high-risk AI system.

The declaration must be legally precise and auditable. Use the provider organisation name from the system context. Reference specific harmonised standards applied or note where self-assessment was used in the absence of applicable harmonised standards. Do not use generic placeholders — base each field on the system's actual data.

Return a JSON object with these exact section keys:`,
    sections: [
      "provider_identification",
      "system_identification",
      "declaration_statement",
      "harmonised_standards_applied",
      "notified_body_involvement",
      "relevant_eu_ai_act_requirements",
      "place_date_and_signature",
    ],
  },
};

const SECTION_LABELS: Record<string, string> = {
  general_description: "General description of the AI system",
  elements_and_development_process: "Elements and development process",
  monitoring_functioning_control: "Monitoring, functioning and control",
  risk_management_system: "Risk management system",
  data_requirements_and_governance: "Data requirements and governance",
  performance_metrics_robustness_cybersecurity: "Performance metrics, robustness and cybersecurity",
  foreseeable_misuse_prevention: "Foreseeable misuse and prevention",
  human_oversight_measures: "Human oversight measures",
  expected_lifetime_and_maintenance: "Expected lifetime and maintenance",
  known_and_foreseeable_risks: "Known and foreseeable risks",
  risk_estimation_matrix: "Risk estimation matrix",
  risk_evaluation_thresholds: "Risk evaluation thresholds",
  mitigation_measures: "Mitigation measures",
  residual_risk_assessment: "Residual risk assessment",
  testing_and_validation: "Testing and validation procedures",
  post_market_monitoring_plan: "Post-market monitoring plan",
  review_schedule: "Risk documentation and review schedule",
  data_collection_methods_and_sources: "Data collection methods and sources",
  data_preprocessing_and_annotation: "Data preprocessing and annotation",
  data_preparation_operations: "Data preparation operations",
  assumptions_about_representativeness: "Assumptions about representativeness",
  availability_quantity_suitability_assessment: "Availability, quantity and suitability",
  bias_examination_and_detection: "Bias examination and detection",
  gap_identification_and_mitigation: "Gap identification and mitigation",
  data_protection_impact_integration: "Data protection impact integration",
  // Conformity Assessment (Article 43)
  assessment_scope_and_objectives: "Assessment scope and objectives",
  applicable_requirements: "Applicable requirements",
  quality_management_system_review: "Quality management system review",
  technical_documentation_review: "Technical documentation review",
  design_and_development_process_audit: "Design and development process audit",
  post_market_monitoring_review: "Post-market monitoring review",
  compliance_findings_and_gaps: "Compliance findings and gaps",
  declaration_of_conformity_draft: "Declaration of conformity draft",
  // Transparency Information (Article 13 + 50)
  system_identity_and_provider: "System identity and provider",
  intended_purpose_and_use_cases: "Intended purpose and use cases",
  capabilities_and_limitations: "Capabilities and limitations",
  human_oversight_instructions: "Human oversight instructions",
  input_data_specifications: "Input data specifications",
  output_interpretation_guidance: "Output interpretation guidance",
  risk_communication_to_users: "Risk communication to users",
  contact_and_reporting_channels: "Contact and reporting channels",
  // Human Oversight Plan (Article 14)
  oversight_framework_and_objectives: "Oversight framework and objectives",
  roles_and_responsibilities: "Roles and responsibilities",
  competency_requirements_and_training: "Competency requirements and training",
  human_machine_interface_design: "Human-machine interface design",
  intervention_and_override_procedures: "Intervention and override procedures",
  decision_review_and_appeal_process: "Decision review and appeal process",
  monitoring_and_escalation_protocols: "Monitoring and escalation protocols",
  oversight_effectiveness_evaluation: "Oversight effectiveness evaluation",
  // Declaration of Conformity (Article 47)
  provider_identification: "Provider identification",
  system_identification: "AI system identification",
  declaration_statement: "Declaration statement",
  harmonised_standards_applied: "Harmonised standards applied",
  notified_body_involvement: "Notified body involvement",
  relevant_eu_ai_act_requirements: "Relevant EU AI Act requirements",
  place_date_and_signature: "Place, date and signature",
};

export async function POST(req: Request) {
  try {
    const { session, error } = await requireRole("compliance_officer");
    if (error) return error;

    const { systemId, docType } = await req.json();

    if (!systemId || !docType || !DOC_PROMPTS[docType]) {
      return NextResponse.json(
        { error: "systemId and valid docType are required" },
        { status: 400 }
      );
    }

    const system = await db.aiSystem.findFirst({
      where: { id: systemId, orgId: session!.user.orgId! },
    });

    if (!system) {
      return NextResponse.json({ error: "System not found" }, { status: 404 });
    }

    const config = DOC_PROMPTS[docType];

    // Get RAG context
    const ragContext = await getContextForPrompt(config.ragQuery, 3);

    const systemDescription = `AI System Name: ${system.name}
Description: ${system.description}
Purpose: ${system.purpose || "Not specified"}
Intended Use: ${system.intendedUse || "Not specified"}
Risk Tier: ${system.riskTier}
Data Types Processed: ${system.dataTypesProcessed.join(", ") || "None specified"}
Affected Populations: ${system.affectedPopulations.join(", ") || "None specified"}
Scale of Deployment: ${system.scaleOfDeployment || "Not specified"}
Deployment Member States: ${system.deploymentMemberStates.join(", ") || "Not specified"}
Human Oversight Level: ${system.humanOversightLevel || "Not specified"}
Integration: ${system.integrationDescription || "Not specified"}
Classification Reasoning: ${system.classificationReasoning ? JSON.parse(system.classificationReasoning).reasoning : "Not classified"}`;

    const sectionList = config.sections
      .map((s) => `- "${s}": ${SECTION_LABELS[s]}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${config.systemPrompt}\n\n${sectionList}\n\nRelevant EU AI Act context:\n${ragContext}`,
        },
        { role: "user", content: systemDescription },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4096,
    });

    const content = JSON.parse(completion.choices[0].message.content || "{}");

    // Check for existing doc to increment version
    const existing = await db.complianceDocument.findFirst({
      where: { aiSystemId: systemId, docType },
      orderBy: { version: "desc" },
    });

    const doc = await db.complianceDocument.create({
      data: {
        aiSystemId: systemId,
        docType,
        content,
        version: existing ? existing.version + 1 : 1,
        generatedBy: session.user.id,
      },
    });

    // Update system status
    if (system.status === "classified") {
      await db.aiSystem.update({
        where: { id: systemId },
        data: { status: "documenting" },
      });
    }

    return NextResponse.json({ document: doc });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Document generation error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
