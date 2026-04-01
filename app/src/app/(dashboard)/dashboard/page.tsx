import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Cpu,
  AlertTriangle,
  FileText,
  Clock,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ENFORCEMENT_DATE = new Date("2026-08-02T00:00:00Z");

function getDaysUntilEnforcement() {
  const now = new Date();
  const diff = ENFORCEMENT_DATE.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const riskColors: Record<string, string> = {
  unacceptable: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  limited: "bg-yellow-100 text-yellow-800",
  minimal: "bg-green-100 text-green-800",
  unclassified: "bg-gray-100 text-gray-800",
};

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

      {/* Risk tier breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Systems by Risk Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            {systems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No AI systems registered yet. Go to{" "}
                <a href="/systems" className="text-blue-600 hover:underline">
                  AI Systems
                </a>{" "}
                to register your first system.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(riskTierCounts).map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <Badge className={riskColors[tier] || riskColors.unclassified}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
