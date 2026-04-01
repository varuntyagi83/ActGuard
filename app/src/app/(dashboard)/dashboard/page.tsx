import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Cpu,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts } from "@/components/dashboard-charts";

const ENFORCEMENT_DATE = new Date("2026-08-02T00:00:00Z");

function getDaysUntilEnforcement() {
  const now = new Date();
  const diff = ENFORCEMENT_DATE.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}


export default async function DashboardPage() {
  const session = await auth();
  const orgId = session!.user.orgId!;

  const [systems, incidents, documents] = await Promise.all([
    db.aiSystem.findMany({ where: { orgId } }),
    db.incident.findMany({ where: { orgId } }),
    db.complianceDocument.findMany({
      where: { aiSystem: { orgId } },
    }),
  ]);

  const daysLeft = getDaysUntilEnforcement();
  const openIncidents = incidents.filter(
    (i) => !["resolved", "closed"].includes(i.status)
  );

  const riskTierCounts = systems.reduce(
    (acc, s) => {
      acc[s.riskTier] = (acc[s.riskTier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Count how many systems have at least one doc per type
  const docsBySystem = documents.reduce(
    (acc, d) => {
      const key = `${d.aiSystemId}:${d.docType}`;
      if (!acc.has(key)) {
        acc.set(key, true);
      }
      return acc;
    },
    new Map<string, boolean>()
  );
  const docTypeCounts: Record<string, number> = {};
  for (const key of docsBySystem.keys()) {
    const docType = key.split(":")[1];
    docTypeCounts[docType] = (docTypeCounts[docType] || 0) + 1;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          EU AI Act compliance overview for your organisation.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Systems
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{systems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systems.filter((s) => s.status === "compliant").length} compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {systems.length} systems
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Incidents
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{openIncidents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {incidents.length} total
            </p>
          </CardContent>
        </Card>

        <Card className={daysLeft < 90 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enforcement Deadline
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${daysLeft < 90 ? "text-red-700" : ""}`}>
              {daysLeft}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              days until Aug 2, 2026
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <DashboardCharts
        riskTierCounts={riskTierCounts}
        docTypeCounts={docTypeCounts}
        systemCount={systems.length}
      />

      {/* Recent Incidents */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No incidents reported yet.
              </p>
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 5).map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{incident.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {incident.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        incident.severity === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {incident.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
