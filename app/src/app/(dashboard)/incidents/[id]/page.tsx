import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { IncidentDetail } from "@/components/incident-detail";

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  major: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  minor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  reported: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  investigating: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const orgId = session!.user.orgId!;
  const { id } = await params;

  const incident = await db.incident.findFirst({
    where: { id, orgId },
    include: {
      aiSystem: { select: { name: true } },
      timeline: {
        include: { creator: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      creator: { select: { name: true, email: true } },
    },
  });

  if (!incident) notFound();

  const now = new Date();
  const deadline = new Date(incident.reportingDeadline);
  const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isOverdue = hoursLeft < 0;
  const isUrgent = hoursLeft > 0 && hoursLeft < 6;

  return (
    <div>
      <Link href="/incidents">
        <Button variant="ghost" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Incidents
        </Button>
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {incident.title}
            <Badge className={severityColors[incident.severity]}>
              {incident.severity}
            </Badge>
            <Badge className={statusColors[incident.status]}>
              {incident.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            {incident.aiSystem?.name || "No linked system"} —{" "}
            Reported by {incident.creator?.name || incident.creator?.email || "Unknown"} on{" "}
            {incident.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div
          className={`text-right px-4 py-2 rounded-lg ${
            isOverdue
              ? "bg-red-50 dark:bg-red-950"
              : isUrgent
                ? "bg-orange-50 dark:bg-orange-950"
                : "bg-muted"
          }`}
        >
          <p
            className={`text-lg font-bold ${
              isOverdue
                ? "text-red-700 dark:text-red-300"
                : isUrgent
                  ? "text-orange-700 dark:text-orange-300"
                  : ""
            }`}
          >
            {isOverdue
              ? "OVERDUE"
              : `${Math.floor(hoursLeft)}h ${Math.floor((hoursLeft % 1) * 60)}m`}
          </p>
          <p className="text-xs text-muted-foreground">
            Deadline: {deadline.toLocaleString()}
          </p>
        </div>
      </div>

      <IncidentDetail
        incident={{
          id: incident.id,
          title: incident.title,
          description: incident.description,
          severity: incident.severity,
          status: incident.status,
          incidentDate: incident.incidentDate.toISOString(),
          reportingDeadline: incident.reportingDeadline.toISOString(),
          reportedAt: incident.reportedAt?.toISOString() || null,
          memberState: incident.memberState,
          authorityName: incident.authorityName,
          authorityContact: incident.authorityContact,
          rootCause: incident.rootCause,
          remediationSteps: incident.remediationSteps,
          resolutionNotes: incident.resolutionNotes,
          aiSystemName: incident.aiSystem?.name || null,
        }}
        timeline={incident.timeline.map((t) => ({
          id: t.id,
          eventType: t.eventType,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
          creatorName: t.creator?.name || t.creator?.email || "System",
        }))}
      />
    </div>
  );
}
