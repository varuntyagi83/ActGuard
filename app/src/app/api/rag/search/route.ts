import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchArticles } from "@/lib/rag";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
