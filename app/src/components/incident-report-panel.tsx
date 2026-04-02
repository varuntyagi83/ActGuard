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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format-date";

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
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [newReportType, setNewReportType] = useState("initial");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmReport, setConfirmReport] = useState<Report | null>(null);

  useEffect(() => {
    fetch(`/api/incidents/${incidentId}/reports`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
        }
      })
      .finally(() => setLoading(false));

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setSessionEmail(data?.user?.email || null));
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
                      {formatDate(report.createdAt)}
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
                      onClick={() => setConfirmReport(report)}
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

      {/* Submission confirmation dialog */}
      <Dialog open={!!confirmReport} onOpenChange={(open) => { if (!open) setConfirmReport(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Report Submission</DialogTitle>
            <DialogDescription>
              Review what will be sent before confirming. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {confirmReport && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">From</span>
                  <p>ActGuard &lt;noreply@corevisionailabs.com&gt;</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">Reply-To</span>
                  {sessionEmail
                    ? <p>{sessionEmail}</p>
                    : <p className="text-muted-foreground italic">No email on account</p>
                  }
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">To</span>
                  <div>
                    <p className="font-medium">{authorityName}</p>
                    <p className="text-muted-foreground">{authorityContact}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">Subject</span>
                  <p>[EU AI Act - Art. 73] Incident Report ({confirmReport.reportType.replace("_", " ")})</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">Attachment</span>
                  <p className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    incident-report-{confirmReport.reportNumber}-{confirmReport.reportType}.pdf
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The PDF will be generated from the current report content and attached automatically.
                You can preview it by clicking <strong>PDF</strong> on the report before submitting.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReport(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmReport) {
                  handleSubmit(confirmReport.id);
                  setConfirmReport(null);
                }
              }}
              disabled={!!submitting}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Send to Authority
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
