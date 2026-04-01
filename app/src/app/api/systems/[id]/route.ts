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

    const system = await db.aiSystem.findFirst({
      where: { id, orgId: session!.user.orgId! },
      include: {
        complianceDocuments: true,
        checklists: true,
      },
    });

    if (!system) {
      return NextResponse.json({ error: "System not found" }, { status: 404 });
    }

    return NextResponse.json({ system });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    const existing = await db.aiSystem.findFirst({
      where: { id, orgId: session!.user.orgId! },
    });

    if (!existing) {
      return NextResponse.json({ error: "System not found" }, { status: 404 });
    }

    const system = await db.aiSystem.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ system });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
