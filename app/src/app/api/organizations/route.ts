import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug } = await req.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const existing = await db.organization.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "This slug is already taken" },
        { status: 409 }
      );
    }

    const org = await db.organization.create({
      data: { name, slug },
    });

    // Link user to org as admin
    await db.user.update({
      where: { id: session.user.id },
      data: { orgId: org.id, role: "admin" },
    });

    return NextResponse.json({ org }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
