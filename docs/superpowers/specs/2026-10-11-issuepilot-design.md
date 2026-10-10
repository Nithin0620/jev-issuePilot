# IssuePilot Design Specification

**Date:** 2026-10-11  
**Status:** Approved  
**Project:** IssuePilot — AI-Powered GitHub Issue Triage Platform  

---

## 1. Executive Summary & Goals

IssuePilot is an engineering-first, AI-driven issue triage platform built with Next.js, TypeScript, PostgreSQL, and Jev AI. Rather than wrapping a standard conversational chatbot, IssuePilot utilizes Jev's structured decision model (`typesafe/jev-1.13`) to return typed outputs:
- **Category:** `choice` classification (`bug`, `feature`, `question`, `other`) with probabilities and confidence scores.
- **Severity:** Rubric-based `score` (0–3 scale) with confidence.
- **Escalation:** `noul` (yes/no probability) estimating whether an issue describes an immediate critical outage or security incident.

The platform provides safety gates via explicit review thresholds, a human-in-the-loop review workflow, PostgreSQL audit logging, live GitHub Webhook ingestion, automated GitHub label synchronization, and containerized deployment with Docker. To enable 100% free development, automated testing, and CI without requiring paid API keys, IssuePilot includes an intelligent dual-mode architecture (Official `@typesafe-ai/sdk` with automatic fallback to a local heuristic mock engine).

---

## 2. System Architecture

```
       [ GitHub Repository ]
                 │
      (Issue opened event)
                 ▼
   POST /api/webhooks/github
   ├── Verify HMAC-SHA256 (GITHUB_WEBHOOK_SECRET)
   └── Deduplicate delivery (X-GitHub-Delivery)
                 │
                 │
                 ▼
[ Manual Form / Webhook Intake ]
                 │
                 ▼
        Next.js API & Services
        ├── /api/triage (Zod validation)
        │        │
        │        ▼
        │   AI Engine Layer (src/lib/jev.ts)
        │   ├── Live Mode: @typesafe-ai/sdk (Jev 1.13)
        │   └── Mock Mode: Local Heuristic Mock Classifier
        │        │
        │        ▼
        │   Policy Engine (src/lib/policy.ts)
        │   ├── Confidence threshold check (< 0.75)
        │   ├── Escalation threshold check (>= 0.85 -> critical)
        │   ├── Borderline escalation check (0.60 to 0.85 -> review)
        │   └── Team routing & Label generator
        │        │
        │        ▼
        │   Prisma ORM & PostgreSQL (src/lib/db.ts)
        │        │
        │        ├── If needsReview === false (High Confidence)
        │        │   └── Automatic GitHub Label Sync via REST API
        │        │
        │        └── If needsReview === true (Uncertain / Escalation)
        │            └── Hold in Review Queue for Human Approval
        │
        ├── /history Dashboard (Human Review & Override Queue)
        │    └── Approving / Overriding triggers GitHub Label Sync
        └── /api/health (System status, DB health, AI & GitHub sync mode)
```

---

## 3. Technology Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript 5+ (Strict Mode)
- **Styling:** Tailwind CSS
- **Input Validation:** Zod
- **AI SDK:** `@typesafe-ai/sdk` (with dual-mode Mock Engine fallback)
- **GitHub Integration:** GitHub REST API (`@octokit/rest` or native fetch) with HMAC webhook signature validation
- **ORM & Database:** Prisma 6 + PostgreSQL (compatible with local Docker and cloud Postgres providers like Supabase/Neon)
- **Testing:** Vitest
- **Containerization:** Multi-stage Dockerfile (`node:22-bookworm-slim`) & `compose.yaml`

---

## 4. AI Engine & Contract (`src/lib/jev.ts`)

### 4.1 Interface Contract
```typescript
export interface TriageResult {
  model: string;
  answers: {
    category: {
      choice: "bug" | "feature" | "question" | "other";
      confidence: number;
      probabilities: Record<string, number>;
    };
    severity: {
      score: number; // 0 to 3 scale
      confidence: number;
    };
    needs_escalation: {
      noul: number; // 0.0 to 1.0 probability
    };
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}
```

### 4.2 Dual-Mode Behavior
- If `TYPESAFE_API_KEY` is present and `MOCK_JEV` is not `"true"`, calls `client.systemOne` with:
  - `model`: `"typesafe/jev-1.13"`
  - `questions.category`: `choice(...)`
  - `questions.severity`: `score(...)`
  - `questions.needs_escalation`: `noul(...)`
- If `TYPESAFE_API_KEY` is absent or `MOCK_JEV="true"`, routes to `mockClassifyIssue()`.
  - Analyzes tokens for outages, errors, crashes, questions, and feature words.
  - Outputs calibrated probabilities and confidence ratings adhering strictly to `TriageResult`.
  - Produces deterministic, reproducible results for tests and local exploration.

---

## 5. Policy Engine & GitHub Labels (`src/lib/policy.ts`)

The raw AI outputs are evaluated by `applyPolicy(answers)`:

1. **Confidence Gate:**
   - If `category.confidence < 0.75` OR `severity.confidence < 0.75`, flag `needsReview = true`.
2. **Escalation & Priority Gate:**
   - If `needs_escalation.noul >= 0.85` $\to$ `priority = "critical"`
   - Else if `severity.score >= 2.5` $\to$ `priority = "high"`
   - Else if `severity.score >= 1.0` $\to$ `priority = "medium"`
   - Else $\to$ `priority = "low"`
