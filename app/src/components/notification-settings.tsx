"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Props {
  alertAt72h: boolean;
  alertAt24h: boolean;
  alertOnOverdue: boolean;
}

export function NotificationSettings({ alertAt72h: init72h, alertAt24h: init24h, alertOnOverdue: initOverdue }: Props) {
  const [prefs, setPrefs] = useState({ alertAt72h: init72h, alertAt24h: init24h, alertOnOverdue: initOverdue });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function toggle(key: keyof typeof prefs) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setSaved(false);

    await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const alerts = [
    {
      key: "alertAt72h" as const,
      label: "72-hour warning",
      description: "Email compliance officers 72 hours before the reporting deadline",
    },
    {
      key: "alertAt24h" as const,
      label: "24-hour warning",
      description: "Email compliance officers 24 hours before the reporting deadline",
    },
    {
      key: "alertOnOverdue" as const,
      label: "Overdue alert",
      description: "Email compliance officers when a reporting deadline is missed",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Deadline Alert Emails
        </CardTitle>
        <CardDescription>
          Internal reminders sent to admins and compliance officers — not to national authorities.
          {saving && <span className="ml-2 text-muted-foreground">Saving…</span>}
          {saved && <span className="ml-2 text-green-600 dark:text-green-400">Saved</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.key} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={alert.key} className="text-sm font-medium">
                {alert.label}
              </Label>
              <p className="text-xs text-muted-foreground">{alert.description}</p>
            </div>
            <Switch
              id={alert.key}
              checked={prefs[alert.key]}
              onCheckedChange={() => toggle(alert.key)}
            />
          </div>
        ))}
        {!prefs.alertAt72h && !prefs.alertAt24h && !prefs.alertOnOverdue && (
          <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 rounded-md p-3">
            <BellOff className="h-4 w-4 shrink-0" />
            All deadline alerts are disabled. You won't receive any email reminders.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
