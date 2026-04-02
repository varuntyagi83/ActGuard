"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/format-date";
import {
  Loader2,
  Send,
  Clock,
  Building2,
  Mail,
  MessageSquare,
  Bell,
} from "lucide-react";
import { IncidentReportPanel } from "@/components/incident-report-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  incidentDate: string;
  reportingDeadline: string;
  reportedAt: string | null;
  memberState: string | null;
  authorityName: string | null;
  authorityContact: string | null;
  rootCause: string | null;
  remediationSteps: string[];
  resolutionNotes: string | null;
  aiSystemName: string | null;
}

interface TimelineEntry {
  id: string;
  eventType: string;
  description: string;
  createdAt: string;
  creatorName: string;
}

interface ReportSummary {
  reportType: string;
  submittedAt: string | null;
}

interface Props {
  incident: Incident;
  timeline: TimelineEntry[];
  reports?: ReportSummary[];
}

const STATUS_FLOW = ["draft", "reported", "investigating", "resolved", "closed"];

const eventTypeIcons: Record<string, string> = {
  created: "📝",
  status_change: "🔄",
  note: "💬",
  remediation: "🔧",
  authority_notification: "📨",
};

export function IncidentDetail({
  incident: initialIncident,
  timeline: initialTimeline,
  reports = [],
}: Props) {
  const router = useRouter();
  const [incident, setIncident] = useState(initialIncident);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [rootCause, setRootCause] = useState(incident.rootCause || "");
  const [resolutionNotes, setResolutionNotes] = useState(
    incident.resolutionNotes || ""
  );
  const [savingDetails, setSavingDetails] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (!newStatus) return;
    setUpdatingStatus(true);

    const res = await fetch(`/api/incidents/${incident.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setIncident((prev) => ({ ...prev, status: newStatus }));
      router.refresh();
    }

    setUpdatingStatus(false);
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);

    const res = await fetch(`/api/incidents/${incident.id}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "note", description: newNote }),
    });

    if (res.ok) {
      const data = await res.json();
      setTimeline((prev) => [
        {
          id: data.entry.id,
          eventType: "note",
          description: newNote,
          createdAt: new Date().toISOString(),
          creatorName: "You",
        },
        ...prev,
      ]);
      setNewNote("");
      router.refresh();
    }

    setAddingNote(false);
  }

  async function handleSaveDetails() {
    setSavingDetails(true);

    await fetch(`/api/incidents/${incident.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rootCause, resolutionNotes }),
    });

    setSavingDetails(false);
  }

  const hasSubmittedInitial = reports.some(
    (r) => r.reportType === "initial" && r.submittedAt
  );
  const hasFollowUp = reports.some((r) =>
    ["follow_up", "combined", "final"].includes(r.reportType)
  );
  const showFollowUpReminder = hasSubmittedInitial && !hasFollowUp;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Follow-up report reminder */}
        {showFollowUpReminder && (
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 px-4 py-3">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200">
                Follow-up report required
              </p>
              <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                You submitted an initial report. Article 73 requires a follow-up
                report once the investigation is complete. Create one below.
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {incident.description}
            </p>
          </CardContent>
        </Card>

        {/* Status workflow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Workflow</CardTitle>
            <CardDescription>
              Advance the incident through the reporting workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              {STATUS_FLOW.map((s, i) => {
                const isCurrent = s === incident.status;
                const isPast =
                  STATUS_FLOW.indexOf(incident.status) > i;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        isCurrent
                          ? "bg-blue-600 text-white"
                          : isPast
                            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <span className="text-muted-foreground">→</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Move to:</Label>
              <Select
                value={incident.status}
                onValueChange={(val) => val && handleStatusChange(val)}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {updatingStatus && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Authority Reports */}
        <IncidentReportPanel
          incidentId={incident.id}
          authorityName={incident.authorityName}
          authorityContact={incident.authorityContact}
        />

        {/* Root cause & resolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Investigation & Resolution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Root Cause</Label>
              <Textarea
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="Describe the root cause of the incident..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the incident was resolved..."
                rows={3}
              />
            </div>
            <Button
              size="sm"
              onClick={handleSaveDetails}
              disabled={savingDetails}
            >
              {savingDetails ? "Saving..." : "Save Details"}
            </Button>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add note */}
            <div className="flex gap-2 mb-6">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note or update..."
                rows={2}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                className="gap-1 self-end"
              >
                {addingNote ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            {/* Timeline entries */}
            <div className="space-y-4">
              {timeline.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="text-lg">
                    {eventTypeIcons[entry.eventType] || "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.creatorName} —{" "}
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Deadline card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reporting Deadline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <strong>Incident:</strong>{" "}
              {formatDateTime(incident.incidentDate)}
            </p>
            <p className="text-sm mt-1">
              <strong>Deadline:</strong>{" "}
              {formatDateTime(incident.reportingDeadline)}
            </p>
            {incident.reportedAt && (
              <p className="text-sm mt-1 text-green-700 dark:text-green-300">
                <strong>Reported:</strong>{" "}
                {formatDateTime(incident.reportedAt)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Authority card */}
        {incident.authorityName && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                National Authority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{incident.authorityName}</p>
              {incident.memberState && (
                <Badge variant="outline" className="mt-1">
                  {incident.memberState}
                </Badge>
              )}
              {incident.authorityContact && (
                <p className="text-sm mt-2 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <a
                    href={`mailto:${incident.authorityContact}`}
                    className="text-blue-600 hover:underline"
                  >
                    {incident.authorityContact}
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Remediation steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Quick Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">System:</span>{" "}
              {incident.aiSystemName || "Not linked"}
            </div>
            <div>
              <span className="text-muted-foreground">Severity:</span>{" "}
              <Badge
                className={
                  incident.severity === "critical"
                    ? "bg-red-100 text-red-800"
                    : incident.severity === "major"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-yellow-100 text-yellow-800"
                }
              >
                {incident.severity}
              </Badge>
            </div>
            {incident.remediationSteps.length > 0 && (
              <div>
                <span className="text-muted-foreground">
                  Remediation Steps:
                </span>
                <ul className="mt-1 space-y-1">
                  {incident.remediationSteps.map((step, i) => (
                    <li key={i} className="text-xs">
                      • {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
