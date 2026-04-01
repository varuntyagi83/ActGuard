import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { renderIncidentReportPdf, type IncidentReportData } from "@/lib/incident-report-pdf";
import { sendIncidentReportEmail } from "@/lib/email";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  try {
    const { session, error } = await requireRole("compliance_officer");
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

    // Only allow submission if not yet submitted
    if (report.submittedAt) {
      return NextResponse.json(
        { error: "Report has already been submitted" },
        { status: 400 }
      );
    }

    // Check authority email
    if (!incident.authorityContact) {
      return NextResponse.json(
        { error: "No authority email configured" },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await renderIncidentReportPdf(report.content as unknown as IncidentReportData);

    // Send email to authority
    await sendIncidentReportEmail(
      incident.authorityContact,
      incident.title,
      report.reportType,
      Buffer.from(pdfBuffer)
    );

    // Update report as submitted
    const updatedReport = await db.incidentReport.update({
      where: { id: reportId },
      data: {
        submittedAt: new Date(),
        submittedTo: incident.authorityContact,
        submittedBy: session!.user.id,
      },
    });

    // Update incident status and reportedAt
    const incidentUpdate: Record<string, unknown> = {};
    if (incident.status !== "reported") {
      incidentUpdate.status = "reported";
    }
    if (!incident.reportedAt) {
      incidentUpdate.reportedAt = new Date();
    }
    if (Object.keys(incidentUpdate).length > 0) {
      await db.incident.update({
        where: { id },
        data: incidentUpdate,
      });
    }

    // Add timeline entry
    await db.incidentTimeline.create({
      data: {
        incidentId: id,
        eventType: "authority_submission",
        description: `Report #${report.reportNumber} submitted to ${incident.authorityName || "authority"} (${incident.authorityContact})`,
        createdBy: session!.user.id,
      },
    });

    return NextResponse.json({ report: updatedReport });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
