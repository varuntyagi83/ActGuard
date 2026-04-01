import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ArticleData {
  source: string;
  article_ref: string;
  chapter: string;
  title: string;
  content: string;
  risk_tier_relevance: string[];
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

async function main() {
  const dataPath = path.join(__dirname, "data", "eu-ai-act-full.json");
  const articles: ArticleData[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log(`Loaded ${articles.length} articles from EU AI Act data.`);

  // Clear existing RAG documents
  await prisma.ragDocument.deleteMany({});
  console.log("Cleared existing RAG documents.");

  let ingested = 0;

  for (const article of articles) {
    const textForEmbedding = `${article.article_ref}: ${article.title}\n\n${article.content}`;

    console.log(`Embedding ${article.article_ref} — ${article.title}...`);

    const embedding = await generateEmbedding(textForEmbedding);

    // Insert with raw SQL because Prisma doesn't support VECTOR type natively
    await prisma.$executeRaw`
      INSERT INTO rag_documents (id, source, article_ref, content, metadata, embedding)
      VALUES (
        ${`rag-${article.article_ref.toLowerCase().replace(/\s+/g, "-")}`},
        ${article.source},
        ${article.article_ref},
        ${article.content},
        ${JSON.stringify({
          chapter: article.chapter,
          title: article.title,
          risk_tier_relevance: article.risk_tier_relevance,
        })}::jsonb,
        ${JSON.stringify(embedding)}::vector
      )
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding
    `;

    ingested++;
  }

  console.log(`\nIngested ${ingested} articles with embeddings.`);

  // Rebuild IVFFlat index
  console.log("Rebuilding IVFFlat index...");
  await prisma.$executeRaw`REINDEX INDEX rag_documents_embedding_idx`;
  console.log("Index rebuilt.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
