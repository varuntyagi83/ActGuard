"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const DATA_TYPES = [
  "Personal data",
  "Biometric",
  "Health",
  "Financial",
  "Criminal",
  "Children's data",
  "Location",
  "Behavioural",
  "None",
];

const AFFECTED_POPULATIONS = [
  "Employees",
  "Consumers",
  "Patients",
  "Students",
  "Job applicants",
  "General public",
  "Vulnerable groups",
];

const EU_MEMBER_STATES = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
];

const OVERSIGHT_LEVELS = [
  { value: "full_automation", label: "Full automation (no human involvement)" },
  { value: "human_in_the_loop", label: "Human-in-the-loop (human approves each decision)" },
  { value: "human_on_the_loop", label: "Human-on-the-loop (human monitors and can intervene)" },
  { value: "human_in_command", label: "Human-in-command (human has full override authority)" },
];

const STEPS = ["Basic Info", "Data & Users", "Deployment", "Review"];

interface FormData {
  name: string;
  description: string;
  purpose: string;
  intendedUse: string;
  dataTypesProcessed: string[];
  affectedPopulations: string[];
  scaleOfDeployment: string;
  deploymentMemberStates: string[];
  integrationDescription: string;
  humanOversightLevel: string;
  euDatabaseId: string;
}

export default function NewSystemPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    purpose: "",
    intendedUse: "",
    dataTypesProcessed: [],
    affectedPopulations: [],
    scaleOfDeployment: "",
    deploymentMemberStates: [],
    integrationDescription: "",
    humanOversightLevel: "",
    euDatabaseId: "",
  });

  function toggleArrayItem(field: "dataTypesProcessed" | "affectedPopulations" | "deploymentMemberStates", item: string) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  }

  function canProceed(): boolean {
    if (step === 0) {
      return form.name.trim().length > 0 && form.description.trim().length >= 100;
    }
    if (step === 1) {
      return form.dataTypesProcessed.length > 0 && form.affectedPopulations.length > 0;
    }
    if (step === 2) {
      return form.deploymentMemberStates.length > 0 && form.humanOversightLevel.length > 0;
    }
    return true;
  }

  async function handleSave(classify: boolean) {
    setError("");
    setLoading(true);

    const res = await fetch("/api/systems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, classify }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save system");
      setLoading(false);
      return;
    }

    const { system } = await res.json();
    router.push(`/systems/${system.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="gap-2 mb-4"
          onClick={() => router.push("/systems")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Systems
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          Register AI System
        </h1>
        <p className="text-gray-600 mt-1">
          Provide details about your AI system to begin the compliance process.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => i < step && setStep(i)}
              className={`text-sm font-medium ${
                i === step
                  ? "text-blue-600"
                  : i < step
                    ? "text-gray-900 cursor-pointer hover:text-blue-600"
                    : "text-gray-400"
              }`}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Describe your AI system and its purpose.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">System name *</Label>
              <Input
                id="name"
                placeholder="e.g. Customer Support Chatbot"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                Description * <span className="text-muted-foreground font-normal">(min 100 characters)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what this AI system does, how it works, and what decisions it makes or supports..."
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {form.description.length}/100 characters
                {form.description.length >= 100 && " — sufficient"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="What problem does this system solve?"
                rows={3}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intendedUse">Intended use</Label>
              <Textarea
                id="intendedUse"
                placeholder="How is this system intended to be used? By whom?"
                rows={3}
                value={form.intendedUse}
                onChange={(e) =>
                  setForm({ ...form, intendedUse: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="euDatabaseId">EU Database Registration ID</Label>
              <Input
                id="euDatabaseId"
                placeholder="e.g. EU-AI-2026-00001"
                value={form.euDatabaseId}
                onChange={(e) =>
                  setForm({ ...form, euDatabaseId: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Optional. Enter if your system is already registered in the EU AI database.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Data & Users */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Data & Users</CardTitle>
            <CardDescription>
              What data does your system process and who does it affect?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Data types processed *</Label>
              <div className="grid grid-cols-2 gap-3">
                {DATA_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={form.dataTypesProcessed.includes(type)}
                      onCheckedChange={() =>
                        toggleArrayItem("dataTypesProcessed", type)
                      }
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Affected populations *</Label>
              <div className="grid grid-cols-2 gap-3">
                {AFFECTED_POPULATIONS.map((pop) => (
                  <label
                    key={pop}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={form.affectedPopulations.includes(pop)}
                      onCheckedChange={() =>
                        toggleArrayItem("affectedPopulations", pop)
                      }
                    />
                    <span className="text-sm">{pop}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scale">Scale of deployment</Label>
              <Input
                id="scale"
                placeholder="e.g. 10,000 decisions/day, 500 users"
                value={form.scaleOfDeployment}
                onChange={(e) =>
                  setForm({ ...form, scaleOfDeployment: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Deployment */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment Context</CardTitle>
            <CardDescription>
              Where and how is your system deployed?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>EU member states of deployment *</Label>
              <div className="grid grid-cols-3 gap-2">
                {EU_MEMBER_STATES.map((state) => (
                  <label
                    key={state.code}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={form.deploymentMemberStates.includes(state.code)}
                      onCheckedChange={() =>
                        toggleArrayItem("deploymentMemberStates", state.code)
                      }
                    />
                    <span className="text-sm">{state.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Human oversight level *</Label>
              <Select
                value={form.humanOversightLevel}
                onValueChange={(value) =>
                  setForm({ ...form, humanOversightLevel: value || "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select oversight level" />
                </SelectTrigger>
                <SelectContent>
                  {OVERSIGHT_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="integration">Integration with other systems</Label>
              <Textarea
                id="integration"
                placeholder="Describe how this AI system integrates with other systems, databases, or processes..."
                rows={3}
                value={form.integrationDescription}
                onChange={(e) =>
                  setForm({ ...form, integrationDescription: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Save</CardTitle>
            <CardDescription>
              Review your AI system details before saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">System name</h3>
              <p className="font-medium">{form.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-sm">{form.description}</p>
            </div>
            {form.purpose && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Purpose</h3>
                <p className="text-sm">{form.purpose}</p>
              </div>
            )}
            {form.intendedUse && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Intended use</h3>
                <p className="text-sm">{form.intendedUse}</p>
              </div>
            )}
            {form.euDatabaseId && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">EU Database Registration ID</h3>
                <p className="text-sm">{form.euDatabaseId}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Data types</h3>
              <div className="flex flex-wrap gap-2">
                {form.dataTypesProcessed.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Affected populations</h3>
              <div className="flex flex-wrap gap-2">
                {form.affectedPopulations.map((p) => (
                  <Badge key={p} variant="secondary">{p}</Badge>
                ))}
              </div>
            </div>
            {form.scaleOfDeployment && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Scale</h3>
                <p className="text-sm">{form.scaleOfDeployment}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Deployment</h3>
              <div className="flex flex-wrap gap-2">
                {form.deploymentMemberStates.map((code) => {
                  const name = EU_MEMBER_STATES.find((s) => s.code === code)?.name;
                  return <Badge key={code} variant="secondary">{name}</Badge>;
                })}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Human oversight</h3>
              <p className="text-sm">
                {OVERSIGHT_LEVELS.find((l) => l.value === form.humanOversightLevel)?.label}
              </p>
            </div>
            {form.integrationDescription && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Integration</h3>
                <p className="text-sm">{form.integrationDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-3">
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={loading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save as draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={loading}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? "Classifying..." : "Save & classify"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
