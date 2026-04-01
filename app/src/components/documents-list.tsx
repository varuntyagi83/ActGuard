"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const DOC_TYPES = [
  {
    type: "technical_doc",
    label: "Technical Documentation",
    article: "Article 11",
    description: "System description, design specs, development process, performance metrics, risk management measures.",
    tiers: ["high"],
  },
  {
    type: "risk_management_plan",
    label: "Risk Management Plan",
    article: "Article 9",
    description: "Risk identification, estimation, evaluation, mitigation measures, residual risks, testing procedures.",
    tiers: ["high"],
  },
  {
    type: "data_governance",
    label: "Data Governance Record",
    article: "Article 10",
    description: "Data collection, preprocessing, bias detection, representativeness, data quality measures.",
    tiers: ["high"],
  },
];

interface Doc {
  id: string;
  docType: string;
  version: number;
  generatedAt: string;
}

interface Props {
  systemId: string;
  systemName: string;
  riskTier: string;
  documents: Doc[];
}

export function DocumentsList({ systemId, systemName, riskTier, documents }: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState<string | null>(null);

  async function handleGenerate(docType: string) {
    setGenerating(docType);

    const res = await fetch("/api/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, docType }),
    });

    if (res.ok) {
      router.refresh();
    }

    setGenerating(null);
  }

  function getLatestDoc(docType: string): Doc | undefined {
    return documents.find((d) => d.docType === docType);
  }

  return (
    <div className="space-y-4">
      {DOC_TYPES.map((dt) => {
        const latest = getLatestDoc(dt.type);
        const isGenerating = generating === dt.type;
        const isRecommended = dt.tiers.includes(riskTier) || riskTier === "unclassified";

        return (
          <Card key={dt.type}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {dt.label}
                      <Badge variant="outline" className="text-[10px]">
                        {dt.article}
                      </Badge>
                      {isRecommended && (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-[10px]">
                          Required
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {dt.description}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {latest && (
                    <Link href={`/systems/${systemId}/documents/${latest.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Check className="h-3 w-3" />
                        View (v{latest.version})
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(dt.type)}
                    disabled={isGenerating || generating !== null}
                    className="gap-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        {latest ? "Regenerate" : "Generate"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {latest && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Version {latest.version} — Generated{" "}
                  {new Date(latest.generatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
