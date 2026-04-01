import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      classify,
    } = body;

    if (!name || !description || description.length < 100) {
      return NextResponse.json(
        { error: "Name and description (min 100 chars) are required" },
        { status: 400 }
      );
    }

    const system = await db.aiSystem.create({
      data: {
        orgId: session.user.orgId,
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
