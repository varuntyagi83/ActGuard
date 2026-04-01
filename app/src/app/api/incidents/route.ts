import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function POST(req: Request) {
  try {
    const { session, error } = await requireRole("compliance_officer");
    if (error) return error;

    const body = await req.json();
    const {
      title,
      description,
      severity,
      incidentDate,
      aiSystemId,
      memberState,
    } = body;

    if (!title || !description || !severity || !incidentDate) {
      return NextResponse.json(
        { error: "Title, description, severity, and incident date are required" },
        { status: 400 }
      );
    }

    if (!["critical", "major", "minor"].includes(severity)) {
      return NextResponse.json(
        { error: "Severity must be critical, major, or minor" },
        { status: 400 }
      );
    }

    // 24-hour reporting deadline per Article 72
    const incidentDateObj = new Date(incidentDate);
    const reportingDeadline = new Date(incidentDateObj.getTime() + 24 * 60 * 60 * 1000);

    // Auto-resolve authority from national_authorities table
    let authorityName: string | null = null;
    let authorityContact: string | null = null;
    if (memberState) {
      const authority = await db.nationalAuthority.findFirst({
        where: { countryCode: memberState },
      });
      if (authority) {
        authorityName = authority.authorityName;
        authorityContact = authority.contactEmail;
      }
    }

    const incident = await db.incident.create({
      data: {
        orgId: session!.user.orgId!,
        aiSystemId: aiSystemId || null,
        title,
        description,
        severity,
        incidentDate: incidentDateObj,
        reportingDeadline,
        status: "draft",
        memberState: memberState || null,
        authorityName,
        authorityContact,
        createdBy: session!.user.id,
      },
    });

    // Create initial timeline entry
    await db.incidentTimeline.create({
      data: {
        incidentId: incident.id,
        eventType: "created",
        description: `Incident reported by ${session!.user.name || session!.user.email}`,
        createdBy: session!.user.id,
      },
    });

    return NextResponse.json({ incident }, { status: 201 });
  } catch (err) {
    console.error("Incident creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
