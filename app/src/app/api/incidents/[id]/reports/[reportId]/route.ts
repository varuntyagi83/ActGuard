import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

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

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  try {
    const { session, error } = await requireRole("compliance_officer");
    if (error) return error;

    const { id, reportId } = await params;
    const body = await req.json();

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

    // Only allow editing if not yet submitted
    if (report.submittedAt) {
      return NextResponse.json(
        { error: "Cannot edit a submitted report" },
        { status: 400 }
      );
    }

    const { content } = body;
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const updated = await db.incidentReport.update({
      where: { id: reportId },
      data: { content },
    });

    return NextResponse.json({ report: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
