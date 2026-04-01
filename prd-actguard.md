# PRD: ActGuard — EU AI Act Compliance Suite

> **Product Name:** ActGuard
> **Tagline:** "Compliance before the clock runs out."
> **Author:** Varun Tyagi
> **Date:** March 30, 2026
> **Build Tool:** Claude Code (Ralph Loop methodology)
> **Status:** Ready for Phase 1
> **Deadline context:** EU AI Act high-risk enforcement begins August 2, 2026 (124 days)

---

## 1. Product vision

A single platform where any company deploying AI in the EU can classify their systems, generate compliance documentation, and manage incident reporting obligations. Two modules that work independently but share a unified backend.

**The problem:** 40% of EU AI startups cannot classify their own risk tier. The existing EU compliance checker is a basic questionnaire. Fines reach up to EUR 35M or 7% of global annual turnover. High-risk AI system requirements under Annex III enter full enforcement on August 2, 2026.

**Module 1 — Compliance-as-a-Service (CaaS):** Takes an AI system description and walks the user through risk classification, generates required technical documentation (Article 11), risk management plans (Article 9), data governance records (Article 10), and conformity assessment checklists. Outputs audit-ready PDF packages.

**Module 2 — AI Incident Reporting System (AIRS):** When a high-risk AI system causes or contributes to a serious incident, providers must report to national authorities within 24 hours (Article 72). AIRS is the ticketing system for this: structured intake, severity classification, authority routing per member state, SLA tracking, remediation workflows, and audit trail generation.

---

## 2. Target users

- AI providers (companies building and selling AI systems in the EU market)
- AI deployers (companies using third-party AI in professional capacity)
- Compliance officers and DPOs at mid-to-large enterprises
- Startups building AI products who need to prove compliance for investor due diligence
- Legal and advisory firms helping clients prepare for EU AI Act enforcement

---

## 3. Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), Tailwind CSS, shadcn/ui |
| Backend | Next.js API routes + Supabase Edge Functions |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | Supabase Auth (email + Google SSO) |
| AI | Claude API (claude-sonnet-4-20250514) for classification and doc generation |
| RAG | Supabase pgvector for EU AI Act text, EFSA guidelines, GDPR cross-refs |
| PDF generation | React-PDF (@react-pdf/renderer) for audit-ready exports |
| File storage | Supabase Storage for generated documents and uploads |
| Deployment | Vercel (frontend) + Supabase (backend) |
| Monitoring | Vercel Analytics + Sentry |

---

## 4. Database schema

```sql
-- organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','pro','enterprise'))
);

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  org_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin','compliance_officer','viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ai_systems (the AI systems being assessed)
CREATE TABLE ai_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  purpose TEXT,
  intended_use TEXT,
  risk_tier TEXT DEFAULT 'unclassified' CHECK (risk_tier IN ('unacceptable','high','limited','minimal','unclassified')),
  classification_reasoning TEXT,
  data_types_processed TEXT[],
  affected_populations TEXT[],
  deployment_member_states TEXT[], -- ISO 2-letter codes
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','classified','documenting','compliant','review_needed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- compliance_documents (generated documentation)
CREATE TABLE compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_system_id UUID REFERENCES ai_systems(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'technical_doc','risk_management_plan','data_governance',
    'conformity_assessment','transparency_info','human_oversight_plan'
  )),
  content JSONB NOT NULL,
  version INT DEFAULT 1,
  generated_at TIMESTAMPTZ DEFAULT now(),
  generated_by UUID REFERENCES users(id)
);

-- incidents (Article 72 incident reports)
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  ai_system_id UUID REFERENCES ai_systems(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical','major','minor')),
  incident_date TIMESTAMPTZ NOT NULL,
  reported_at TIMESTAMPTZ,
  reporting_deadline TIMESTAMPTZ NOT NULL, -- incident_date + 24 hours
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','acknowledged','investigating','resolved','closed')),
  member_state VARCHAR(2),
  authority_name TEXT,
  authority_contact TEXT,
  root_cause TEXT,
  remediation_steps TEXT[],
  resolution_notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- incident_timeline (audit trail)
CREATE TABLE incident_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created','updated','submitted','authority_response','escalated','resolved'
  )),
  description TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- compliance_checklists
CREATE TABLE compliance_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_system_id UUID REFERENCES ai_systems(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL,
  items JSONB NOT NULL,
  completion_percentage FLOAT DEFAULT 0,
  last_reviewed TIMESTAMPTZ
);

-- rag_documents (EU AI Act knowledge base)
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'eu_ai_act', 'gdpr', 'efsa', 'guidance'
  article_ref TEXT, -- 'Article 11', 'Recital 47'
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB
);

-- national_authorities (EU member state competent authorities)
CREATE TABLE national_authorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(2) NOT NULL,
  country_name TEXT NOT NULL,
  authority_name TEXT NOT NULL,
  contact_email TEXT,
  submission_url TEXT,
  phone TEXT,
  notes TEXT
);
```

