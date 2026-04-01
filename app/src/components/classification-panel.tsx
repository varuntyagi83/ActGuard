"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, Edit, RotateCcw, ArrowRight, AlertTriangle, ShieldCheck, Info, Ban } from "lucide-react";
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
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
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

      {/* Next Steps based on risk tier */}
      <NextStepsCard tier={classification.tier} />

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

const NEXT_STEPS: Record<
  string,
  {
    icon: typeof Ban;
    color: string;
    bg: string;
    title: string;
    summary: string;
    steps: { label: string; detail: string }[];
  }
> = {
  unacceptable: {
    icon: Ban,
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    title: "This AI system is prohibited under the EU AI Act",
    summary:
      "Systems classified as unacceptable risk under Article 5 cannot be placed on the market or put into service in the EU. Fines for violations can reach EUR 35 million or 7% of global annual turnover.",
    steps: [
      { label: "Cease deployment", detail: "Immediately stop deploying this system in the EU market." },
      { label: "Assess alternatives", detail: "Determine if the system can be redesigned to fall outside prohibited categories." },
      { label: "Seek legal counsel", detail: "Consult with EU AI Act legal specialists to confirm classification and explore exemptions (e.g., law enforcement exceptions under Article 5(1)(d))." },
      { label: "Document decision", detail: "Record your compliance decision and reasoning for audit purposes." },
    ],
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
    title: "High-risk: Full compliance required before August 2, 2026",
    summary:
      "High-risk AI systems must meet all requirements in Chapter III, Section 2 (Articles 8-15) before they can be placed on the EU market. This includes technical documentation, risk management, data governance, and conformity assessment.",
    steps: [
      { label: "Generate technical documentation", detail: "Create Article 11 technical documentation covering system design, development process, and performance metrics." },
      { label: "Establish risk management system", detail: "Implement an Article 9 continuous risk management process covering identification, evaluation, mitigation, and monitoring." },
      { label: "Complete data governance record", detail: "Document Article 10 data governance practices: collection methods, bias detection, representativeness assessment." },
      { label: "Implement human oversight", detail: "Ensure Article 14 human oversight measures: ability to understand, monitor, intervene, and override the AI system." },
      { label: "Conduct conformity assessment", detail: "Complete Article 43 conformity assessment (internal control for most Annex III systems) and prepare EU declaration of conformity." },
      { label: "Register in EU database", detail: "Register the system in the Article 71 EU database before placing it on the market." },
      { label: "Set up post-market monitoring", detail: "Establish Article 72 post-market monitoring and Article 73 serious incident reporting procedures." },
    ],
  },
  limited: {
    icon: Info,
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
    title: "Limited risk: Transparency obligations apply",
    summary:
      "Limited risk systems must comply with Article 50 transparency requirements. Users must be informed they are interacting with an AI system, and AI-generated content must be properly labelled.",
    steps: [
      { label: "Disclose AI interaction", detail: "Ensure users are clearly informed when they are interacting with an AI system (e.g., chatbot disclosure)." },
      { label: "Label AI-generated content", detail: "Mark synthetic audio, image, video, or text content as AI-generated in a machine-readable format." },
      { label: "Deep fake disclosure", detail: "If generating/manipulating media, disclose that content has been artificially generated or manipulated." },
      { label: "Emotion recognition notice", detail: "If using emotion recognition or biometric categorisation, inform exposed individuals of the system's operation." },
      { label: "Consider voluntary compliance", detail: "While not mandatory, consider adopting high-risk requirements (Article 95 codes of conduct) to build trust and prepare for potential reclassification." },
    ],
  },
  minimal: {
    icon: ShieldCheck,
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    title: "Minimal risk: No mandatory requirements",
    summary:
      "Minimal risk AI systems have no mandatory compliance requirements under the EU AI Act. However, voluntary measures are encouraged under Article 95, and you should still be aware of your obligations under other regulations (GDPR, sector-specific rules).",
    steps: [
      { label: "Adopt voluntary codes of conduct", detail: "Consider implementing Article 95 voluntary codes of conduct to demonstrate responsible AI practices to users and investors." },
      { label: "Ensure GDPR compliance", detail: "If processing personal data, ensure compliance with GDPR (data protection impact assessment, lawful basis, data subject rights)." },
      { label: "Monitor for reclassification", detail: "Track updates to Annex III — the Commission can amend the high-risk list. Your system may be reclassified in the future." },
      { label: "Implement AI literacy", detail: "Per Article 4, ensure staff have sufficient AI literacy to understand the system's capabilities and limitations." },
      { label: "Document for due diligence", detail: "Even without mandatory requirements, maintaining documentation demonstrates responsible AI governance for investors, partners, and clients." },
    ],
  },
};

function NextStepsCard({ tier }: { tier: string }) {
  const config = NEXT_STEPS[tier];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Card className={`${config.bg}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <div>
            <CardTitle className="text-base">{config.title}</CardTitle>
            <CardDescription className="mt-1">{config.summary}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="text-sm font-semibold mb-3">Recommended next steps</h4>
        <div className="space-y-3">
          {config.steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shrink-0 ${config.color} bg-white dark:bg-gray-900 border`}>
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-medium">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
