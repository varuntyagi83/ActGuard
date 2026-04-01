"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setOrgName(value);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName, slug }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create organisation");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">ActGuard</span>
          </div>
          <CardTitle className="text-2xl">Set up your organisation</CardTitle>
          <CardDescription>
            This is where your AI systems and compliance data will live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-md p-3">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="orgName">Organisation name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="orgName"
                  placeholder="Acme AI Corp"
                  value={orgName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                placeholder="acme-ai-corp"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                actguard.com/org/{slug || "your-slug"}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create organisation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