Enable RLS on all tables with org_id-scoped policies. Create indexes on:
- `ai_systems(org_id, status)`
- `incidents(org_id, status, reporting_deadline)`
- `rag_documents` using ivfflat for vector search
- `compliance_documents(ai_system_id, doc_type)`

---

## 5. Module 1 features: Compliance-as-a-Service

### P0 — Must have for launch

| Feature | Description | Effort |
|---------|------------|--------|
| AI system intake wizard | Multi-step form: system name, description, purpose, data types, affected populations, deployment context. Saved as draft, editable. | 2 days |
| Risk classification engine | Claude API analyses system description against Article 6 and Annex III criteria. Returns risk tier with reasoning. User can override with justification. | 3 days |
| Technical documentation generator | Generates Article 11 technical documentation: system description, design specs, development process, performance metrics, risk management measures. Outputs as structured JSONB, exportable as PDF. | 4 days |
| Risk management plan | Generates Article 9 risk management system: risk identification, estimation, evaluation, mitigation measures, residual risks. Iterative document. | 3 days |
| RAG-powered guidance | Vector search over full EU AI Act text, recitals, and EFSA/GDPR cross-references. Contextual help at every step. | 3 days |
| PDF export engine | Generate professional audit-ready PDF packages with table of contents, version history, and digital signatures placeholder. | 2 days |
| Compliance dashboard | Overview of all AI systems, their risk tiers, documentation completion, and upcoming deadlines. | 2 days |

### P1 — Important

| Feature | Description | Effort |
|---------|------------|--------|
| Data governance record | Article 10 compliance: data collection practices, preprocessing, bias detection, data quality measures, representativeness assessment. | 2 days |
| Conformity assessment checklist | Interactive checklist per Article 43. Tracks completion percentage. Export as compliance evidence. | 2 days |
| Human oversight plan | Article 14: measures for human oversight, override capabilities, operator training requirements. | 2 days |
| Transparency disclosures | Article 13: generates user-facing transparency information about the AI system capabilities and limitations. | 1 day |

### P2 — Nice to have

| Feature | Description | Effort |
|---------|------------|--------|
| Multi-org support | Consultants can manage multiple client organisations from one account. | 3 days |
| Compliance timeline view | Visual Gantt-style timeline showing all deadlines and milestones per AI system. | 2 days |
| Template library | Pre-built templates for common AI system types (chatbot, recommendation engine, hiring tool, credit scoring). | 2 days |

---

## 6. Module 2 features: AI Incident Reporting System

### P0 — Must have for launch

| Feature | Description | Effort |
|---------|------------|--------|
| Incident intake form | Structured form: affected AI system, incident date/time, description, severity, impact assessment, affected individuals count, immediate actions taken. | 2 days |
| Severity classification | Auto-classify severity based on impact (death, serious harm, fundamental rights violation, property damage). Claude-assisted with human override. | 2 days |
| 24-hour SLA tracker | Visual countdown timer from incident detection to reporting deadline. Escalation alerts at 12h, 6h, 2h, 30min remaining. | 1 day |
| Member state authority router | Database of national competent authorities across all 27 EU member states. Auto-selects correct authority based on deployment location. | 2 days |
| Incident timeline | Chronological audit trail of every action taken: creation, updates, submissions, authority responses, escalations, resolution. | 1 day |
| Report generator | Generates formatted incident report matching Article 72 requirements. Pre-fills from incident data. Exportable as PDF. | 2 days |

