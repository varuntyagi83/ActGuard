"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Save, X, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  documentId: string;
  docType: string;
  content: Record<string, string>;
  sectionLabels: Record<string, string>;
}

export function DocumentViewer({
  documentId,
  docType,
  content,
  sectionLabels,
}: Props) {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = Object.keys(content).sort((a, b) => {
    const numA = parseInt(sectionLabels[a]?.match(/^(\d+)/)?.[1] || "99");
    const numB = parseInt(sectionLabels[b]?.match(/^(\d+)/)?.[1] || "99");
    return numA - numB;
  });

  async function handleSave(sectionKey: string) {
    setSaving(true);
    const updated = { ...content, [sectionKey]: editValue };

    await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: updated }),
    });

    setSaving(false);
    setEditingSection(null);
    router.refresh();
  }

  async function handleRegenerate(sectionKey: string) {
    setRegenerating(sectionKey);

    await fetch("/api/documents/regenerate-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, sectionKey }),
    });

    setRegenerating(null);
    router.refresh();
  }

  function startEditing(sectionKey: string) {
    setEditingSection(sectionKey);
    setEditValue(
      typeof content[sectionKey] === "string"
        ? content[sectionKey]
        : JSON.stringify(content[sectionKey], null, 2)
    );
  }

  return (
    <div className="flex gap-6">
      {/* Section nav */}
      <nav className="w-56 shrink-0 hidden lg:block">
        <div className="sticky top-6 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Sections
          </p>
          {sections.map((key) => (
            <button
              key={key}
              onClick={() => {
                setActiveSection(key);
                document.getElementById(`section-${key}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className={`block w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                activeSection === key
                  ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {sectionLabels[key] || key}
            </button>
          ))}
        </div>
      </nav>

      {/* Document content */}
      <div className="flex-1 space-y-6 min-w-0">
        {sections.map((key) => {
          const isEditing = editingSection === key;
          const isRegenerating = regenerating === key;
          const value = content[key];
          const displayValue =
            typeof value === "string" ? value : JSON.stringify(value, null, 2);

          return (
            <Card key={key} id={`section-${key}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {sectionLabels[key] || key}
                  </CardTitle>
                  <div className="flex gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSave(key)}
                          disabled={saving}
                          className="gap-1 h-7 text-xs"
                        >
                          {saving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSection(null)}
                          className="h-7 text-xs"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(key)}
                          className="gap-1 h-7 text-xs"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate(key)}
                          disabled={isRegenerating}
                          className="gap-1 h-7 text-xs"
                        >
                          {isRegenerating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          Regenerate
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {displayValue}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
