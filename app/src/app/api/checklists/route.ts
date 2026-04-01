import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

// EU AI Act compliance checklist templates by risk tier
const CHECKLIST_TEMPLATES: Record<string, { label: string; items: { key: string; label: string; article: string }[] }> = {
  high_risk_compliance: {
    label: "High-Risk AI System Compliance",
    items: [
      { key: "risk_management", label: "Establish risk management system (continuous, iterative)", article: "Art. 9" },
      { key: "data_governance", label: "Implement data governance and management practices", article: "Art. 10" },
      { key: "technical_documentation", label: "Prepare technical documentation (Annex IV)", article: "Art. 11" },
      { key: "record_keeping", label: "Design system for automatic logging of events", article: "Art. 12" },
      { key: "transparency", label: "Provide transparency information to deployers", article: "Art. 13" },
      { key: "human_oversight", label: "Enable human oversight measures", article: "Art. 14" },
      { key: "accuracy_robustness", label: "Ensure accuracy, robustness, and cybersecurity", article: "Art. 15" },
      { key: "conformity_assessment", label: "Complete conformity assessment procedure", article: "Art. 43" },
      { key: "eu_declaration", label: "Draw up EU declaration of conformity", article: "Art. 47" },
      { key: "ce_marking", label: "Affix CE marking", article: "Art. 48" },
      { key: "registration", label: "Register in EU database", article: "Art. 49" },
      { key: "post_market", label: "Implement post-market monitoring system", article: "Art. 72" },
      { key: "serious_incident", label: "Establish serious incident reporting procedure", article: "Art. 73" },
      { key: "quality_management", label: "Put in place quality management system", article: "Art. 17" },
    ],
  },
  limited_risk_compliance: {
    label: "Limited-Risk AI System Compliance",
    items: [
      { key: "ai_disclosure", label: "Disclose AI interaction to users", article: "Art. 50(1)" },
      { key: "emotion_disclosure", label: "Disclose emotion recognition use (if applicable)", article: "Art. 50(3)" },
      { key: "deepfake_disclosure", label: "Label AI-generated content (if applicable)", article: "Art. 50(4)" },
      { key: "transparency_info", label: "Provide user-facing transparency information", article: "Art. 13" },
      { key: "voluntary_code", label: "Consider voluntary code of conduct", article: "Art. 95" },
    ],
  },
  minimal_risk_compliance: {
    label: "Minimal-Risk AI System Compliance",
    items: [
      { key: "voluntary_code", label: "Consider voluntary code of conduct", article: "Art. 95" },
      { key: "ai_literacy", label: "Ensure AI literacy for staff operating the system", article: "Art. 4" },
      { key: "basic_transparency", label: "Provide basic transparency to users", article: "Best practice" },
    ],
  },
};

function getTemplateForTier(riskTier: string): string {
  if (riskTier === "high" || riskTier === "unacceptable") return "high_risk_compliance";
  if (riskTier === "limited") return "limited_risk_compliance";
  return "minimal_risk_compliance";
}

// GET: Fetch or auto-generate checklist for a system
export async function GET(req: Request) {
  try {
    const { error, session } = await requireRole("viewer");
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const systemId = searchParams.get("systemId");

    if (!systemId) {
      return NextResponse.json({ error: "systemId is required" }, { status: 400 });
    }

    const system = await db.aiSystem.findFirst({
      where: { id: systemId, orgId: session!.user.orgId! },
    });

    if (!system) {
      return NextResponse.json({ error: "System not found" }, { status: 404 });
    }

    const checklistType = getTemplateForTier(system.riskTier);

    // Check for existing checklist
    let checklist = await db.complianceChecklist.findFirst({
      where: { aiSystemId: systemId, checklistType },
    });

    // Auto-generate if none exists
    if (!checklist) {
      const template = CHECKLIST_TEMPLATES[checklistType];
      const items = template.items.map((item) => ({
        ...item,
        completed: false,
        notes: "",
      }));

      checklist = await db.complianceChecklist.create({
        data: {
          aiSystemId: systemId,
          checklistType,
          items,
          completionPercentage: 0,
        },
      });
    }

    return NextResponse.json({
      checklist,
      templateLabel: CHECKLIST_TEMPLATES[checklistType].label,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update checklist items (toggle completion, add notes)
export async function PATCH(req: Request) {
  try {
    const { error } = await requireRole("compliance_officer");
    if (error) return error;

    const { checklistId, items } = await req.json();

    if (!checklistId || !items) {
      return NextResponse.json({ error: "checklistId and items are required" }, { status: 400 });
    }

    const completedCount = items.filter((i: { completed: boolean }) => i.completed).length;
    const completionPercentage = Math.round((completedCount / items.length) * 100);

    const updated = await db.complianceChecklist.update({
      where: { id: checklistId },
      data: {
        items,
        completionPercentage,
        lastReviewed: new Date(),
      },
    });

    return NextResponse.json({ checklist: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