### P1 — Important

| Feature | Description | Effort |
|---------|------------|--------|
| Remediation workflow | Track root cause analysis, corrective actions, preventive measures, and verification steps. Assign owners and deadlines. | 2 days |
| Authority communication log | Record all communications with national authorities: submissions, acknowledgements, requests for information, final determinations. | 1 day |
| Email/Slack notifications | Alert relevant stakeholders on new incidents, approaching deadlines, and status changes. | 1 day |

### P2 — Nice to have

| Feature | Description | Effort |
|---------|------------|--------|
| Incident analytics | Dashboard showing incident trends, MTTR, common root causes, systems with highest incident rates. | 2 days |
| Incident simulation | Run tabletop exercises: create mock incidents and practice the reporting workflow. Training mode. | 2 days |

---

## 7. Claude Code build plan

### Phase 1: Foundation (Sessions 1-4)

#### Session 1: Project scaffold and auth

```
Create a Next.js 14 app with App Router, Tailwind CSS, and shadcn/ui.
Set up Supabase project with auth (email + Google SSO).
Create the database schema from Section 4 of this PRD. Include ALL tables: organizations, users, ai_systems, compliance_documents, incidents, incident_timeline, compliance_checklists, rag_documents, national_authorities.
Enable Row Level Security on all tables with org_id-scoped policies.
Seed the national_authorities table with all 27 EU member state competent authorities (name, country_code, contact where available).
Create a landing page with sign-up/login flow.
After auth, create organisation setup flow (name, slug).
Redirect to /dashboard after setup.
Navigation structure: Dashboard | AI Systems | Incidents | Reports | Settings
Use environment variables for all Supabase keys and Claude API key.
Git commit after each major step.
```

#### Session 2: AI system intake wizard

```
Build /systems page listing all AI systems for the organisation.
  - Empty state with "Register your first AI system" CTA
  - Table view: name, risk tier (color-coded badge), status, doc completion %, last updated
  - Click row to go to system detail page

Build /systems/new with a multi-step intake wizard:
  Step 1 — Basic info:
    - System name (required)
    - Description (textarea, required, min 100 chars)
    - Purpose and intended use (textarea)
  Step 2 — Data and users:
    - Data types processed (multi-select checkboxes): personal data, biometric, health, financial, criminal, children's data, location, behavioural, none
    - Affected populations (multi-select): employees, consumers, patients, students, job applicants, general public, vulnerable groups
    - Scale of deployment: number of users/decisions per day
  Step 3 — Deployment context:
    - Member states of deployment (multi-select of EU27)
    - Integration with other systems (text description)
    - Human oversight level: full automation, human-in-the-loop, human-on-the-loop, human-in-command
  Step 4 — Review and save:
    - Summary of all inputs
    - "Save as draft" and "Save and classify" buttons

Save to ai_systems table with status='draft' if saved as draft, or trigger classification if "Save and classify" is clicked.
```

#### Session 3: Risk classification engine

