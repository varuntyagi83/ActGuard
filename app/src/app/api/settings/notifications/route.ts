import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function PATCH(req: Request) {
  const { session, error } = await requireRole("compliance_officer");
  if (error) return error;

  const body = await req.json();
  const { alertAt72h, alertAt24h, alertOnOverdue } = body;

  await db.organization.update({
    where: { id: session!.user.orgId! },
    data: {
      ...(typeof alertAt72h === "boolean" && { alertAt72h }),
      ...(typeof alertAt24h === "boolean" && { alertAt24h }),
      ...(typeof alertOnOverdue === "boolean" && { alertOnOverdue }),
    },
  });

  return NextResponse.json({ ok: true });
}
