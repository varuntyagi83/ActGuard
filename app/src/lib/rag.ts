import OpenAI from "openai";
import { db } from "@/lib/db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RagResult {
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

export async function searchArticles(
  query: string,
  topK: number = 5,
  threshold: number = 0.5
): Promise<RagResult[]> {
  // Generate query embedding
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  // Search via pgvector cosine similarity
  const results = await db.$queryRaw<
    {
      id: string;
      source: string;
      article_ref: string;
      content: string;
      metadata: { chapter: string; title: string; risk_tier_relevance: string[] };
      similarity: number;
    }[]
  >`
    SELECT
      id,
      source,
      article_ref,
      content,
      metadata,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity
    FROM rag_documents
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${topK}
  `;

  return results.map((r) => ({
    id: r.id,
    source: r.source,
    articleRef: r.article_ref,
    content: r.content,
    similarity: Number(r.similarity),
    metadata: r.metadata as RagResult["metadata"],
  }));
}

export async function getContextForPrompt(
  query: string,
  topK: number = 3
): Promise<string> {
  try {
    const results = await searchArticles(query, topK);

    if (results.length === 0) {
      return "No relevant EU AI Act articles found.";
    }

    return results
      .map(
        (r) =>
          `--- ${r.articleRef}: ${r.metadata.title} (similarity: ${(r.similarity * 100).toFixed(0)}%) ---\n${r.content}`
      )
      .join("\n\n");
  } catch (err) {
    console.error("RAG search failed, proceeding without context:", err);
    return "No relevant EU AI Act articles found.";
  }
}
