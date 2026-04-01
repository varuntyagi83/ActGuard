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
    console.error("Document generation error:", error);
    return NextResponse.json(
      { error: "Document generation failed" },
      { status: 500 }
    );
  }
}
