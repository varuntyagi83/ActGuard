"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Edit, Save, X, RotateCcw, Loader2, Download } from "lucide-react";
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
  systemName: string;
  docTypeLabel: string;
  version: number;
}

function renderStructuredContent(value: unknown): React.ReactNode {
  // Plain string — render as text
  if (typeof value === "string") {
    // Try parsing as JSON in case it's a JSON string
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        return renderStructuredContent(parsed);
      }
    } catch {
      // Not JSON, render as plain text
      return (
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{value}</p>
      );
    }
    return (
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{value}</p>
    );
  }

  // Array — render as a list of items
  if (Array.isArray(value)) {
    return (
      <div className="space-y-3">
        {value.map((item, i) => {
          if (typeof item === "object" && item !== null) {
            // Object with risk/description pattern (risk lists)
            if ("risk" in item && "description" in item) {
              return (
                <div key={i} className="border border-border rounded-lg p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {item.risk}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              );
            }
            // Object with name/description pattern
            if ("name" in item && "description" in item) {
              return (
                <div key={i} className="border border-border rounded-lg p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                  {Object.entries(item)
                    .filter(([k]) => k !== "name" && k !== "description")
                    .map(([k, v]) => (
                      <p key={k} className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium capitalize">
                          {k.replace(/_/g, " ")}:
                        </span>{" "}
                        {String(v)}
                      </p>
                    ))}
                </div>
              );
            }
            // Generic object in array
            return (
              <div key={i} className="border border-border rounded-lg p-3">
                {renderObjectFields(item)}
              </div>
            );
          }
          // Primitive in array
          return (
            <p key={i} className="text-sm leading-relaxed">
              • {String(item)}
            </p>
          );
        })}
      </div>
    );
  }

  // Object — render as key-value fields or nested structure
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);

    // Check if it's a risk matrix style (keys are risk names, values are objects with impact/likelihood)
    const isRiskMatrix = entries.every(
      ([, v]) =>
        typeof v === "object" &&
        v !== null &&
        ("impact" in v || "likelihood" in v || "severity" in v)
    );

    if (isRiskMatrix) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 font-semibold text-muted-foreground">
                  Risk
                </th>
                {Object.keys(
                  entries[0]?.[1] as Record<string, unknown>
                ).map((col) => (
                  <th
                    key={col}
                    className="text-left p-2 font-semibold text-muted-foreground capitalize"
                  >
                    {col.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(([riskName, riskData]) => (
                <tr key={riskName} className="border-b border-border/50">
                  <td className="p-2 font-medium">{riskName}</td>
                  {Object.values(riskData as Record<string, unknown>).map(
                    (val, i) => (
                      <td key={i} className="p-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            String(val).toLowerCase() === "high" ||
                            String(val).toLowerCase() === "critical"
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : String(val).toLowerCase() === "medium"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                                : String(val).toLowerCase() === "low"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {String(val)}
                        </span>
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Generic object
    return <div className="space-y-3">{renderObjectFields(value)}</div>;
  }

  // Fallback
  return (
    <p className="text-sm whitespace-pre-wrap leading-relaxed">
      {String(value)}
    </p>
  );
}

function renderObjectFields(obj: unknown): React.ReactNode {
  if (typeof obj !== "object" || obj === null) {
    return <span className="text-sm">{String(obj)}</span>;
  }
  return Object.entries(obj as Record<string, unknown>).map(([key, val]) => (
    <div key={key}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
        {key.replace(/_/g, " ")}
      </p>
      {typeof val === "object" && val !== null ? (
        <div className="ml-3 border-l-2 border-border pl-3">
          {renderStructuredContent(val)}
        </div>
      ) : (
        <p className="text-sm leading-relaxed">{String(val)}</p>
      )}
    </div>
  ));
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderValueToHtml(value: unknown): string {
  // Plain string
  if (typeof value === "string") {
    // Try parsing as JSON
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        return renderValueToHtml(parsed);
      }
    } catch {
      // Not JSON
    }
    return `<p style="font-size:13px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(value)}</p>`;
  }

  // Array
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          // risk/description pattern
          if ("risk" in item && "description" in item) {
            return `<div style="border:1px solid #ddd;border-radius:6px;padding:10px;margin-bottom:8px;">
              <p style="font-size:13px;font-weight:600;margin:0;">${escapeHtml(item.risk)}</p>
              <p style="font-size:12px;color:#555;margin:4px 0 0;">${escapeHtml(item.description)}</p>
            </div>`;
          }
          // name/description pattern
          if ("name" in item && "description" in item) {
            const extra = Object.entries(item)
              .filter(([k]) => k !== "name" && k !== "description")
              .map(([k, v]) => `<span style="font-size:11px;color:#666;"><b>${escapeHtml(k.replace(/_/g, " "))}:</b> ${escapeHtml(String(v))}</span>`)
              .join(" &middot; ");
            return `<div style="border:1px solid #ddd;border-radius:6px;padding:10px;margin-bottom:8px;">
              <p style="font-size:13px;font-weight:600;margin:0;">${escapeHtml(item.name)}</p>
              <p style="font-size:12px;color:#555;margin:4px 0 0;">${escapeHtml(item.description)}</p>
              ${extra ? `<p style="margin:4px 0 0;">${extra}</p>` : ""}
            </div>`;
          }
          // Generic object in array
          return `<div style="border:1px solid #ddd;border-radius:6px;padding:10px;margin-bottom:8px;">${renderObjectFieldsHtml(item)}</div>`;
        }
        return `<p style="font-size:13px;line-height:1.7;">• ${escapeHtml(String(item))}</p>`;
      })
      .join("");
  }

  // Object
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);

    // Risk matrix style (keys → {impact, likelihood, ...})
    const isRiskMatrix = entries.length > 0 && entries.every(
      ([, v]) =>
        typeof v === "object" &&
        v !== null &&
        ("impact" in v || "likelihood" in v || "severity" in v)
    );

    if (isRiskMatrix) {
      const cols = Object.keys(entries[0][1] as Record<string, unknown>);
      const badgeStyle = (val: string) => {
        const low = val.toLowerCase();
        if (low === "high" || low === "critical") return "background:#fee2e2;color:#991b1b;";
        if (low === "medium") return "background:#fef9c3;color:#854d0e;";
        if (low === "low") return "background:#dcfce7;color:#166534;";
        return "background:#f3f4f6;color:#374151;";
      };
      const headerCells = cols.map((c) => `<th style="text-align:left;padding:6px 10px;font-size:12px;text-transform:capitalize;border-bottom:2px solid #ddd;">${escapeHtml(c.replace(/_/g, " "))}</th>`).join("");
      const rows = entries.map(([name, data]) => {
        const cells = Object.values(data as Record<string, unknown>).map(
          (v) => `<td style="padding:6px 10px;"><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;${badgeStyle(String(v))}">${escapeHtml(String(v))}</span></td>`
        ).join("");
        return `<tr style="border-bottom:1px solid #eee;"><td style="padding:6px 10px;font-size:13px;font-weight:500;">${escapeHtml(name)}</td>${cells}</tr>`;
      }).join("");
      return `<table style="width:100%;border-collapse:collapse;margin-top:8px;"><thead><tr style="border-bottom:2px solid #ddd;"><th style="text-align:left;padding:6px 10px;font-size:12px;border-bottom:2px solid #ddd;">Risk</th>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`;
    }

    // Generic object
    return renderObjectFieldsHtml(value);
  }

  return `<p style="font-size:13px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(String(value))}</p>`;
}

