"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AiSystemSummary {
  id: string;
  name: string;
  riskTier: string;
}

interface OnboardingWizardProps {
  systems: AiSystemSummary[];
}

const STORAGE_KEY = "onboarding_dismissed";

export function OnboardingWizard({ systems }: OnboardingWizardProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setDismissed(stored === "1");
  }, []);

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  // Render nothing until we've read localStorage (avoids flash)
  if (dismissed === null || dismissed === true) return null;

  const hasSystem = systems.length > 0;
  const allClassified =
    systems.length > 0 &&
    systems.every((s) => s.riskTier !== "unclassified");
  const unclassifiedSystems = systems.filter((s) => s.riskTier === "unclassified");

  // Determine active step (0-indexed)
  let activeStep = 0;
  if (hasSystem && !allClassified) activeStep = 1;
  if (hasSystem && allClassified) activeStep = 2;

  const steps = [
    {
      number: 1,
      title: "Register your first AI system",
      done: hasSystem,
    },
    {
      number: 2,
      title: "Classify your system",
      done: allClassified && hasSystem,
    },
    {
      number: 3,
      title: "Generate compliance documents",
      done: false, // always a forward-looking step
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base text-blue-900 dark:text-blue-200">
              Get started with ActGuard
            </CardTitle>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
              Step {Math.min(activeStep + 1, 3)} of 3 — complete these steps to
              reach compliance readiness.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {completedCount}/3 complete
            </Badge>
            <button
              onClick={handleDismiss}
              aria-label="Skip wizard"
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Step 1 */}
        <StepCard
          step={steps[0]}
          active={activeStep === 0}
          description="Register the AI systems your organisation builds or deploys. Every system must be documented under the EU AI Act."
          action={
            hasSystem ? null : (
              <Link href="/systems/new">
                <Button size="sm">
                  Register AI System
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            )
          }
          extra={
            hasSystem ? (
              <p className="text-xs text-muted-foreground mt-1">
                {systems.length} system{systems.length !== 1 ? "s" : ""}{" "}
                registered.
              </p>
            ) : null
          }
        />

        {/* Step 2 */}
        <StepCard
          step={steps[1]}
          active={activeStep === 1}
          description="The EU AI Act defines four risk tiers: unacceptable, high-risk, limited risk, and minimal risk. Classification determines your compliance obligations."
          action={
            !hasSystem ? null : allClassified ? null : unclassifiedSystems.length > 0 ? (
              <Link href={`/systems/${unclassifiedSystems[0].id}`}>
                <Button size="sm">
                  Classify Now
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            ) : null
          }
          extra={
            hasSystem && !allClassified && unclassifiedSystems.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {unclassifiedSystems.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    <Link
                      href={`/systems/${s.id}`}
                      className="text-xs text-blue-700 dark:text-blue-300 hover:underline truncate"
                    >
                      {s.name}
                    </Link>
                    <Badge variant="outline" className="text-xs h-4 px-1">
                      unclassified
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null
          }
        />

        {/* Step 3 */}
        <StepCard
          step={steps[2]}
          active={activeStep === 2}
          description="High-risk AI systems require specific compliance documents — technical documentation, risk management plans, and more. Generate them from the Reports page."
          action={
            <Link href="/reports">
              <Button size="sm" variant={activeStep === 2 ? "default" : "outline"}>
                View Compliance Status
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          }
        />

        <div className="pt-1">
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Skip setup
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

interface StepCardProps {
  step: { number: number; title: string; done: boolean };
  active: boolean;
  description: string;
  action?: React.ReactNode;
  extra?: React.ReactNode;
}

function StepCard({ step, active, description, action, extra }: StepCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        step.done
          ? "bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-70"
          : active
          ? "bg-white dark:bg-gray-900 border-blue-300 dark:border-blue-700 shadow-sm"
          : "bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {step.done ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <div
              className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                active
                  ? "border-blue-500 text-blue-600"
                  : "border-gray-300 text-gray-400"
              )}
            >
              {step.number}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              step.done
                ? "text-muted-foreground line-through"
                : active
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            {step.title}
          </p>
          {(active || (!step.done && !active)) && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
          {extra}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}
