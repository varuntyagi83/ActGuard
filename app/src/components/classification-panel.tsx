"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, Edit, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const riskColors: Record<string, string> = {
  unacceptable: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  limited: "bg-yellow-400 text-yellow-900",
  minimal: "bg-green-500 text-white",
};

const RISK_TIERS = ["unacceptable", "high", "limited", "minimal"] as const;

interface Classification {
  tier: string;
  confidence: number;
  reasoning: string;
  relevant_articles: string[];
  key_risk_factors: string[];
  annex_iii_category: string | null;
  obligations_summary: string[];
}

interface Props {
  systemId: string;
  currentTier: string;
  classification: Classification | null;
  status: string;
}

export function ClassificationPanel({
  systemId,
  currentTier,
  classification,
  status,
}: Props) {
  const router = useRouter();
  const [classifying, setClassifying] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [overrideTier, setOverrideTier] = useState(currentTier);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [error, setError] = useState("");

  async function handleClassify() {
    setClassifying(true);
    setError("");

    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Classification failed");
    }

    setClassifying(false);
    router.refresh();
  }

  async function handleAccept() {
    await fetch(`/api/systems/${systemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "classified" }),
    });
    router.refresh();
  }

  async function handleOverride() {
    if (!overrideJustification.trim()) {
      setError("Please provide a justification for the override");
      return;
    }

    await fetch(`/api/systems/${systemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        riskTier: overrideTier,
        classificationReasoning: JSON.stringify({
          ...classification,
          tier: overrideTier,
          override: true,
          override_justification: overrideJustification,
          original_tier: classification?.tier,
        }),
        status: "classified",
      }),
    });

    setOverriding(false);
    router.refresh();
  }

  // Not yet classified
  if (!classification) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Classification</CardTitle>
          <CardDescription>
            Run AI-powered classification against EU AI Act Article 6 and Annex
            III criteria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-md p-3 mb-4">
              {error}
            </div>
          )}
          <Button
            onClick={handleClassify}
            disabled={classifying}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {classifying ? "Classifying with GPT-4o..." : "Classify this system"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Classification results
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md p-3">
          {error}
        </div>
      )}

      {/* Risk tier result */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Risk Classification Result</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClassify}
                disabled={classifying}
                className="gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                {classifying ? "Re-classifying..." : "Re-classify"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tier badge */}
          <div className="flex items-center gap-4">
            <div
              className={`px-6 py-3 rounded-lg text-lg font-bold ${
                riskColors[classification.tier] || "bg-gray-300"
              }`}
            >
              {classification.tier.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Confidence: {Math.round(classification.confidence * 100)}%
              </p>
              <Progress
                value={classification.confidence * 100}
                className="h-2"
              />
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <h3 className="text-sm font-medium mb-2">Reasoning</h3>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
              {classification.reasoning}
            </p>
          </div>

          {/* Articles */}
          <div>
            <h3 className="text-sm font-medium mb-2">Relevant articles</h3>
            <div className="flex flex-wrap gap-2">
              {classification.relevant_articles.map((article) => (
                <Badge key={article} variant="outline">
                  {article}
                </Badge>
              ))}
            </div>
          </div>

          {/* Risk factors */}
          <div>
            <h3 className="text-sm font-medium mb-2">Key risk factors</h3>
            <div className="flex flex-wrap gap-2">
              {classification.key_risk_factors.map((factor) => (
                <Badge key={factor} variant="secondary">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>

          {classification.annex_iii_category && (
            <div>
              <h3 className="text-sm font-medium mb-1">Annex III category</h3>
              <p className="text-sm">{classification.annex_iii_category}</p>
            </div>
          )}

          {/* Obligations */}
          <div>
            <h3 className="text-sm font-medium mb-2">Obligations</h3>
            <ul className="space-y-1">
              {classification.obligations_summary.map((obligation, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  {obligation}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          {status !== "classified" && (
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleAccept} className="gap-2">
                <Check className="h-4 w-4" />
                Accept classification
              </Button>
              <Button
                variant="outline"
                onClick={() => setOverriding(!overriding)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Override
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Override panel */}
      {overriding && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-base">Override Classification</CardTitle>
            <CardDescription>
              You may override the AI classification. A justification is required
              for audit purposes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>New risk tier</Label>
              <Select value={overrideTier} onValueChange={(v) => setOverrideTier(v || overrideTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Justification *</Label>
              <Textarea
                placeholder="Explain why you are overriding the AI classification..."
                rows={4}
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleOverride} className="gap-2">
                <Check className="h-4 w-4" />
                Confirm override
              </Button>
              <Button variant="ghost" onClick={() => setOverriding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
