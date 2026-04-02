import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function POST(req: Request) {
  try {
    const { session, error } = await requireRole("compliance_officer");
    if (error) return error;

    const body = await req.json();
    const {
      name,
      description,
      purpose,
      intendedUse,
      dataTypesProcessed,
      affectedPopulations,
      scaleOfDeployment,
      deploymentMemberStates,
      integrationDescription,
      humanOversightLevel,
      euDatabaseId,
      classify,
    } = body;

    if (!name || !description || description.length < 100) {
      return NextResponse.json(
        { error: "Name and description (min 100 chars) are required" },
        { status: 400 }
      );
    }

    // Enforce 1-system limit per organisation (bypass for owner account)
    const UNLIMITED_EMAILS = ["varun.tyagi83@gmail.com"];
    if (!UNLIMITED_EMAILS.includes(session!.user.email!)) {
      const existing = await db.aiSystem.count({
        where: { orgId: session!.user.orgId! },
      });
      if (existing >= 1) {
        return NextResponse.json(
          { error: "Your plan allows auditing 1 AI system. Delete the existing system to register a new one." },
          { status: 403 }
        );
      }
    }

    const system = await db.aiSystem.create({
      data: {
        orgId: session!.user.orgId!,
        name,
        description,
        purpose: purpose || null,
        intendedUse: intendedUse || null,
        dataTypesProcessed: dataTypesProcessed || [],
        affectedPopulations: affectedPopulations || [],
        scaleOfDeployment: scaleOfDeployment || null,
        deploymentMemberStates: deploymentMemberStates || [],
        integrationDescription: integrationDescription || null,
        humanOversightLevel: humanOversightLevel || null,
        euDatabaseId: euDatabaseId || null,
        status: "draft",
      },
    });

    // If classify requested, trigger classification
    if (classify) {
      try {
        const baseUrl = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
        const classifyRes = await fetch(`${baseUrl}/api/classify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get("cookie") || "",
          },
          body: JSON.stringify({ systemId: system.id }),
        });

        if (classifyRes.ok) {
          const updated = await db.aiSystem.findUnique({ where: { id: system.id } });
          return NextResponse.json({ system: updated }, { status: 201 });
        }
      } catch {
        // Classification failed but system was saved — user can retry
      }
    }

    return NextResponse.json({ system }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
