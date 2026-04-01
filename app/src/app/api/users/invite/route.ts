import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";

export async function POST(req: Request) {
  try {
    const { session, error } = await requireRole("admin");
    if (error) return error;

    const { email, name, role, password } = await req.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const validRoles: Role[] = ["viewer", "compliance_officer", "admin"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Role must be viewer, compliance_officer, or admin" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      // If user exists but has no org, add them to this org
      if (!existing.orgId) {
        const updated = await db.user.update({
          where: { email },
          data: { orgId: session!.user.orgId!, role },
        });
        return NextResponse.json(
          { user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role } },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: "This email is already registered with another organization" },
        { status: 409 }
      );
    }

    // Create new user directly in this org
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        name: name || null,
        email,
        hashedPassword,
        orgId: session!.user.orgId!,
        role,
      },
    });

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
