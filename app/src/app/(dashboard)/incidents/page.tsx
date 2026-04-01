import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncidentAnalytics } from "@/components/incident-analytics";

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  major: "bg-orange-100 text-orange-800",
  minor: "bg-yellow-100 text-yellow-800",
};

export default async function IncidentsPage() {
  const session = await auth();
  const orgId = session!.user.orgId!;

  const incidents = await db.incident.findMany({
    where: { orgId },
    include: { aiSystem: { select: { name: true } } },
    orderBy: { reportingDeadline: "asc" },
  });

  // Analytics data
  const now = new Date();
  const severityCounts = incidents.reduce((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCounts = incidents.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reportedIncidents = incidents.filter((i) => i.reportedAt);
  const avgResponseHours =
    reportedIncidents.length > 0
      ? reportedIncidents.reduce((sum, i) => {
          const responseTime =
            (new Date(i.reportedAt!).getTime() - new Date(i.incidentDate).getTime()) /
            (1000 * 60 * 60);
          return sum + responseTime;
        }, 0) / reportedIncidents.length
      : null;

  const overdueCount = incidents.filter(
    (i) =>
      !["resolved", "closed"].includes(i.status) &&
      new Date(i.reportingDeadline) < now
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600 mt-1">
            Track and report AI incidents per Article 72 requirements.
          </p>
        </div>
        <Link href="/incidents/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Report Incident
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Incidents ({incidents.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <IncidentAnalytics
            severityCounts={severityCounts}
            statusCounts={statusCounts}
            avgResponseHours={avgResponseHours}
            overdueCount={overdueCount}
            totalCount={incidents.length}
          />
        </TabsContent>

        <TabsContent value="list">
      {incidents.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-950 rounded-xl border">
          <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No incidents reported
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            When an AI system incident occurs, report it here to track the
            24-hour reporting deadline and manage remediation.
          </p>
          <Link href="/incidents/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Report an incident
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-950 rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>AI System</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => {
                const now = new Date();
                const deadline = new Date(incident.reportingDeadline);
                const hoursLeft =
                  (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
                const isOverdue = hoursLeft < 0;
                const isUrgent = hoursLeft > 0 && hoursLeft < 6;

                return (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {incident.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {incident.aiSystem?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={severityColors[incident.severity]}>
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {incident.status}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-medium ${
                          isOverdue
                            ? "text-red-700"
                            : isUrgent
                              ? "text-orange-700"
                              : "text-gray-600"
                        }`}
                      >
                        {isOverdue
                          ? "OVERDUE"
                          : `${Math.floor(hoursLeft)}h remaining`}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