```
Build the classification flow triggered from:
  a) The "Save and classify" button in the wizard
  b) A "Classify" button on the system detail page

Send system data to Claude API with this system prompt:
  "You are an EU AI Act risk classification expert. You have deep knowledge of Regulation (EU) 2024/1689, particularly Article 5 (prohibited practices), Article 6 (classification rules for high-risk), Annex I (EU harmonisation legislation), and Annex III (high-risk AI system areas).

  Given the following AI system description, classify it into one of four risk tiers:
  - UNACCEPTABLE (Article 5): social scoring, real-time biometric identification in public, manipulation of vulnerable groups, emotion recognition in workplace/education
  - HIGH (Article 6 + Annex III): biometric identification, critical infrastructure management, education/vocational training assessment, employment/worker management, essential services access (credit, insurance), law enforcement, migration/border control, justice/democratic processes
  - LIMITED (Article 50): chatbots, emotion recognition, deepfakes, biometric categorisation (with transparency obligations only)
  - MINIMAL: all other AI systems (no mandatory requirements, voluntary codes of conduct)

  Return a JSON object with:
  {
    tier: 'unacceptable' | 'high' | 'limited' | 'minimal',
    confidence: 0.0-1.0,
    reasoning: 'Detailed paragraph explaining why this tier was selected',
    relevant_articles: ['Article 6(2)', 'Annex III point 4'],
    key_risk_factors: ['Processes biometric data', 'Used in employment decisions'],
    annex_iii_category: 'Category name if high-risk, null otherwise',
    obligations_summary: ['List of key obligations for this risk tier']
  }"

Display results on the system detail page:
  - Large risk tier badge with color coding (red=unacceptable, orange=high, yellow=limited, green=minimal)
  - Confidence bar (0-100%)
  - Reasoning paragraph
  - Relevant articles as clickable links (link to RAG lookup in Session 4)
  - Key risk factors as tags
  - Obligations summary as checklist items

Allow user to:
  - Accept the classification (updates ai_systems.risk_tier and status='classified')
  - Override with different tier (requires justification text, saved to classification_reasoning)
  - Re-classify (re-run with updated system description)
```

#### Session 4: RAG setup for EU AI Act guidance

```
Build the RAG knowledge base:
  - Create a Supabase Edge Function that:
    1. Accepts text content and generates embeddings via OpenAI text-embedding-3-small
    2. Stores in rag_documents table

  - Seed script that ingests the EU AI Act:
    - Chunk by article (each article = one document)
    - Include recitals as separate documents
    - Metadata: article number, chapter, title, risk_tier_relevance
    - Source: artificialintelligenceact.eu full text (can be manually prepared as JSON)
    - Generate embeddings for each chunk

Build the contextual help system:
  - Search function: given a query, find top 5 relevant articles via pgvector cosine similarity
  - Contextual help sidebar component:
    - Appears on the right side of the intake wizard and classification pages
    - Auto-queries based on current step context (e.g., when user selects "biometric data", search for biometric-related articles)
    - Shows: article number, title, relevant excerpt, similarity score
    - Click to expand full article text
  - Search bar at top of sidebar for manual queries

Test with queries:
  - "what are high-risk AI systems"
  - "incident reporting requirements"
  - "biometric identification rules"
  - "transparency obligations for chatbots"
  - "data governance requirements Article 10"
```

### Phase 2: Document generation (Sessions 5-8)

#### Session 5: Technical documentation generator

```
Build /systems/[id]/documents page:
  - List all compliance documents for this system
  - Status badges: not started, in progress, complete
  - "Generate" button for each document type
  - Click document to view/edit

Build the Article 11 technical documentation generator:
  - Pull system data from ai_systems table
  - Send to Claude API with structured prompt requesting each section:
    1. General description of the AI system (auto-filled from system data)
    2. Detailed description of elements and development process
    3. Information about monitoring, functioning and control
    4. Description of the risk management system (links to risk management plan)
    5. Data requirements and data governance measures
    6. Performance metrics, robustness and cybersecurity measures
    7. Description of foreseeable misuse scenarios and prevention measures
    8. Human oversight measures
    9. Expected lifetime and maintenance procedures

  - System prompt for Claude:
    "You are an EU AI Act compliance documentation specialist. Generate technical documentation per Article 11 requirements for the following AI system. Each section must be specific, actionable, and auditable — not generic boilerplate. Reference the system's actual data types, deployment context, and risk factors. Flag any sections where additional information from the provider is needed with [ACTION REQUIRED: description]."

  - Save structured output to compliance_documents as JSONB (each section = key in JSON)
  - Render as a formatted document preview with section navigation
  - Allow inline editing of any section (rich text editor)
  - Version tracking: increment version on save, keep previous versions accessible
  - "Regenerate section" button for individual sections
```

