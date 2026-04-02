export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DocumentsList } from "@/components/documents-list";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const orgId = session!.user.orgId!;
  const { id } = await params;

  const system = await db.aiSystem.findFirst({
    where: { id, orgId },
    include: { complianceDocuments: { orderBy: { generatedAt: "desc" } } },
  });

  if (!system) notFound();

  return (
    <div>
      <Link href={`/systems/${id}`}>
        <Button variant="ghost" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to {system.name}
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Compliance Documents</h1>
        <p className="text-muted-foreground mt-1">
          Generate and manage compliance documentation for {system.name}.
        </p>
      </div>

      <DocumentsList
        systemId={system.id}
        systemName={system.name}
        riskTier={system.riskTier}
        documents={system.complianceDocuments.map((d) => ({
          id: d.id,
          docType: d.docType,
          version: d.version,
          generatedAt: d.generatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
