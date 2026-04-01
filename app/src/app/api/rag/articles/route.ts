import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { articleRefs } = await req.json();

    if (!articleRefs || !Array.isArray(articleRefs)) {
      return NextResponse.json(
        { error: "articleRefs array is required" },
        { status: 400 }
      );
    }

    // Fetch exact articles by reference
    const results = await db.ragDocument.findMany({
      where: {
        articleRef: { in: articleRefs },
      },
      select: {
        id: true,
        source: true,
        articleRef: true,
        content: true,
        metadata: true,
      },
    });

    // Sort by the order they were requested
    const sorted = articleRefs
      .map((ref: string) => results.find((r) => r.articleRef === ref))
      .filter(Boolean);

    return NextResponse.json({ results: sorted });
  } catch (error) {
    console.error("RAG articles error:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