#### Session 6: Risk management and data governance docs

```
Build the Article 9 risk management plan generator:
  - Pull system data and classification results
  - Send to Claude API requesting:
    1. Known and foreseeable risks to health, safety, fundamental rights
    2. Risk estimation: probability x severity matrix (generate a 4x4 matrix)
    3. Risk evaluation against acceptable thresholds
    4. Mitigation measures for each identified risk (specific to this system)
    5. Residual risk assessment after mitigation
    6. Testing and validation procedures
    7. Post-market monitoring plan
    8. Risk documentation and review schedule

  - Display as structured document with the risk matrix rendered as a visual table
  - Each risk item: description, probability (1-5), severity (1-5), risk score, mitigation, residual risk
  - Allow adding, editing, and removing individual risks
  - Save to compliance_documents

Build the Article 10 data governance record:
  - Prompt Claude with system data requesting:
    1. Data collection methods and sources
    2. Data preprocessing and annotation procedures
    3. Relevant data preparation operations (cleaning, labelling)
    4. Formulation of assumptions about data representativeness
    5. Assessment of availability, quantity, and suitability of data
    6. Bias examination and detection measures
    7. Gap identification and mitigation procedures
    8. Data protection impact assessment integration

  - Render as structured document
  - Inline editing and versioning
  - Save to compliance_documents
```

#### Session 7: PDF export engine

```
Build the PDF generation system using React-PDF (@react-pdf/renderer):
  - Professional template design:
    - Cover page: organisation name/logo placeholder, document title, AI system name, version, date, classification badge
    - Table of contents (auto-generated from sections)
    - Version history table (all versions with dates and editors)
    - Section headers with article references
    - Page numbers in footer
    - "Generated by ActGuard" watermark in footer
    - Professional typography: serif headings, sans body text

  - Support three export modes:
    1. Individual document: export one compliance document as PDF
    2. Full compliance package: all documents for one AI system in a single PDF with divider pages
    3. Executive summary: 2-page overview with classification, completion status, and key findings

  - "Download" button on each document and "Download compliance package" on system detail page
  - Store generated PDFs in Supabase Storage with signed URLs (7-day expiry)
  - Email delivery option: send PDF to specified email addresses
```

#### Session 8: Compliance dashboard and checklists

```
Build the main compliance dashboard at /dashboard:
  - Summary cards:
    - Total AI systems registered
    - Systems by risk tier (mini bar chart: high X, limited Y, minimal Z)
    - Documentation completion (overall percentage)
    - Days until August 2, 2026 deadline (countdown)
    - Open incidents count
  - Systems table with visual status indicators:
    - Green: all P0 documents complete
    - Amber: some documents complete
    - Red: classified as high-risk with no documents
  - Upcoming deadlines panel (contract renewals, incident follow-ups)
  - Recent activity feed (documents generated, classifications, incidents)

Build the conformity assessment checklist (Article 43):
  - Interactive checklist stored as JSONB in compliance_checklists
  - Items grouped by category:
    - Documentation (Article 11): technical doc, risk management, data governance
    - Quality management (Article 17): policies, procedures, accountability
    - Monitoring (Article 72): post-market monitoring, incident reporting
    - Transparency (Article 13): user-facing disclosures, instructions for use
    - Record keeping (Article 12): automatic logging, traceability
  - Checkbox for each item with completion tracking
  - Overall completion percentage bar
  - Export checklist as PDF evidence document
  - "What does this mean?" help tooltip on each item (powered by RAG)
```

### Phase 3: Incident reporting (Sessions 9-12)

#### Session 9: Incident intake and severity classification

