"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

interface AiSystem {
  id: string;
  name: string;
}

export default function NewIncidentPage() {
  const router = useRouter();
  const [systems, setSystems] = useState<AiSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [aiSystemId, setAiSystemId] = useState("");
  const [memberState, setMemberState] = useState("");

  useEffect(() => {
    fetch("/api/systems")
      .catch(() => null);
    // Fetch systems list — use the systems page data
    // For now, we'll fetch from the page's own data
  }, []);

  // Fetch systems for the dropdown
  useEffect(() => {
    async function fetchSystems() {
      try {
        const res = await fetch("/api/systems/list");
        if (res.ok) {
          const data = await res.json();
          setSystems(data.systems || []);
        }
      } catch {
        // Silently fail — systems dropdown will be empty
      }
    }
    fetchSystems();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          severity,
          incidentDate,
          aiSystemId: aiSystemId || null,
          memberState: memberState || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create incident");
      } else {
        const data = await res.json();
        router.push(`/incidents/${data.incident.id}`);
      }
    } catch {
      setError("Something went wrong");
    }

    setLoading(false);
  }

  const deadlineDate = new Date(
    new Date(incidentDate).getTime() + 24 * 60 * 60 * 1000
  );

  return (
    <div>
      <Link href="/incidents">
        <Button variant="ghost" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Incidents
        </Button>
      </Link>

      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Report Incident
          </h1>
          <p className="text-muted-foreground mt-1">
            Report an AI system incident per Article 72. A 24-hour reporting
            deadline will be automatically set.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm rounded-md p-3">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incident Details</CardTitle>
              <CardDescription>
                Describe what happened and when
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Incident Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the incident"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed account of the incident, affected users, and immediate impact..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select
                    value={severity}
                    onValueChange={(val) => val && setSeverity(val)}
                    required
                  >
                    <SelectTrigger id="severity">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">
                        Critical — immediate harm or safety risk
                      </SelectItem>
                      <SelectItem value="major">
                        Major — significant impact, no immediate harm
                      </SelectItem>
                      <SelectItem value="minor">
                        Minor — limited impact, no harm
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incident-date">Date & Time of Incident *</Label>
                  <Input
                    id="incident-date"
                    type="datetime-local"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {incidentDate && (
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    24-hour reporting deadline:{" "}
                    {deadlineDate.toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Per Article 72, serious incidents must be reported within 24
                    hours.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Context</CardTitle>
              <CardDescription>
                Link to an AI system and jurisdiction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system">Affected AI System</Label>
                <Select
                  value={aiSystemId}
                  onValueChange={(val) => val && setAiSystemId(val)}
                >
                  <SelectTrigger id="system">
                    <SelectValue placeholder="Select AI system (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-state">Member State</Label>
                <Select
                  value={memberState}
                  onValueChange={(val) => val && setMemberState(val)}
                >
                  <SelectTrigger id="member-state">
                    <SelectValue placeholder="Select member state (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {EU_MEMBER_STATES.map((ms) => (
                      <SelectItem key={ms.code} value={ms.code}>
                        {ms.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The national authority will be auto-resolved based on the
                  member state.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {loading ? "Submitting..." : "Report Incident"}
          </Button>
        </form>
      </div>
    </div>
  );
}
