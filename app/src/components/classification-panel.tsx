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
    steps: { label: string; articles: string[]; detail: string }[];
  }
> = {
  unacceptable: {
    icon: Ban,
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    title: "This AI system is prohibited under the EU AI Act",
    summary:
      "Systems classified as unacceptable risk under Article 5 cannot be placed on the market or put into service in the EU. Fines for violations can reach EUR 35 million or 7% of global annual turnover (Article 99).",
    steps: [
      { label: "Cease deployment", articles: ["Article 5"], detail: "Immediately stop deploying this system in the EU market. Article 5 explicitly prohibits this category of AI practice." },
      { label: "Assess alternatives", articles: ["Article 6", "Annex III"], detail: "Determine if the system can be redesigned to fall outside prohibited categories and into a lower risk tier under Article 6." },
      { label: "Seek legal counsel", articles: ["Article 5(1)(d)", "Article 99"], detail: "Consult with EU AI Act legal specialists to confirm classification and explore narrow exemptions (e.g., law enforcement exceptions). Penalties under Article 99 reach EUR 35M." },
      { label: "Document decision", articles: ["Article 11", "Article 18"], detail: "Record your compliance decision and reasoning per Article 18 documentation keeping requirements for audit purposes." },
    ],
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
    title: "High-risk: Full compliance required before August 2, 2026",
    summary:
      "High-risk AI systems must meet all requirements in Chapter III, Section 2 (Articles 8-15) before placement on the EU market. This includes technical documentation, risk management, data governance, and conformity assessment.",
    steps: [
      { label: "Generate technical documentation", articles: ["Article 11", "Annex IV"], detail: "Create technical documentation covering system design, development process, performance metrics, and risk management per Article 11 and the template in Annex IV." },
      { label: "Establish risk management system", articles: ["Article 9"], detail: "Implement a continuous, iterative risk management process per Article 9: identification, estimation, evaluation, mitigation measures, and residual risk assessment." },
      { label: "Complete data governance record", articles: ["Article 10"], detail: "Document data governance practices per Article 10: collection methods, preprocessing, bias detection, representativeness assessment, and data quality measures." },
      { label: "Implement human oversight", articles: ["Article 14"], detail: "Ensure human oversight measures per Article 14: ability to understand, monitor, correctly interpret outputs, intervene, and override the AI system." },
      { label: "Ensure transparency", articles: ["Article 13"], detail: "Provide instructions for use per Article 13: system capabilities, limitations, accuracy metrics, intended purpose, and maintenance requirements." },
      { label: "Conduct conformity assessment", articles: ["Article 43", "Annex VI"], detail: "Complete conformity assessment per Article 43 (internal control procedure in Annex VI for most Annex III systems) and draw up EU declaration of conformity." },
      { label: "Register in EU database", articles: ["Article 49", "Article 71"], detail: "Register the system in the EU database per Article 71 with the information required by Article 49 before placing it on the market." },
      { label: "Set up incident reporting", articles: ["Article 72", "Article 73"], detail: "Establish post-market monitoring per Article 72 and serious incident reporting procedures per Article 73 (report within 15 days of awareness)." },
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
      { label: "Disclose AI interaction", articles: ["Article 50(1)"], detail: "Per Article 50(1), ensure users are clearly informed when they are interacting with an AI system, unless obvious from context." },
      { label: "Label AI-generated content", articles: ["Article 50(2)"], detail: "Per Article 50(2), mark synthetic audio, image, video, or text content as AI-generated in a machine-readable format." },
      { label: "Deep fake disclosure", articles: ["Article 50(4)"], detail: "Per Article 50(4), if generating or manipulating media, disclose that content has been artificially generated or manipulated." },
      { label: "Emotion recognition notice", articles: ["Article 50(3)"], detail: "Per Article 50(3), if using emotion recognition or biometric categorisation, inform exposed individuals of the system's operation." },
      { label: "Consider voluntary compliance", articles: ["Article 95", "Article 69"], detail: "While not mandatory, consider adopting high-risk requirements via Article 95 codes of conduct to build trust and prepare for potential reclassification under Article 7." },
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
      { label: "Adopt voluntary codes of conduct", articles: ["Article 95"], detail: "Consider implementing Article 95 voluntary codes of conduct to demonstrate responsible AI practices to users, investors, and regulators." },
      { label: "Implement AI literacy", articles: ["Article 4"], detail: "Per Article 4, ensure staff deploying or operating the AI system have sufficient AI literacy to understand its capabilities and limitations." },
      { label: "Ensure GDPR compliance", articles: ["GDPR Art. 22", "GDPR Art. 35"], detail: "If processing personal data, ensure GDPR compliance including automated decision-making safeguards (GDPR Art. 22) and data protection impact assessments (GDPR Art. 35)." },
      { label: "Monitor for reclassification", articles: ["Article 7", "Annex III"], detail: "Per Article 7, the Commission can amend Annex III to add new high-risk categories. Track updates — your system may be reclassified in the future." },
      { label: "Document for due diligence", articles: ["Article 95", "Article 96"], detail: "Per Article 96 Commission guidelines, maintaining documentation demonstrates responsible AI governance for investors, partners, and regulatory inquiries." },
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
        <div className="space-y-4">
          {config.steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shrink-0 ${config.color} bg-white dark:bg-gray-900 border`}>
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-medium">{step.label}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {step.articles.map((article) => (
                    <span
                      key={article}
                      className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/60 dark:bg-gray-800/60 border text-blue-700 dark:text-blue-400"
                    >
                      {article}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