```
Build /incidents page showing all incidents for the organisation:
  - Table: title, AI system, severity badge, status, reporting deadline, time remaining
  - Sort by deadline (most urgent first)
  - Filter by status, severity, AI system
  - "Report new incident" button

Build /incidents/new with the structured intake form:
  - Affected AI system (dropdown from ai_systems, required)
  - Incident date and time (datetime picker with timezone, required)
  - Title (short description, required)
  - Full description (rich text, required)
  - Impact type (checkboxes, at least one required):
    - Death
    - Serious injury to health
    - Serious and irreversible disruption of critical infrastructure
    - Breach of fundamental rights obligations
    - Serious damage to property
    - Serious harm to environment
    - Other serious harm
  - Number of affected individuals (number input)
  - Immediate actions taken (textarea)
  - Evidence uploads (optional file uploads to Supabase Storage)

Auto-classify severity using Claude API:
  "Given this AI incident description, classify severity as:
  - CRITICAL: death, serious injury, or irreversible infrastructure disruption
  - MAJOR: fundamental rights breach, significant property damage, or widespread impact
  - MINOR: limited impact, contained harm, no serious injury
  Return JSON: { severity, reasoning, recommended_urgency, reporting_required: boolean }"

Calculate reporting_deadline = incident_date + 24 hours.
Save to incidents table. Auto-create first incident_timeline entry.
Redirect to incident detail page.
```

#### Session 10: SLA tracker and authority routing

```
Build the 24-hour countdown component on incident detail page:
  - Large visual timer showing HH:MM:SS remaining until reporting deadline
  - Color coding: green (>12h), amber (6-12h), red (<6h), pulsing red (<2h)
  - If deadline passed: show "OVERDUE by HH:MM" in red
  - Progress bar showing elapsed time vs total 24h window

Build notification triggers (Supabase Edge Functions):
  - At 12h remaining: email to incident creator + org admins
  - At 6h remaining: email + Slack (if configured)
  - At 2h remaining: email + Slack + urgent flag on dashboard
  - At 30min remaining: final warning
  - At 0h (deadline passed): overdue alert

Build the member state authority routing:
  - Seed the national_authorities table with all 27 EU member states:
    - Germany: BfDI (data protection) / BNetzA (telecom) — authority depends on sector
    - France: CNIL + ARCEP
    - Netherlands: AP (Autoriteit Persoonsgegevens)
    - Spain: AEPD
    - Italy: Garante + AGCOM
    - etc. (research and populate all 27)
  - Auto-select authority based on ai_systems.deployment_member_states
  - If multiple member states: show all relevant authorities
  - Display on incident detail page: authority name, contact email, submission URL
  - Allow manual override if incident spans jurisdictions

Build the incident timeline:
  - Auto-log events: creation, every field update, status changes, file uploads
  - Manual log entries: "Add update" button for phone calls, meetings, external communications
  - Each entry: timestamp, event type badge, description, user attribution
  - Chronological display (newest first, toggle to oldest first)
  - Export timeline as PDF for audit evidence
```

#### Session 11: Report generation and notifications

```
Build the Article 72 incident report generator:
  - Pre-fill all fields from incident data
  - Structured sections following Article 72 requirements:
    1. Provider identification (org name, contact)
    2. AI system identification (name, risk tier, registration number)
    3. Incident description (date, circumstances, discovery method)
    4. Impact assessment (affected individuals, severity, geographic scope)
    5. Root cause analysis (if known, or "under investigation")
    6. Corrective actions taken (immediate response)
    7. Preventive measures planned
    8. Communication to affected individuals (if applicable)
  - Claude API assistance for root cause analysis:
    "Given this AI incident description, suggest 3-5 possible root causes based on common AI system failure modes. For each, suggest investigation steps."
  - Editable before submission
  - "Generate draft" and "Finalise report" buttons
  - Export as PDF in format suitable for authority submission
  - Track submission status in incident record

Build the notification system:
  - Supabase Edge Function for email notifications via Resend
  - Notification triggers:
    - New incident created: email to org admins
    - Deadline approaching: escalating urgency (see Session 10)
    - Status changes: email to incident creator and assignees
    - Authority response logged: email to incident creator
  - Webhook support for Slack integration:
    - /settings/integrations: enter Slack webhook URL
    - Format messages with severity badge, incident title, time remaining
  - Notification preferences per user at /settings/notifications
```

