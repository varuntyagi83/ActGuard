import { NextResponse } from "next/server";
import { searchArticles } from "@/lib/rag";
import { requireRole } from "@/lib/rbac";

export async function POST(req: Request) {
  try {
    const { error } = await requireRole("viewer");
    if (error) return error;

    const { query, topK = 5 } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const results = await searchArticles(query, topK);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("RAG search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
