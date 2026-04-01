"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Loader2, Check, History, ChevronDown } from "lucide-react";
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
  {
    type: "conformity_assessment",
    label: "Conformity Assessment",
    article: "Article 43",
    description: "Assessment of compliance with EU AI Act requirements, quality management review, conformity declaration.",
    tiers: ["high"],
  },
  {
    type: "transparency_info",
    label: "Transparency Information",
    article: "Article 13",
    description: "System capabilities, limitations, intended use, human oversight instructions, output interpretation guidance.",
    tiers: ["high", "limited"],
  },
  {
    type: "human_oversight_plan",
    label: "Human Oversight Plan",
    article: "Article 14",
    description: "Oversight framework, intervention procedures, competency requirements, decision review processes.",
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
  const [expandedType, setExpandedType] = useState<string | null>(null);

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

  function getDocsForType(docType: string): Doc[] {
    return documents
      .filter((d) => d.docType === docType)
      .sort((a, b) => b.version - a.version);
  }

  return (
    <div className="space-y-4">
      {DOC_TYPES.map((dt) => {
        const allVersions = getDocsForType(dt.type);
        const latest = allVersions[0];
        const olderVersions = allVersions.slice(1);
        const isGenerating = generating === dt.type;
        const isRecommended = dt.tiers.includes(riskTier) || riskTier === "unclassified";
        const isExpanded = expandedType === dt.type;

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
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    Version {latest.version} — Generated{" "}
                    {new Date(latest.generatedAt).toLocaleDateString()}
                  </p>
                  {olderVersions.length > 0 && (
                    <button
                      onClick={() =>
                        setExpandedType(isExpanded ? null : dt.type)
                      }
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <History className="h-3 w-3" />
                      {olderVersions.length} prior{" "}
                      {olderVersions.length === 1 ? "version" : "versions"}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
                {isExpanded && olderVersions.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    {olderVersions.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                      >
                        <p className="text-xs text-muted-foreground">
                          v{doc.version} — Generated{" "}
                          {new Date(doc.generatedAt).toLocaleDateString()}
                        </p>
                        <Link
                          href={`/systems/${systemId}/documents/${doc.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                          >
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
