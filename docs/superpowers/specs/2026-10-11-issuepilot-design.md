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

The platform provides safety gates via explicit review thresholds, a human-in-the-loop review workflow, PostgreSQL audit logging, and containerized deployment with Docker. To enable 100% free development, automated testing, and CI without requiring paid API keys, IssuePilot includes an intelligent dual-mode architecture (Official `@typesafe-ai/sdk` with automatic fallback to a local heuristic mock engine).

---

## 2. System Architecture

```
[ Developer / Issue Reporter ]
              │
       (HTTP / Browser)
              ▼
    Next.js UI & API Layer
    ├── Issue Submission Form (Manual Intake with Presets)
    ├── /api/triage (Validation with Zod)
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
    │   └── Team routing logic
    │        │
    │        ▼
    │   Prisma ORM & PostgreSQL (src/lib/db.ts)
    │   └── Decision Audit Logging & Human Overrides
    │
    ├── /history (Decision Audit & Human Review Queue)
    │    ├── Review Queue (needsReview = true & humanReviewed = false)
    │    └── Human Override & Review Modal (Accept / Override)
    └── /api/health (System status, DB health, AI mode check)
```

---

## 3. Technology Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript 5+ (Strict Mode)
- **Styling:** Tailwind CSS
- **Input Validation:** Zod
- **AI SDK:** `@typesafe-ai/sdk` (with dual-mode Mock Engine fallback)
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
      score: number;
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

## 5. Policy Engine & Review Rules (`src/lib/policy.ts`)

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
}
```

---

## 7. API Routes & Endpoints

1. **`POST /api/triage`**
   - Validates `{ title, body, repository? }` with Zod (`title` min 5 max 200, `body` min 10 max 8000).
   - Invokes triage engine (Jev or Mock).
   - Applies policy.
   - Persists issue record into PostgreSQL.
   - Returns `{ id, model, answers, policy, createdAt }`.
2. **`GET /api/issues`**
   - Query params: `needsReview` (boolean), `limit`, `offset`.
   - Returns list of persisted issues and review counts.
3. **`PATCH /api/issues/[id]/review`**
   - Body: `{ action: "approve" | "override", humanCategory?, humanPriority?, humanNotes? }`.
   - Updates `humanReviewed = true` and saves corrections.
4. **`GET /api/health`**
   - Checks DB readiness and reports active AI provider mode (`live` or `mock`).

---

## 8. Frontend Pages & Components

- **`src/app/page.tsx`:** Triage console with sample preset buttons, issue submission form, and responsive live decision card displaying confidence bars, severity gauges, and review alerts.
- **`src/app/history/page.tsx`:** Decision audit table with tabbed navigation:
  - *Needs Review* tab (filtered to `needsReview=true && humanReviewed=false`).
  - *All History* tab.
  - Review action drawer/modal to confirm AI or submit human corrections.
- **`src/components/IssueForm.tsx`**, **`src/components/DecisionCard.tsx`**, **`src/components/HistoryTable.tsx`**.

---

## 9. Testing & Verification

- **Policy Tests (`tests/policy.test.ts`):**
  - Confirms low confidence ($< 0.75$) triggers review.
  - Confirms borderline escalation ($0.60 \le p < 0.85$) triggers review.
  - Confirms high escalation ($\ge 0.85$) yields `critical` priority.
  - Verifies severity mapping and team routing.
- **Triage & Validation Tests (`tests/triage.test.ts`):**
  - Validates Zod rejection on short titles/bodies.
  - Verifies mock classifier schema compatibility with Jev SDK.

---

## 10. Containerization & Production Readiness

- **Dockerfile:** Multi-stage Node 22 build with non-root security (`nextjs` UID 1001).
- **compose.yaml:** Orchestrates PostgreSQL 16 container (with healthcheck) and app container.
- **Environment Management:** `.env.example` documents all parameters; `.gitignore` guards sensitive credentials.
