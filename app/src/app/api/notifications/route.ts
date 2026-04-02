import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Returns urgent/overdue incidents as in-app notifications
export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ notifications: [] });
  }

  const now = new Date();
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const incidents = await db.incident.findMany({
    where: {
      orgId: session.user.orgId,
      status: { in: ["draft", "reported", "investigating"] },
      reportingDeadline: { lte: in72h },
    },
    select: {
      id: true,
      title: true,
      reportingDeadline: true,
      severity: true,
    },
    orderBy: { reportingDeadline: "asc" },
    take: 10,
  });

  const notifications = incidents.map((incident) => {
    const hoursLeft =
      (new Date(incident.reportingDeadline).getTime() - now.getTime()) /
      (1000 * 60 * 60);
    const isOverdue = hoursLeft < 0;
    const isUrgent = hoursLeft >= 0 && hoursLeft < 24;

    return {
      id: incident.id,
      title: incident.title,
      hoursLeft,
      isOverdue,
      isUrgent,
      severity: incident.severity,
      href: `/incidents/${incident.id}`,
    };
  });

  return NextResponse.json({ notifications });
}
