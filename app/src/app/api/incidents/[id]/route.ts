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

    const incident = await db.incident.findFirst({
      where: { id, orgId: session!.user.orgId! },
      include: {
        aiSystem: { select: { name: true } },
        timeline: {
          include: { creator: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        creator: { select: { name: true, email: true } },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ incident });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireRole("compliance_officer");
    if (error) return error;

    const { id } = await params;
    const body = await req.json();

    const incident = await db.incident.findFirst({
      where: { id, orgId: session!.user.orgId! },
    });

    if (!incident) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { status, rootCause, remediationSteps, resolutionNotes } = body;

    const data: Record<string, unknown> = {};
    if (status) {
      data.status = status;
      if (status === "reported" && !incident.reportedAt) {
        data.reportedAt = new Date();
      }
    }
    if (rootCause !== undefined) data.rootCause = rootCause;
    if (remediationSteps !== undefined) data.remediationSteps = remediationSteps;
    if (resolutionNotes !== undefined) data.resolutionNotes = resolutionNotes;

    const updated = await db.incident.update({
      where: { id },
      data,
    });

    // Add timeline entry for status changes
    if (status && status !== incident.status) {
      await db.incidentTimeline.create({
        data: {
          incidentId: id,
          eventType: "status_change",
          description: `Status changed from ${incident.status} to ${status}`,
          createdBy: session!.user.id,
        },
      });
    }

    return NextResponse.json({ incident: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
