# CLAUDE.md — ActGuard

## What is ActGuard?

EU AI Act Compliance Suite. Two modules:
1. **CaaS** (Compliance-as-a-Service): Risk classification + compliance document generation for AI systems
2. **AIRS** (AI Incident Reporting System): 24h incident reporting with authority routing across EU27

Deadline: EU AI Act high-risk enforcement **August 2, 2026**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), Tailwind CSS, shadcn/ui |
| Backend | Next.js API routes |
| Database | Railway PostgreSQL + pgvector extension |
| ORM | Prisma (raw SQL for vector ops) |
| Auth | NextAuth.js (Auth.js v5) — email/password + Google SSO |
| AI | OpenAI GPT-4o (classification, doc gen), GPT-4o-mini (severity, suggestions) |
| Embeddings | OpenAI text-embedding-3-small (1536d) |
| RAG | pgvector cosine similarity on Railway PostgreSQL |
| Chunking | LangChain.js RecursiveCharacterTextSplitter |
| PDF | React-PDF (@react-pdf/renderer) |
| File storage | Uploadthing |
| Email | Resend |
| Deploy | Vercel (frontend) + Railway (DB + services) |

## Architecture Decisions

- **No Supabase**: Railway PostgreSQL replaces Supabase for DB, auth is NextAuth.js, file storage is Uploadthing
- **Single database for vectors**: pgvector on Railway PG — no separate vector DB (Pinecone, Weaviate, etc.)
- **OpenAI everywhere**: All AI features use OpenAI (GPT-4o/4o-mini for LLM, text-embedding-3-small for embeddings)
- **Prisma ORM**: Type-safe queries, `$queryRaw` for pgvector operations, `@auth/prisma-adapter` for NextAuth
- **Org-scoped tenancy**: Prisma middleware enforces org_id on all queries (replaces Supabase RLS)

## RAG Pipeline

1. EU AI Act text chunked by article → `rag_documents` table
2. Embeddings via OpenAI text-embedding-3-small (1536d)
3. IVFFlat index for fast cosine similarity search
4. `lib/rag.ts` → `searchArticles(query, topK)` → Prisma `$queryRaw`
5. Results injected into OpenAI prompts as context

## Environment Variables

```
DATABASE_URL=            # Railway PostgreSQL connection string
NEXTAUTH_SECRET=         # NextAuth JWT secret
NEXTAUTH_URL=            # App URL (http://localhost:3000 in dev)
OPENAI_API_KEY=          # OpenAI API key
GOOGLE_CLIENT_ID=        # Google OAuth
GOOGLE_CLIENT_SECRET=    # Google OAuth
UPLOADTHING_SECRET=      # Uploadthing
UPLOADTHING_APP_ID=      # Uploadthing
RESEND_API_KEY=          # Resend email
```

## Key Commands

```bash
npm run dev              # Start dev server
npx prisma migrate dev   # Run database migrations
npx prisma generate      # Regenerate Prisma client
npx prisma studio        # Visual database browser
npx tsx scripts/ingest-eu-ai-act.ts  # Ingest EU AI Act into RAG
```

## Database

- All tables in `prisma/schema.prisma`
- pgvector extension for RAG embeddings
- Key tables: `organizations`, `users`, `ai_systems`, `compliance_documents`, `incidents`, `incident_timeline`, `compliance_checklists`, `rag_documents`, `national_authorities`
- Org-scoped access control via Prisma middleware

## Build Plan (Ralph Loop)

12 sessions across 3 phases:
- **Phase 1** (Sessions 1-4): Scaffold, auth, intake wizard, classification, RAG
- **Phase 2** (Sessions 5-8): Doc generation, risk plans, PDF export, dashboard
- **Phase 3** (Sessions 9-12): Incident intake, SLA tracker, reports, analytics

## Conventions

- All AI calls go through `/api/` routes, never from client directly
- OpenAI structured outputs (`response_format: { type: "json_object" }`) for all LLM responses
- File uploads via Uploadthing, PDFs stored with signed URLs
- Email notifications via Resend
- Role-based access: admin > compliance_officer > viewer
