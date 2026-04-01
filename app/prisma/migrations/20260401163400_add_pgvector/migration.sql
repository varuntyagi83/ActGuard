-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to rag_documents
ALTER TABLE "rag_documents" ADD COLUMN "embedding" vector(1536);

-- Create IVFFlat index for fast cosine similarity search
-- Note: IVFFlat requires at least some rows to build the index.
-- We create it here; it will be rebuilt after seeding data.
-- Using lists=100 which works well for up to ~1M rows.
CREATE INDEX IF NOT EXISTS "rag_documents_embedding_idx"
  ON "rag_documents"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
