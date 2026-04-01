"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, Circle, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChecklistItem {
  key: string;
  label: string;
  article: string;
  completed: boolean;
  notes: string;
}

interface Props {
  systemId: string;
}

export function ComplianceChecklist({ systemId }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [templateLabel, setTemplateLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    fetch(`/api/checklists?systemId=${systemId}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const checklistItems = data.checklist.items as ChecklistItem[];
          setItems(checklistItems);
          setChecklistId(data.checklist.id);
          setTemplateLabel(data.templateLabel);
          const completed = checklistItems.filter((i) => i.completed).length;
          setCompletion(
            Math.round((completed / checklistItems.length) * 100)
          );
        }
      })
      .finally(() => setLoading(false));
  }, [systemId]);

  const saveItems = useCallback(
    async (updatedItems: ChecklistItem[]) => {
      if (!checklistId) return;
      setSaving(true);
      await fetch("/api/checklists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistId, items: updatedItems }),
      });
      setSaving(false);
    },
    [checklistId]
  );

  function toggleItem(key: string) {
    const updated = items.map((item) =>
      item.key === key ? { ...item, completed: !item.completed } : item
    );
    setItems(updated);
    const completed = updated.filter((i) => i.completed).length;
    setCompletion(Math.round((completed / updated.length) * 100));
    saveItems(updated);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              {templateLabel}
            </CardTitle>
            <CardDescription className="mt-1">
              {items.filter((i) => i.completed).length} of {items.length}{" "}
              requirements completed
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{completion}%</span>
            {saving && (
              <p className="text-xs text-muted-foreground">Saving...</p>
            )}
          </div>
        </div>
        <Progress value={completion} className="mt-3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => toggleItem(item.key)}
              className={`flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                item.completed
                  ? "bg-green-50 dark:bg-green-950/30"
                  : "hover:bg-muted/50"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm ${
                    item.completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] shrink-0"
              >
                {item.article}
              </Badge>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