3. **Borderline Escalation Gate:**
   - If `0.60 <= needs_escalation.noul < 0.85`, flag `needsReview = true` (potential emergency requiring human confirmation).
4. **Team Routing:**
   - `priority === "critical"` $\to$ `"Incident Response / Platform"`
   - `category === "bug"` $\to$ `"Core Engineering"`
   - `category === "feature"` $\to$ `"Product & UI"`
   - `category === "question"` $\to$ `"Developer Support"`
   - `other` $\to$ `"General Triage"`
5. **Generated GitHub Labels:**
   - Category label: `type:bug`, `type:feature`, `type:question`, `type:other`
   - Priority label: `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
   - Team label: `team:platform`, `team:core-eng`, `team:product`, `team:support`

---

## 6. Data Model & Persistence (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Issue {
  id                    String   @id @default(cuid())
  title                 String
  body                  String
  repository            String?  @default("default")

  // GitHub Metadata
  githubIssueNumber     Int?
  githubDeliveryId      String?  @unique
  githubSynced          Boolean  @default(false)
  appliedLabels         String[] @default([])

  // AI Decision Outputs
  category              String
  categoryConfidence    Float
  severity              Float
  severityConfidence    Float
  escalationProbability Float
  priority              String
  suggestedTeam         String   @default("Triage")
  rawProbabilities      Json?

  // Human Review & Operational Control
  needsReview           Boolean  @default(false)
  humanReviewed         Boolean  @default(false)
  humanCategory         String?
  humanPriority         String?
  humanNotes            String?

  // Model & Execution Metadata
  model                 String
  inputTokens           Int?
  outputTokens          Int?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([needsReview, humanReviewed])
  @@index([createdAt])
  @@index([repository, githubIssueNumber])
}
```

---

## 7. GitHub Integration Service (`src/lib/github.ts`)

- **Signature Verification:** Computes HMAC-SHA256 over raw request body using `GITHUB_WEBHOOK_SECRET` and performs timing-safe comparison with `X-Hub-Signature-256`.
- **Add Labels to Issue:** `POST /repos/{owner}/{repo}/issues/{issue_number}/labels` using `GITHUB_TOKEN`. If `GITHUB_TOKEN` is not configured, logs the would-be labels safely in mock/simulation mode without failing.
- **Auto-Sync Logic:**
  - If `needsReview === false`: Automatically applies labels immediately upon triage.
  - If `needsReview === true`: Holds labels in pending state until human reviewer approves in `/history`.

---

## 8. API Routes & Endpoints

1. **`POST /api/webhooks/github`**
   - Validates HMAC signature and filters for `action === "opened"` on `issues`.
   - Checks `X-GitHub-Delivery` for deduplication.
   - Executes triage pipeline and persists to PostgreSQL.
   - If `needsReview === false`, automatically pushes labels to GitHub issue.
2. **`POST /api/triage`**
   - Manual intake endpoint validating `{ title, body, repository? }` with Zod.
   - Executes triage pipeline and returns full decision payload.
3. **`GET /api/issues`**
   - Query params: `needsReview` (boolean), `limit`, `offset`.
   - Returns list of persisted issues and review counts.
4. **`PATCH /api/issues/[id]/review`**
   - Body: `{ action: "approve" | "override", humanCategory?, humanPriority?, humanNotes? }`.
   - Updates `humanReviewed = true`.
   - Synchronizes final confirmed labels to GitHub if `githubIssueNumber` and `repository` exist.
5. **`GET /api/health`**
   - Checks DB readiness and reports active AI provider and GitHub sync status.

---

## 9. Frontend Pages & Components

- **`src/app/page.tsx`:** Triage console with sample presets (Critical Outage, Ambiguous Bug, Feature Request, Question), manual submission form, and responsive live decision card.
- **`src/app/history/page.tsx`:** Decision audit table with tabbed navigation:
  - *Needs Review* tab (filtered to `needsReview=true && humanReviewed=false`).
  - *All History* tab.
  - Review action drawer/modal with "Approve & Sync to GitHub" or "Override & Sync".
- **`src/components/IssueForm.tsx`**, **`src/components/DecisionCard.tsx`**, **`src/components/HistoryTable.tsx`**.

---

## 10. Testing & Verification

- **Policy Tests (`tests/policy.test.ts`):**
  - Confirms low confidence ($< 0.75$) triggers review.
  - Confirms borderline escalation ($0.60 \le p < 0.85$) triggers review.
  - Confirms high escalation ($\ge 0.85$) yields `critical` priority.
  - Verifies label generation and team routing.
- **Triage & Validation Tests (`tests/triage.test.ts`):**
  - Validates Zod rejection on invalid input.
  - Verifies mock classifier schema compatibility with Jev SDK.
- **Webhook Tests (`tests/webhook.test.ts`):**
  - Verifies signature verification accepts valid HMAC and rejects forged payloads.

---

## 11. Containerization & Production Readiness

- **Dockerfile:** Multi-stage Node 22 build with non-root security (`nextjs` UID 1001).
- **compose.yaml:** Orchestrates PostgreSQL 16 container (with healthcheck) and app container.
- **Environment Management:** `.env.example` documents all parameters; `.gitignore` guards sensitive credentials (`TYPESAFE_API_KEY`, `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`).
