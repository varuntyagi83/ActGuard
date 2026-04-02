import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { renderIncidentReportPdf, type IncidentReportData } from "@/lib/incident-report-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  try {
    const { session, error } = await requireRole("viewer");
    if (error) return error;

    const { id, reportId } = await params;

    // Verify incident belongs to org
    const incident = await db.incident.findFirst({
      where: { id, orgId: session!.user.orgId! },
    });

    if (!incident) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const report = await db.incidentReport.findFirst({
      where: { id: reportId, incidentId: id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Normalize content: support both flat (new) and section-based (old) format
    const raw = report.content as Record<string, unknown>;
    let data: IncidentReportData;
    if (raw.section1_provider) {
      // Old nested format — map to flat IncidentReportData
      const s1 = raw.section1_provider as Record<string, unknown>;
      const s2 = raw.section2_system as Record<string, unknown>;
      const s3 = raw.section3_incident as Record<string, unknown>;
      const s4 = raw.section4_impact as Record<string, unknown>;
      const s5 = raw.section5_measures as Record<string, unknown>;
      data = {
        reportType: report.reportType,
        reportNumber: report.reportNumber,
        reportDate: report.createdAt.toISOString().split("T")[0],
        authorityName: incident.authorityName || "",
        authorityContact: incident.authorityContact || "",
        memberState: (s1?.memberState as string) || incident.memberState || "",
        systemName: (s2?.systemName as string) || "",
        systemDescription: (s2?.systemDescription as string) || "",
        euDatabaseId: (s2?.euDatabaseId as string) || "",
        riskTier: (s2?.riskTier as string) || "",
        deploymentMemberStates: (s2?.deploymentMemberStates as string[]) || [],
        incidentTitle: (s3?.incidentTitle as string) || incident.title,
        incidentDate: incident.incidentDate.toISOString().split("T")[0],
        incidentType: (s3?.incidentType as string) || "",
        severity: (s3?.severity as string) || incident.severity,
        description: (s3?.incidentDescription as string) || incident.description,
        affectedPopulations: (s2?.affectedPopulations as string[]) || [],
        remediationSteps: (s4?.remediationSteps as string[]) || incident.remediationSteps || [],
        rootCause: (s4?.rootCause as string) || incident.rootCause || "",
        resolutionNotes: (s5?.resolutionNotes as string) || incident.resolutionNotes || "",
        investigationStatus: incident.status,
        submitterName: (s1?.contactEmail as string) || "",
        organizationName: (s1?.organizationName as string) || "",
      };
    } else {
      data = raw as unknown as IncidentReportData;
    }

    const buffer = await renderIncidentReportPdf(data);
    const filename = `incident-report-${report.reportNumber}-${report.reportType}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
