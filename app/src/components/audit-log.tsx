"use client";

import { formatDateTime } from "@/lib/format-date";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";

const EVENT_LABELS: Record<string, string> = {
  created: "Incident created",
  status_change: "Status updated",
  note: "Note added",
  remediation: "Remediation step added",
  authority_notification: "Authority notified",
  report_submitted: "Report submitted",
};

const EVENT_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  status_change: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  note: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  remediation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  authority_notification: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  report_submitted: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
};

interface AuditEntry {
  id: string;
  eventType: string;
  description: string;
  createdAt: string;
  creatorName: string;
  incidentTitle?: string;
  incidentId?: string;
}

interface Props {
  entries: AuditEntry[];
}

export function AuditLog({ entries }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ScrollText className="h-4 w-4" />
          Audit Log
        </CardTitle>
        <CardDescription>
          All incident activity across your organisation — last 100 events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No activity recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="w-36 shrink-0 text-xs text-muted-foreground pt-0.5">
                  {formatDateTime(entry.createdAt)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`text-[10px] ${EVENT_COLORS[entry.eventType] || "bg-gray-100 text-gray-800"}`}
                    >
                      {EVENT_LABELS[entry.eventType] || entry.eventType}
                    </Badge>
                    {entry.incidentTitle && (
                      <span className="text-xs text-muted-foreground truncate">
                        on <span className="font-medium text-foreground">{entry.incidentTitle}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">— {entry.creatorName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
