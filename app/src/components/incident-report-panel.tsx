"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Download,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface Report {
  id: string;
  reportType: string;
  reportNumber: number;
  submittedAt: string | null;
  submittedTo: string | null;
  createdAt: string;
}

interface Props {
  incidentId: string;
  authorityName: string | null;
  authorityContact: string | null;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  initial: "Initial Report",
  follow_up: "Follow-up Report",
  combined: "Combined Report",
  final: "Final Report",
};

export function IncidentReportPanel({
  incidentId,
  authorityName,
  authorityContact,
}: Props) {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [newReportType, setNewReportType] = useState("initial");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/incidents/${incidentId}/reports`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
        }
      })
      .finally(() => setLoading(false));
  }, [incidentId]);

  const hasInitial = reports.some((r) => r.reportType === "initial");

  async function handleCreate() {
    setError("");
    setSuccess("");
    setCreating(true);

    const res = await fetch(`/api/incidents/${incidentId}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportType: newReportType }),
    });

    if (res.ok) {
      const data = await res.json();
      setReports((prev) => [
        ...prev,
        {
          id: data.report.id,
          reportType: data.report.reportType,
          reportNumber: data.report.reportNumber,
          submittedAt: null,
          submittedTo: null,
          createdAt: new Date().toISOString(),
        },
      ]);
      setSuccess(
        `${REPORT_TYPE_LABELS[newReportType]} #${data.report.reportNumber} created`
      );
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create report");
    }

    setCreating(false);
  }

  async function handleSubmit(reportId: string) {
    if (
      !confirm(
        `Submit this report to ${authorityName || "the authority"} (${authorityContact})? This action cannot be undone.`
      )
    )
      return;

    setError("");
    setSuccess("");
    setSubmitting(reportId);

    const res = await fetch(
      `/api/incidents/${incidentId}/reports/${reportId}/submit`,
      { method: "POST" }
    );

    if (res.ok) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                submittedAt: new Date().toISOString(),
                submittedTo: authorityContact,
              }
            : r
        )
      );
      setSuccess("Report submitted to authority successfully");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Submission failed");
    }

    setSubmitting(null);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Authority Reports
        </CardTitle>
        <CardDescription>
          Generate and submit formal incident reports per Article 73
          {authorityName && (
            <>
              {" "}
              to <strong>{authorityName}</strong>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm rounded-md p-3">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm rounded-md p-3">
            {success}
          </div>
        )}

        {/* Existing reports */}
        {reports.length > 0 && (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      #{report.reportNumber}{" "}
                      {REPORT_TYPE_LABELS[report.reportType] ||
                        report.reportType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report.submittedAt ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Submitted
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      Draft
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() =>
                      window.open(
                        `/api/incidents/${incidentId}/reports/${report.id}/pdf`,
                        "_blank"
                      )
                    }
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </Button>
                  {!report.submittedAt && authorityContact && (
                    <Button
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => handleSubmit(report.id)}
                      disabled={submitting === report.id}
                    >
                      {submitting === report.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create new report */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Select
            value={newReportType}
            onValueChange={(val) => val && setNewReportType(val)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial" disabled={hasInitial}>
                Initial Report
              </SelectItem>
              <SelectItem value="follow_up">Follow-up Report</SelectItem>
              <SelectItem value="combined">Combined Report</SelectItem>
              <SelectItem value="final">Final Report</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={creating}
            className="gap-1"
          >
            {creating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Create Report
          </Button>
        </div>

        {!authorityContact && (
          <p className="text-xs text-orange-600 dark:text-orange-400">
            No authority email configured for this incident. Select a member
            state to enable submission.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
