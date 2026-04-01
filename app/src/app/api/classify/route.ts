import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an EU AI Act risk classification expert. You have deep knowledge of Regulation (EU) 2024/1689, particularly Article 5 (prohibited practices), Article 6 (classification rules for high-risk), Annex I (EU harmonisation legislation), and Annex III (high-risk AI system areas).

Given the following AI system description, classify it into one of four risk tiers:
- UNACCEPTABLE (Article 5): social scoring, real-time biometric identification in public, manipulation of vulnerable groups, emotion recognition in workplace/education
- HIGH (Article 6 + Annex III): biometric identification, critical infrastructure management, education/vocational training assessment, employment/worker management, essential services access (credit, insurance), law enforcement, migration/border control, justice/democratic processes
- LIMITED (Article 50): chatbots, emotion recognition, deepfakes, biometric categorisation (with transparency obligations only)
- MINIMAL: all other AI systems (no mandatory requirements, voluntary codes of conduct)

You MUST return valid JSON matching this exact schema:
{
  "tier": "unacceptable" | "high" | "limited" | "minimal",
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<detailed paragraph explaining why this tier was selected>",
  "relevant_articles": ["<article references like 'Article 6(2)', 'Annex III point 4'>"],
  "key_risk_factors": ["<specific risk factors identified>"],
  "annex_iii_category": "<category name if high-risk, null otherwise>",
  "obligations_summary": ["<list of key obligations for this risk tier>"]
}`;

export async function POST(req: Request) {
  try {
    const { session, error } = await requireRole("compliance_officer");
    if (error) return error;

    const { systemId } = await req.json();
    if (!systemId) {
      return NextResponse.json(
        { error: "systemId is required" },
        { status: 400 }
      );
    }

    const system = await db.aiSystem.findFirst({
      where: { id: systemId, orgId: session!.user.orgId! },
    });

    if (!system) {
      return NextResponse.json(
        { error: "System not found" },
        { status: 404 }
      );
    }

    const userMessage = `AI System Name: ${system.name}

Description: ${system.description}

Purpose: ${system.purpose || "Not specified"}

Intended Use: ${system.intendedUse || "Not specified"}

Data Types Processed: ${system.dataTypesProcessed.join(", ") || "None specified"}

Affected Populations: ${system.affectedPopulations.join(", ") || "None specified"}

Scale of Deployment: ${system.scaleOfDeployment || "Not specified"}

Deployment Member States: ${system.deploymentMemberStates.join(", ") || "Not specified"}

Human Oversight Level: ${system.humanOversightLevel || "Not specified"}

Integration: ${system.integrationDescription || "Not specified"}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    // Update system with classification
    const updated = await db.aiSystem.update({
      where: { id: systemId },
      data: {
        riskTier: result.tier,
        classificationReasoning: JSON.stringify(result),
        status: "classified",
      },
    });

    return NextResponse.json({
      system: updated,
      classification: result,
    });
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}
