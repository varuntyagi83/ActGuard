import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { getContextForPrompt } from "@/lib/rag";
import { requireRole } from "@/lib/rbac";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { session, error } = await requireRole("compliance_officer");
    if (error) return error;

    const { documentId, sectionKey } = await req.json();

    const doc = await db.complianceDocument.findFirst({
      where: { id: documentId },
      include: {
        aiSystem: {
          select: { orgId: true, name: true, description: true, riskTier: true, dataTypesProcessed: true, affectedPopulations: true },
        },
      },
    });

    if (!doc || doc.aiSystem.orgId !== session!.user.orgId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ragContext = await getContextForPrompt(`${sectionKey} EU AI Act requirements`, 2);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an EU AI Act compliance specialist. Regenerate ONLY the section "${sectionKey}" for a ${doc.docType} document. Be specific to this AI system, not generic. Return a JSON object with a single key "${sectionKey}" and the regenerated content as its value.\n\nEU AI Act context:\n${ragContext}`,
        },
        {
          role: "user",
          content: `AI System: ${doc.aiSystem.name}\nDescription: ${doc.aiSystem.description}\nRisk Tier: ${doc.aiSystem.riskTier}\nData Types: ${doc.aiSystem.dataTypesProcessed.join(", ")}\nAffected Populations: ${doc.aiSystem.affectedPopulations.join(", ")}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    const newSectionContent = result[sectionKey];

    if (!newSectionContent) {
      return NextResponse.json({ error: "Failed to regenerate section" }, { status: 500 });
    }

    // Update the document content
    const currentContent = doc.content as Record<string, unknown>;
    currentContent[sectionKey] = newSectionContent;

    const updated = await db.complianceDocument.update({
      where: { id: documentId },
      data: { content: currentContent as any },
    });

    return NextResponse.json({ document: updated, section: sectionKey, content: newSectionContent });
  } catch (error) {
    console.error("Regenerate section error:", error);
    return NextResponse.json({ error: "Regeneration failed" }, { status: 500 });
  }
}
