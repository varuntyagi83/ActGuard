import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DOC_TYPES = [
  { type: "technical_doc", label: "Technical Documentation", article: "Art. 11" },
  { type: "risk_management_plan", label: "Risk Management Plan", article: "Art. 9" },
  { type: "data_governance", label: "Data Governance Record", article: "Art. 10" },
  { type: "conformity_assessment", label: "Conformity Assessment", article: "Art. 43" },
  { type: "transparency_info", label: "Transparency Information", article: "Art. 13" },
  { type: "human_oversight_plan", label: "Human Oversight Plan", article: "Art. 14" },
];

const REQUIRED_DOCS: Record<string, string[]> = {
  high: ["technical_doc", "risk_management_plan", "data_governance", "conformity_assessment", "transparency_info", "human_oversight_plan"],
  limited: ["transparency_info"],
  minimal: [],
  unclassified: [],
  unacceptable: [],
};

const riskColors: Record<string, string> = {
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  limited: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  minimal: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  unclassified: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  unacceptable: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/sign-in");

  const systems = await db.aiSystem.findMany({
    where: { orgId: session.user.orgId },
    include: {
      complianceDocuments: {
        select: { docType: true, version: true },
        orderBy: { version: "desc" },
      },
      checklists: {
        select: { completionPercentage: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Compliance Reports</h1>
        <p className="text-muted-foreground mt-1">
          Compliance status overview for all AI systems in your organisation.
        </p>
      </div>

      {systems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No AI systems yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Register your first AI system to start generating compliance reports.
            </p>
            <Link href="/systems/new">
              <Button>Register AI System</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {systems.map((system) => {
            const required = REQUIRED_DOCS[system.riskTier] || [];
            const generatedTypes = new Set(
              system.complianceDocuments.map((d) => d.docType)
            );
            const completedDocs = required.filter((t) =>
              generatedTypes.has(t)
            ).length;
            const docPercentage =
              required.length > 0
                ? Math.round((completedDocs / required.length) * 100)
                : 100;
            const checklistPct = system.checklists[0]?.completionPercentage ?? 0;
            const overallPct = Math.round((docPercentage + checklistPct) / 2);

            return (
              <Card key={system.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {system.name}
                        <Badge
                          className={
                            riskColors[system.riskTier] ||
                            riskColors.unclassified
                          }
                        >
                          {system.riskTier.charAt(0).toUpperCase() +
                            system.riskTier.slice(1)}
                        </Badge>
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold">{overallPct}%</span>
                      <p className="text-xs text-muted-foreground">
                        overall compliance
                      </p>
                    </div>
                  </div>
                  <Progress value={overallPct} className="mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Documents status */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Documents ({completedDocs}/{required.length})
                      </p>
                      <div className="space-y-1.5">
                        {required.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No mandatory documents for this risk tier.
                          </p>
                        ) : (
                          DOC_TYPES.filter((dt) =>
                            required.includes(dt.type)
                          ).map((dt) => {
                            const hasDoc = generatedTypes.has(dt.type);
                            return (
                              <div
                                key={dt.type}
                                className="flex items-center gap-2 text-sm"
                              >
                                {hasDoc ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                )}
                                <span
                                  className={
                                    hasDoc
                                      ? "text-muted-foreground"
                                      : "font-medium"
                                  }
                                >
                                  {dt.label}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] ml-auto"
                                >
                                  {dt.article}
                                </Badge>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Checklist + Actions */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Checklist Progress
                      </p>
                      <div className="flex items-center gap-3 mb-4">
                        <Progress
                          value={checklistPct}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {Math.round(checklistPct)}%
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/systems/${system.id}/documents`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <FileText className="h-3 w-3" />
                            Documents
                          </Button>
                        </Link>
                        <Link href={`/systems/${system.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
