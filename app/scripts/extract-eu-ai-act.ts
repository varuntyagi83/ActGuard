import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const html = fs.readFileSync("/tmp/euaiact.html", "utf-8");
const $ = cheerio.load(html);

interface ArticleData {
  source: string;
  article_ref: string;
  chapter: string;
  title: string;
  content: string;
  risk_tier_relevance: string[];
}

function getRiskTier(articleNum: number, articleRef: string): string[] {
  if (articleRef.startsWith("Annex III")) return ["high"];
  if (articleRef.startsWith("Annex IV")) return ["high"];
  if (articleRef.startsWith("Annex V")) return ["high"];
  if (articleRef.startsWith("Annex VI")) return ["high"];
  if (articleRef.startsWith("Annex VII")) return ["high"];
  if (articleRef.startsWith("Annex")) return ["all"];
  if (articleRef.startsWith("Recital")) return ["all"];

  if (articleNum <= 4) return ["all"];
  if (articleNum === 5) return ["unacceptable"];
  if (articleNum >= 6 && articleNum <= 49) return ["high"];
  if (articleNum === 50) return ["limited"];
  if (articleNum >= 51 && articleNum <= 56) return ["all"];
  if (articleNum >= 57 && articleNum <= 63) return ["all"];
  if (articleNum >= 64 && articleNum <= 71) return ["all"];
  if (articleNum >= 72 && articleNum <= 73) return ["high"];
  if (articleNum >= 74 && articleNum <= 94) return ["all"];
  if (articleNum >= 95 && articleNum <= 96) return ["minimal"];
  return ["all"];
}

function getChapter(articleNum: number): string {
  if (articleNum <= 4) return "Chapter I - General Provisions";
  if (articleNum === 5) return "Chapter II - Prohibited AI Practices";
  if (articleNum >= 6 && articleNum <= 49) return "Chapter III - High-Risk AI Systems";
  if (articleNum === 50) return "Chapter IV - Transparency Obligations";
  if (articleNum >= 51 && articleNum <= 56) return "Chapter V - General-Purpose AI Models";
  if (articleNum >= 57 && articleNum <= 63) return "Chapter VI - Measures in Support of Innovation";
  if (articleNum >= 64 && articleNum <= 70) return "Chapter VII - Governance";
  if (articleNum === 71) return "Chapter VIII - EU Database";
  if (articleNum >= 72 && articleNum <= 94) return "Chapter IX - Post-Market Monitoring and Enforcement";
  if (articleNum >= 95 && articleNum <= 96) return "Chapter X - Codes of Conduct and Guidelines";
  if (articleNum >= 97 && articleNum <= 98) return "Chapter XI - Delegation and Committee";
  if (articleNum >= 99 && articleNum <= 101) return "Chapter XII - Penalties";
  return "Chapter XIII - Final Provisions";
}

const articles: ArticleData[] = [];
const seen = new Set<string>();

// Find all article elements - EUR-Lex uses specific patterns
// Try multiple selectors to catch articles
const articleSelectors = [
  "p.sti-art", // Article headers in EUR-Lex
  ".eli-subdivision", // Alternative structure
  "p[id^='art_']", // ID-based
];

// Approach: scan all text nodes for "Article X" patterns and extract surrounding content
const fullText = $("body").text();

// Extract articles by regex from the full text
const articleRegex = /Article\s+(\d+)\s*\n\s*([^\n]+)\s*\n([\s\S]*?)(?=Article\s+\d+\s*\n|ANNEX\s|$)/g;
let match;

while ((match = articleRegex.exec(fullText)) !== null) {
  const num = parseInt(match[1]);
  const title = match[2].trim();
  let content = match[3].trim();

  // Clean up content - remove excessive whitespace
  content = content
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Skip if too short (likely a false match) or duplicate
  if (content.length < 50) continue;

  const ref = `Article ${num}`;
  if (seen.has(ref)) continue;
  seen.add(ref);

  // Truncate very long articles to keep embeddings focused
  if (content.length > 5000) {
    content = content.substring(0, 5000) + "...";
  }

  articles.push({
    source: "eu_ai_act",
    article_ref: ref,
    chapter: getChapter(num),
    title,
    content,
    risk_tier_relevance: getRiskTier(num, ref),
  });
}

// Also try to extract Annexes
const annexRegex = /ANNEX\s+(I{1,3}V?|VI{0,3}|X{0,3}I{0,3})\s*\n\s*([^\n]+)\s*\n([\s\S]*?)(?=ANNEX\s+[IVX]|$)/g;
while ((match = annexRegex.exec(fullText)) !== null) {
  const annexNum = match[1].trim();
  const title = match[2].trim();
  let content = match[3].trim();

  content = content
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (content.length < 50) continue;

  const ref = `Annex ${annexNum}`;
  if (seen.has(ref)) continue;
  seen.add(ref);

  if (content.length > 5000) {
    content = content.substring(0, 5000) + "...";
  }

  articles.push({
    source: "eu_ai_act",
    article_ref: ref,
    chapter: "Annexes",
    title,
    content,
    risk_tier_relevance: getRiskTier(0, ref),
  });
}

// Sort by article number
articles.sort((a, b) => {
  const numA = parseInt(a.article_ref.match(/\d+/)?.[0] || "999");
  const numB = parseInt(b.article_ref.match(/\d+/)?.[0] || "999");
  return numA - numB;
});

console.log(`Extracted ${articles.length} articles/annexes`);
articles.forEach((a) => {
  console.log(`  ${a.article_ref}: ${a.title} (${a.content.length} chars)`);
});

const outPath = path.join(__dirname, "data", "eu-ai-act-full.json");
fs.writeFileSync(outPath, JSON.stringify(articles, null, 2));
console.log(`\nWritten to ${outPath}`);
