# ActGuard — EU AI Act Compliance Suite

> **"Compliance before the clock runs out."**
> High-risk AI enforcement begins **August 2, 2026**.

ActGuard is a full-stack compliance platform that helps companies deploying AI in the EU classify their systems, generate audit-ready documentation, and manage incident reporting obligations under the EU AI Act.

---

## What it does

### Module 1 — Compliance-as-a-Service (CaaS)
- **Risk classification** — Describe your AI system and get an instant risk tier (prohibited / high / limited / minimal) with Article-level reasoning powered by GPT-4o and a RAG pipeline over the full EU AI Act text
- **Document generation** — One-click generation of all required compliance documents:
  - Technical Documentation (Article 11 + Annex IV)
  - Risk Management Plan (Article 9)
  - Data Governance Record (Article 10)
  - Conformity Assessment (Article 43)
  - Transparency Information (Article 13)
  - Human Oversight Plan (Article 14)
  - Declaration of Conformity (Article 47)
- **PDF export** — Download any document as a formatted PDF
- **Edit & version** — Edit individual sections, regenerate with AI, track version history
- **Prohibited AI checker** — Paste a system description and get an Article 5 analysis across all 8 prohibited practices

### Module 2 — AI Incident Reporting System (AIRS)
- **Incident intake** — Structured form with severity classification (GPT-4o-mini), automatic deadline calculation per Article 73 (2 / 10 / 15 days based on incident type)
- **Authority routing** — Auto-routes to the correct national supervisory authority across all EU27 member states
- **SLA tracker** — Real-time countdown, color-coded urgency, overdue alerts
- **Incident reports** — Generate formal EU Commission–format reports (5-section template), download as PDF, submit via email to national authorities
- **Timeline & audit log** — Every status change, submission, and action is recorded
- **Configurable alerts** — Compliance officers set 72h / 24h / overdue reminder thresholds

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), Tailwind CSS, shadcn/ui |
| Backend | Next.js API routes |
| Database | Railway PostgreSQL + pgvector extension |
| ORM | Prisma |
| Auth | Auth.js v5 — email/password + Google SSO |
| AI | OpenAI GPT-4o (classification, doc gen), GPT-4o-mini (severity) |
| Embeddings | OpenAI text-embedding-3-small (1536d) stored in pgvector |
| PDF | @react-pdf/renderer |
| Email | Resend |
| Deploy | Railway (app + PostgreSQL) |

---

## Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL database with the `vector` extension (Railway recommended)
- OpenAI API key
- Google OAuth credentials (optional, for Google SSO)
- Resend API key (for email notifications)

### 1. Clone and install

```bash
git clone https://github.com/varuntyagi83/ActGuard.git
cd ActGuard/app
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL="postgresql://..."        # PostgreSQL connection string
AUTH_SECRET="..."                       # Random secret (openssl rand -base64 32)
AUTH_URL="http://localhost:3000"        # App URL

OPENAI_API_KEY="sk-..."

GOOGLE_CLIENT_ID="..."                  # Optional: Google OAuth
GOOGLE_CLIENT_SECRET="..."

RESEND_API_KEY="re_..."                 # Optional: email alerts
```

### 3. Run database migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Ingest the EU AI Act into RAG

This populates the vector database with EU AI Act articles so the AI has accurate legal context:

```bash
npx tsx scripts/ingest-eu-ai-act.ts
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key commands

```bash
npm run dev              # Start development server
npm run build            # Production build
npx prisma migrate dev   # Create and apply a new migration
npx prisma studio        # Visual database browser
npx tsx scripts/ingest-eu-ai-act.ts  # Re-ingest EU AI Act into RAG
```

---

## Deployment (Railway)

Both the Next.js app and PostgreSQL database are hosted on Railway.

1. **Database** — Create a PostgreSQL service on Railway. Run migrations with the public connection URL:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```
2. **App** — Create a new Railway service from the GitHub repo. Set the root directory to `app` in the service settings.
3. **Environment variables** — Add all variables from `.env` to the Railway service. Use Railway's internal PostgreSQL URL (`DATABASE_INTERNAL_URL`) as `DATABASE_URL` in the deployed service for lower latency.
4. **Start command** — Railway will auto-detect Next.js. Ensure the build command is `npm run build` and start command is `npm start`.
5. **Cron** — The hourly SLA deadline check (`/api/incidents/check-deadlines`) is configured in `vercel.json` but must be triggered separately on Railway (e.g. via a Railway cron service or an external cron like cron-job.org).

---

## Project structure

```
app/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── scripts/
│   └── ingest-eu-ai-act.ts   # RAG ingestion script
└── src/
    ├── app/
    │   ├── (auth)/            # Sign in, sign up, onboarding
    │   ├── (dashboard)/       # Main app pages
    │   └── api/               # API routes
    ├── components/            # React components
    └── lib/                   # Auth, DB, RAG, email, utils
```

---

## License

MIT
