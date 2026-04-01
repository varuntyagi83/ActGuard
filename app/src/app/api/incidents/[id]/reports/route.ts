import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireRole("viewer");
    if (error) return error;

    const { id } = await params;

    // Verify incident belongs to org
    const incident = await db.incident.findFirst({
      where: { id, orgId: session!.user.orgId! },
    });

    if (!incident) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const reports = await db.incidentReport.findMany({
      where: { incidentId: id },
      select: {
        id: true,
        reportType: true,
        reportNumber: true,
        submittedAt: true,
        submittedTo: true,
        createdAt: true,
      },
      orderBy: { reportNumber: "asc" },
    });

    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireRole("compliance_officer");
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const { reportType } = body;

    // Validate reportType
    const validTypes = ["initial", "follow_up", "combined", "final"];
    if (!reportType || !validTypes.includes(reportType)) {
      return NextResponse.json(
        { error: "Invalid reportType. Must be one of: initial, follow_up, combined, final" },
        { status: 400 }
      );
    }

    // Fetch incident with aiSystem, verify org ownership
    const incident = await db.incident.findFirst({
      where: { id, orgId: session!.user.orgId! },
      include: {
        aiSystem: {
          select: {
            name: true,
            description: true,
            riskTier: true,
            euDatabaseId: true,
            affectedPopulations: true,
            deploymentMemberStates: true,
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If initial, check no existing initial report
    if (reportType === "initial") {
      const existingInitial = await db.incidentReport.findFirst({
        where: { incidentId: id, reportType: "initial" },
      });
      if (existingInitial) {
        return NextResponse.json(
          { error: "An initial report already exists for this incident" },
          { status: 400 }
        );
      }
    }

    // Compute reportNumber
    const existingCount = await db.incidentReport.count({
      where: { incidentId: id },
    });
    const reportNumber = existingCount + 1;

    // Fetch org name
    const org = await db.organization.findUnique({
      where: { id: session!.user.orgId! },
      select: { name: true },
    });

    // Build content JSON with 5 sections pre-populated from incident data
    const content = {
      section1_provider: {
        title: "Section 1: Provider Information",
        organizationName: org?.name || "",
        contactEmail: session!.user.email || "",
        memberState: incident.memberState || "",
      },
      section2_system: {
        title: "Section 2: AI System Information",
        systemName: incident.aiSystem?.name || "",
        systemDescription: incident.aiSystem?.description || "",
        riskTier: incident.aiSystem?.riskTier || "",
        euDatabaseId: incident.aiSystem?.euDatabaseId || "",
        affectedPopulations: incident.aiSystem?.affectedPopulations || [],
        deploymentMemberStates: incident.aiSystem?.deploymentMemberStates || [],
      },
      section3_incident: {
        title: "Section 3: Incident Details",
        incidentTitle: incident.title,
        incidentDescription: incident.description,
        severity: incident.severity,
        incidentType: incident.incidentType || "",
        incidentDate: incident.incidentDate.toISOString(),
        reportingDeadline: incident.reportingDeadline.toISOString(),
      },
      section4_impact: {
        title: "Section 4: Impact Assessment",
        rootCause: incident.rootCause || "",
        remediationSteps: incident.remediationSteps || [],
        affectedIndividuals: "",
        crossBorderImpact: "",
      },
      section5_measures: {
        title: "Section 5: Corrective Measures",
        immediateMeasures: "",
        longTermMeasures: "",
        resolutionNotes: incident.resolutionNotes || "",
        preventionPlan: "",
      },
    };

    // Create the report
    const report = await db.incidentReport.create({
      data: {
        incidentId: id,
        reportType,
        reportNumber,
        content,
        submittedAt: null,
      },
    });

    // Add timeline entry
    await db.incidentTimeline.create({
      data: {
        incidentId: id,
        eventType: "report_created",
        description: `Report #${reportNumber} (${reportType}) drafted`,
        createdBy: session!.user.id,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
