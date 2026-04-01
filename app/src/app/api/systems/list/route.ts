import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  try {
    const { session, error } = await requireRole("viewer");
    if (error) return error;

    const systems = await db.aiSystem.findMany({
      where: { orgId: session!.user.orgId! },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ systems });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
