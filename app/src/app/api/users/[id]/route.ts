import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireRole("admin");
    if (error) return error;

    const { id } = await params;
    const { role } = await req.json();

    const validRoles: Role[] = ["viewer", "compliance_officer", "admin"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Role must be viewer, compliance_officer, or admin" },
        { status: 400 }
      );
    }

    // Can't change own role
    if (id === session!.user.id) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    // User must belong to same org
    const user = await db.user.findFirst({
      where: { id, orgId: session!.user.orgId! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await db.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json({
      user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireRole("admin");
    if (error) return error;

    const { id } = await params;

    // Can't remove yourself
    if (id === session!.user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: { id, orgId: session!.user.orgId! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove from org (don't delete the user)
    await db.user.update({
      where: { id },
      data: { orgId: null, role: "viewer" },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
