"use client";

import { useState } from "react";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RagSidebar } from "@/components/rag-sidebar";

interface Props {
  children: React.ReactNode;
  autoQuery: string;
}

export function SystemDetailWithRag({ children, autoQuery }: Props) {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="flex h-full -m-6">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Toggle button */}
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="gap-2"
          >
            {showSidebar ? (
              <>
                <X className="h-3.5 w-3.5" />
                Hide guidance
              </>
            ) : (
              <>
                <BookOpen className="h-3.5 w-3.5" />
                EU AI Act guidance
              </>
            )}
          </Button>
        </div>
        {children}
      </div>

      {/* RAG sidebar */}
      {showSidebar && <RagSidebar autoQuery={autoQuery} />}
    </div>
  );
}