#### Session 12: Remediation workflow and analytics

```
Build the remediation workflow on incident detail page (below timeline):
  - Root cause analysis section:
    - Free text input
    - "Get AI suggestions" button (Claude-assisted based on incident description)
    - Status: investigating / identified / confirmed
  - Corrective actions table:
    - Columns: action description, owner (dropdown of org users), deadline, status (not started / in progress / complete / verified)
    - "Add action" button
    - Completion tracking
  - Preventive measures table (same structure as corrective actions)
  - Verification checklist:
    - For each corrective/preventive action: checkbox "Effectiveness verified"
    - Verification notes textarea
  - Resolution summary:
    - Free text for final resolution notes
    - Lessons learned textarea
    - "Resolve incident" button (requires all actions complete, sets status='resolved')

Build the incident analytics dashboard at /incidents/analytics:
  - Incidents over time (Recharts line chart, last 12 months)
  - Incidents by severity (Recharts pie chart)
  - Mean time to report vs 24h SLA (bar chart with red line at 24h)
  - Mean time to resolution (bar chart by month)
  - Most common root causes (horizontal bar chart, top 10)
  - AI systems with highest incident rates (table)
  - Compliance scorecard: % reported within 24h, % resolved within 30 days
  - Export analytics as PDF for board/audit reporting
```

---

## 8. Authentication and security

- Supabase Auth with email/password and Google SSO
- Row Level Security on all tables scoped to org_id
- Role-based access: admin (full access), compliance_officer (read/write systems and docs), viewer (read only)
- API routes protected with Supabase middleware auth check
- Claude API key stored in environment variables, never exposed to client
- All generated documents stored in Supabase Storage with signed URLs (7-day expiry)
- GDPR-compliant: data deletion endpoint for right to erasure requests
- Audit log of all document generation, classification, and incident actions
- All incident data encrypted at rest (Supabase default) and in transit (TLS)

---

## 9. Monetisation

| | Free | Pro (EUR 99/mo) | Enterprise (EUR 499/mo) |
|---|---|---|---|
| AI systems | 1 | 10 | Unlimited |
| Risk classification | Yes | Yes | Yes |
| Document generation | 1 per system | Unlimited | Unlimited |
| Incident reporting | No | Yes | Yes |
| PDF export | No | Yes | Yes |
| RAG guidance | Basic (3 queries/day) | Unlimited | Unlimited |
| Multi-org support | No | No | Yes |
| Conformity checklists | No | Yes | Yes |
| Incident analytics | No | No | Yes |
| Priority support | No | Email | Email + onboarding call |

---

## 10. Success metrics

- **Adoption:** 300 organisations registered within 90 days of launch
- **Activation:** 60% of users who register classify at least one AI system within 7 days
- **Conversion:** 15% of free users upgrade to Pro within 30 days
- **Documentation:** Average user generates 3+ compliance documents per AI system
- **Incident readiness:** 80% of Pro+ users create at least one incident report (even as simulation)
- **Deadline pressure:** Track registration spike as August 2 approaches

---

## 11. Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| AI Act text changes or guidance updates | Design RAG system for easy re-ingestion. Monitor EU AI Office publications. Versioned knowledge base. |
| Classification accuracy questioned | Clear confidence scores. User override with justification. Disclaimer that tool assists but does not replace legal advice. |
| Companies wait until last minute | Marketing push: "X days until enforcement" countdown. Free tier to lower barrier. Case studies showing prep time needed. |
| Legal liability concerns | Terms of service: tool provides guidance, not legal advice. Recommend legal review of all generated documentation. |
| Competition from Big 4 consulting firms | Price advantage (EUR 99/mo vs EUR 50K+ consulting engagement). Speed advantage (documents in minutes vs weeks). Self-serve vs engagement-dependent. |
| Digital Omnibus may delay high-risk deadlines | Build for August 2026 deadline regardless. If delayed, the product still works — compliance is still needed, just with more time. |
