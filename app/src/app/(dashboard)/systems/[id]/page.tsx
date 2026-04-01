import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ClassificationPanel } from "@/components/classification-panel";
import { SystemDetailWithRag } from "@/components/system-detail-with-rag";

const riskColors: Record<string, string> = {
  unacceptable: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  limited: "bg-yellow-400 text-yellow-900",
  minimal: "bg-green-500 text-white",
  unclassified: "bg-gray-300 text-gray-800",
};

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const orgId = session!.user.orgId!;
  const { id } = await params;

  const system = await db.aiSystem.findFirst({
    where: { id, orgId },
    include: {
      complianceDocuments: true,
      checklists: true,
    },
  });

  if (!system) notFound();

  const classification = system.classificationReasoning
    ? JSON.parse(system.classificationReasoning)
    : null;

  // Build auto-query from system context
  const ragAutoQuery = [
    system.riskTier !== "unclassified" ? `${system.riskTier} risk AI systems` : "",
    system.dataTypesProcessed.includes("Biometric") ? "biometric data" : "",
    system.dataTypesProcessed.includes("Health") ? "health data AI" : "",
    system.affectedPopulations.includes("Job applicants") ? "employment AI systems" : "",
    system.affectedPopulations.includes("Students") ? "education AI systems" : "",
    "EU AI Act compliance requirements",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SystemDetailWithRag autoQuery={ragAutoQuery}>
      <Link href="/systems">
        <Button variant="ghost" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to AI Systems
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{system.name}</h1>
            <Badge className={riskColors[system.riskTier]}>
              {system.riskTier.charAt(0).toUpperCase() + system.riskTier.slice(1)}
            </Badge>
          </div>
          <p className="text-gray-600 max-w-2xl">{system.description}</p>
        </div>
      </div>

      <Tabs defaultValue="classification" className="space-y-6">
        <TabsList>
          <TabsTrigger value="classification">Classification</TabsTrigger>
          <TabsTrigger value="details">System Details</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({system.complianceDocuments.length})
          </TabsTrigger>
        </TabsList>

        {/* Classification Tab */}
        <TabsContent value="classification">
          <ClassificationPanel
            systemId={system.id}
            currentTier={system.riskTier}
            classification={classification}
            status={system.status}
          />
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {system.purpose && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                    <p className="text-sm">{system.purpose}</p>
                  </div>
                )}
                {system.intendedUse && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Intended use</p>
                    <p className="text-sm">{system.intendedUse}</p>
                  </div>
                )}
                {system.scaleOfDeployment && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scale</p>
                    <p className="text-sm">{system.scaleOfDeployment}</p>
                  </div>
                )}
                {system.humanOversightLevel && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Human oversight</p>
                    <p className="text-sm capitalize">
                      {system.humanOversightLevel.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data & Deployment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Data types</p>
                  <div className="flex flex-wrap gap-1">
                    {system.dataTypesProcessed.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Affected populations</p>
                  <div className="flex flex-wrap gap-1">
                    {system.affectedPopulations.map((p) => (
                      <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Deployment states</p>
                  <div className="flex flex-wrap gap-1">
                    {system.deploymentMemberStates.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
                {system.integrationDescription && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Integration</p>
                    <p className="text-sm">{system.integrationDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {system.complianceDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">
                    No documents generated yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {system.status === "classified"
                      ? "Document generation will be available in Phase 2."
                      : "Classify this system first to begin generating compliance documents."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {system.complianceDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border rounded-lg p-4"
                    >
                      <div>
                        <p className="font-medium capitalize">
                          {doc.docType.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Version {doc.version} — {doc.generatedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">v{doc.version}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SystemDetailWithRag>
  );
}
