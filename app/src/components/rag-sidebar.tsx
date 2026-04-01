"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, BookOpen, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RagResult {
  id: string;
  source: string;
  articleRef: string;
  content: string;
  similarity: number;
  metadata: {
    chapter: string;
    title: string;
    risk_tier_relevance: string[];
  };
}

interface RagSidebarProps {
  autoQuery?: string;
}

export function RagSidebar({ autoQuery }: RagSidebarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RagResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch("/api/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, topK: 5 }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch {
      // Silently fail — guidance is non-critical
    }

    setLoading(false);
  }, []);

  // Auto-search when autoQuery changes
  useEffect(() => {
    if (autoQuery) {
      doSearch(autoQuery);
    }
  }, [autoQuery, doSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  return (
    <div className="w-80 border-l bg-white h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold">EU AI Act Guidance</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search articles..."
              className="pl-8 h-8 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && !hasSearched && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Search the EU AI Act or contextual guidance will appear
            automatically as you work.
          </p>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No relevant articles found. Try a different query.
          </p>
        )}

        {results.map((result) => {
          const isExpanded = expandedId === result.id;
          const similarity = Math.round(result.similarity * 100);

          return (
            <div
              key={result.id}
              className="border rounded-lg overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : result.id)
                }
                className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-600">
                      {result.articleRef}
                    </p>
                    <p className="text-xs font-medium mt-0.5 truncate">
                      {result.metadata.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {similarity}%
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
                {!isExpanded && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {result.content.substring(0, 150)}...
                  </p>
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 border-t bg-gray-50">
                  <p className="text-[11px] text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap">
                    {result.content}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      {result.source}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {result.metadata.chapter}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
