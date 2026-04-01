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

    const doc = await db.complianceDocument.findFirst({
      where: { id },
      include: { aiSystem: { select: { orgId: true, name: true } } },
    });

    if (!doc || doc.aiSystem.orgId !== session!.user.orgId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ document: doc });
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
    const { content } = await req.json();

    const doc = await db.complianceDocument.findFirst({
      where: { id },
      include: { aiSystem: { select: { orgId: true } } },
    });

    if (!doc || doc.aiSystem.orgId !== session!.user.orgId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await db.complianceDocument.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json({ document: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
