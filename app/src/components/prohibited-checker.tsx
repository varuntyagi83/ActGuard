"use client";

import { useState } from "react";
import { Ban, AlertTriangle, CheckCircle, HelpCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AiSystem {
  id: string;
  name: string;
  description: string;
}

interface CheckResult {
  practiceId: number;
  practice: string;
  verdict: "prohibited" | "unclear" | "compliant";
  explanation: string;
}

interface ProhibitedCheckerProps {
  systems: AiSystem[];
}

const VERDICT_CONFIG = {
  prohibited: {
    label: "Likely Prohibited",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertTriangle,
    iconClass: "text-red-500",
    cardClass: "border-red-200 dark:border-red-900",
    headerClass: "bg-red-50 dark:bg-red-950/20",
  },
  unclear: {
    label: "Unclear — Needs Review",
    badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: HelpCircle,
    iconClass: "text-yellow-500",
    cardClass: "border-yellow-200 dark:border-yellow-900",
    headerClass: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  compliant: {
    label: "Likely Compliant",
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
    iconClass: "text-green-500",
    cardClass: "border-green-200 dark:border-green-900",
    headerClass: "bg-green-50 dark:bg-green-950/20",
  },
};

export function ProhibitedChecker({ systems }: ProhibitedCheckerProps) {
  const [description, setDescription] = useState("");
  const [selectedSystemId, setSelectedSystemId] = useState("");
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSystemSelect(id: string) {
    setSelectedSystemId(id);
    if (id) {
      const system = systems.find((s) => s.id === id);
      if (system) setDescription(system.description);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResults(null);
    setLoading(true);

    try {
      const res = await fetch("/api/prohibited-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResults(data.results);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const prohibitedCount = results?.filter((r) => r.verdict === "prohibited").length ?? 0;
  const unclearCount = results?.filter((r) => r.verdict === "unclear").length ?? 0;
  const compliantCount = results?.filter((r) => r.verdict === "compliant").length ?? 0;

  return (
    <div className="space-y-8">
      {/* Input form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe Your AI System</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {systems.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="system-select">
                  Pre-fill from existing system{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <select
                  id="system-select"
                  value={selectedSystemId}
                  onChange={(e) => handleSystemSelect(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">— Select an AI system —</option>
                  {systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="description">System Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what your AI system does, how it works, who it affects, and in what context it is deployed. The more detail you provide, the more accurate the assessment."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                Include the system purpose, data inputs, affected populations, and deployment context.
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || description.trim().length < 10}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" />
                  Check Against Article 5
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className={prohibitedCount > 0 ? "border-red-200 dark:border-red-900" : ""}>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${prohibitedCount > 0 ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}>
                  {prohibitedCount}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Likely Prohibited</p>
              </CardContent>
            </Card>
            <Card className={unclearCount > 0 ? "border-yellow-200 dark:border-yellow-900" : ""}>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${unclearCount > 0 ? "text-yellow-700 dark:text-yellow-400" : "text-gray-700 dark:text-gray-300"}`}>
                  {unclearCount}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Needs Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">{compliantCount}</div>
                <p className="text-sm text-muted-foreground mt-1">Likely Compliant</p>
              </CardContent>
            </Card>
          </div>

          {/* Per-practice cards */}
          <div className="space-y-3">
            {results.map((result) => {
              const config = VERDICT_CONFIG[result.verdict];
              const Icon = config.icon;

              return (
                <Card key={result.practiceId} className={config.cardClass}>
                  <CardHeader className={`pb-2 rounded-t-xl ${config.headerClass}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${config.iconClass}`} />
                        <CardTitle className="text-sm font-semibold">
                          Article 5({result.practiceId}) — {result.practice}
                        </CardTitle>
                      </div>
                      <Badge className={`${config.badgeClass} shrink-0 text-xs font-medium`}>
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {result.explanation}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {(prohibitedCount > 0 || unclearCount > 0) && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
              <strong>Disclaimer:</strong> This tool provides an automated preliminary assessment only and does not constitute legal advice. Consult a qualified EU AI Act compliance professional before making compliance decisions.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
