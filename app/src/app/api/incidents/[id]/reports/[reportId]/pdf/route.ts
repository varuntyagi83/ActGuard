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

    const buffer = await renderIncidentReportPdf(report.content as unknown as IncidentReportData);
    const filename = `incident-report-${report.reportNumber}-${report.reportType}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
