"use client";

import { useState } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface Props {
  systemId: string;
  currentValue: string | null;
}

export function EuDatabaseIdEditor({ systemId, currentValue }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentValue || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/systems/${systemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ euDatabaseId: value || null }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm">{currentValue || <span className="text-muted-foreground italic">Not set</span>}</p>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. EU-DB-2026-XXXXX"
        className="h-8 text-sm"
        autoFocus
      />
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-green-600" />}
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditing(false); setValue(currentValue || ""); }}>
        <X className="h-3.5 w-3.5 text-red-500" />
      </Button>
    </div>
  );
}