function renderObjectFieldsHtml(obj: unknown): string {
  if (typeof obj !== "object" || obj === null) return escapeHtml(String(obj));
  return Object.entries(obj as Record<string, unknown>)
    .map(([key, val]) => {
      const label = `<p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#888;letter-spacing:0.5px;margin:8px 0 2px;">${escapeHtml(key.replace(/_/g, " "))}</p>`;
      if (typeof val === "object" && val !== null) {
        return `${label}<div style="margin-left:12px;border-left:2px solid #ddd;padding-left:12px;">${renderValueToHtml(val)}</div>`;
      }
      return `${label}<p style="font-size:13px;line-height:1.6;margin:0;">${escapeHtml(String(val))}</p>`;
    })
    .join("");
}

export function DocumentViewer({
  documentId,
  content,
  sectionLabels,
  systemName,
  docTypeLabel,
  version,
}: Props) {
  const router = useRouter();
  const [localContent, setLocalContent] = useState(content);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const sections = Object.keys(localContent).sort((a, b) => {
    const numA = parseInt(sectionLabels[a]?.match(/^(\d+)/)?.[1] || "99");
    const numB = parseInt(sectionLabels[b]?.match(/^(\d+)/)?.[1] || "99");
    return numA - numB;
  });

  async function saveToServer(updatedContent: Record<string, string>) {
    await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: updatedContent }),
    });
  }

  async function handleSaveSection(sectionKey: string) {
    setSaving(true);
    const updated = { ...localContent, [sectionKey]: editValue };
    setLocalContent(updated);
    await saveToServer(updated);
    setSaving(false);
    setEditingSection(null);
    setHasUnsavedChanges(false);
    router.refresh();
  }

  async function handleSaveAll() {
    setSavingAll(true);
    // If currently editing, apply the edit first
    if (editingSection) {
      const updated = { ...localContent, [editingSection]: editValue };
      setLocalContent(updated);
      await saveToServer(updated);
      setEditingSection(null);
    } else {
      await saveToServer(localContent);
    }
    setSavingAll(false);
    setHasUnsavedChanges(false);
    router.refresh();
  }

  async function handleRegenerate(sectionKey: string) {
    setRegenerating(sectionKey);

    const res = await fetch("/api/documents/regenerate-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, sectionKey }),
    });

    if (res.ok) {
      const data = await res.json();
      setLocalContent((prev) => ({ ...prev, [sectionKey]: data.content }));
      setHasUnsavedChanges(true);
    }

    setRegenerating(null);
    router.refresh();
  }

  function startEditing(sectionKey: string) {
    setEditingSection(sectionKey);
    const val = localContent[sectionKey];
    setEditValue(typeof val === "string" ? val : JSON.stringify(val, null, 2));
  }

  function handleExportPdf() {
    // Build a printable HTML document and trigger browser print
    const printContent = sections
      .map((key) => {
        const label = sectionLabels[key] || key;
        const val = localContent[key];
        const htmlBody = renderValueToHtml(val);
        return `<h2 style="margin-top:24px;font-size:16px;font-weight:bold;border-bottom:1px solid #ddd;padding-bottom:8px;">${label}</h2>${htmlBody}`;
      })
      .join("");

    const shieldLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`;

    const html = `<!DOCTYPE html><html><head><title>${docTypeLabel} — ${systemName}</title>
      <style>@page{margin:60px 50px;}body{font-family:system-ui,sans-serif;color:#1a1a1a;max-width:700px;margin:0 auto;padding:40px;}
      .header{border-bottom:2px solid #2563eb;padding-bottom:16px;margin-bottom:24px;}
      .header .logo-row{display:flex;align-items:center;gap:10px;margin-bottom:4px;}
      .header h1{font-size:22px;margin:0;} .header p{font-size:12px;color:#666;margin:4px 0 0;}
      .header .brand{font-size:11px;font-weight:600;color:#2563eb;letter-spacing:0.5px;text-transform:uppercase;}
      .footer{margin-top:40px;border-top:1px solid #ddd;padding-top:12px;font-size:10px;color:#999;display:flex;align-items:center;justify-content:center;gap:6px;}</style></head>
      <body><div class="header"><div class="logo-row">${shieldLogo}<span class="brand">ActGuard</span></div><h1>${docTypeLabel}</h1><p>${systemName} — Version ${version} — ${new Date().toLocaleDateString()}</p></div>
      ${printContent}
      <div class="footer">${shieldLogo.replace('width="28" height="28"', 'width="14" height="14"')} Generated by ActGuard — EU AI Act Compliance Suite</div></body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  return (
    <div>
      {/* Top action bar */}
      <div className="flex items-center justify-end gap-2 mb-6">
        {hasUnsavedChanges && (
          <span className="text-xs text-orange-600 dark:text-orange-400 mr-2">
            Unsaved changes
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveAll}
          disabled={savingAll}
          className="gap-1.5"
        >
          {savingAll ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save all
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Print PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.open(`/api/documents/export-pdf?documentId=${documentId}`, "_blank");
          }}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </Button>
      </div>

      <div className="flex gap-6" ref={printRef}>
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
            const value = localContent[key];

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
                            onClick={() => handleSaveSection(key)}
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
                      {renderStructuredContent(value)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
