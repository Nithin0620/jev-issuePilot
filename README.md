# IssuePilot — AI-Powered GitHub Issue Triage Platform

IssuePilot is a production-style issue triage platform built with **Next.js 15, TypeScript, PostgreSQL, Prisma, Docker, and Jev AI (`@typesafe-ai/sdk`)**.

Rather than wrapping a conversational chatbot, IssuePilot integrates Jev's structured decision model (`typesafe/jev-1.13`) to return typed answers, probabilities, and confidence ratings:
- **Category:** `choice` classification (`bug`, `feature`, `question`, `other`) with calibrated category probabilities.
- **Severity Impact:** Rubric-based `score` (0 to 3 scale) with confidence.
- **Escalation Detection:** `noul` (yes/no probability) estimating whether an issue is an immediate critical outage or security incident.
- **Safety Review Gates:** Automatically flags decisions with low confidence (<75%) or borderline escalation (60%–85%) for human review.
- **GitHub Sync:** Ingests live issues via verified webhooks (HMAC-SHA256) and synchronizes labels back to GitHub upon automatic routing or human approval.

---

## Architecture

```
       [ GitHub Repository ]
                 │
       (Issue opened event)
                 ▼
   POST /api/webhooks/github
   ├── Verify HMAC-SHA256 (GITHUB_WEBHOOK_SECRET)
   └── Deduplicate delivery (X-GitHub-Delivery)
                 │
                 ▼
[ Manual Form / Webhook Intake ]
                 │
                 ▼
        Next.js API & Services
        ├── /api/triage (Zod validation + Rate Limiter)
        │        │
        │        ▼
        │   AI Engine Layer (src/lib/jev.ts)
        │   ├── Live Mode: @typesafe-ai/sdk (Jev 1.13)
        │   └── Mock Mode: Local Deterministic Mock Classifier
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
        └── /metrics Dashboard (Live Decision Telemetry & Benchmarking)
```

---

## Key Features

1. **Dual-Mode AI Provider:**
   - **Live Jev Mode:** Reads `TYPESAFE_API_KEY` and calls `client.systemOne({ model: "typesafe/jev-1.13", ... })`.
   - **Local Heuristic Mock Mode:** Operates automatically when no API key is provided (`MOCK_JEV=true`), allowing zero-cost local development and offline CI runs.
2. **Safety Review Gates & Thresholds:**
   - Decisions with category or severity confidence below 75% are routed to the human review inbox.
   - Borderline escalation probabilities (60% to 85%) trigger review to prevent false alarms.
3. **Monochrome Animated UI:**
   - High-contrast, minimalist Black & White / Grayscale aesthetic with smooth theme transitions between Light and Dark mode.
4. **Live GitHub Webhook & Label Sync:**
   - Signature verification using constant-time `crypto.timingSafeEqual`.
   - Automatic labeling on high confidence; human-gated labeling for uncertain cases.
5. **Multi-Provider Authentication:**
   - NextAuth supporting GitHub OAuth, Google OAuth, and credentials login (`admin@issuepilot.local` / `admin123`).
6. **Decision Telemetry & Benchmark Suite:**
   - Built-in evaluation dataset (`data/evaluation-benchmark.json`) measuring accuracy, precision, recall, and review rates via `npm run evaluate`.

---

## Quickstart

### Prerequisites
- Node.js 22 or newer
- Docker & Docker Compose

### 1. Clone & Install
```bash
git clone https://github.com/your-username/issuepilot.git
cd issuepilot
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start PostgreSQL with Docker
```bash
docker compose up -d db
```

### 4. Run Migrations & Start App
```bash
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Quality Assurance

Run the automated test suite:
```bash
npm test
```
All 18 unit and integration tests verify:
- Confidence gating and priority assignments (`tests/policy.test.ts`)
- Jev dual-mode engine schema compliance (`tests/triage.test.ts`)
- GitHub HMAC webhook signature validation & label simulation (`tests/github.test.ts`)
- Webhook route handling and delivery deduplication (`tests/webhook.test.ts`)
- Rate limiting protection (`tests/ratelimit.test.ts`)

Run code quality checks:
```bash
npm run lint
npm run build
```

---

## Evaluation Benchmark

Evaluate AI decision performance against ground-truth labelled test cases:
```bash
npm run evaluate
```

Example Benchmark Scorecard:
```text
========================================================
🚀 Running IssuePilot AI Model Evaluation Benchmark
Dataset: 15 labeled test cases
========================================================
Category Classification Accuracy: 60.0% (9/15)
Escalation Detection Precision:    71.4%
Escalation Detection Recall:       100.0%
Escalation False Positives:        2
Human Review Gate Trigger Rate:    0.0% (0/15)
Average Decision Latency:          0.1 ms/issue
========================================================
```

---

## Deployment to Google Cloud Run

To containerize and deploy to Google Cloud Run:
```bash
./scripts/deploy.sh <YOUR_GCP_PROJECT_ID> [REGION]
```

Or deploy manually using Docker:
```bash
docker compose up --build app
```

---

## Resume Highlights
- **Engineered an AI-Driven Issue Triage Platform:** Integrated Jev AI's structured decision model (`typesafe/jev-1.13`) using Next.js 15, TypeScript, and Prisma to classify software issues, calculate severity impact, and route escalations.
- **Architected Safety Review Thresholds:** Designed confidence and escalation gating policies that route uncertain model predictions to a human review queue with override capabilities.
- **Built End-to-End GitHub Integration:** Implemented HMAC-SHA256 verified webhooks with deduplication and automated label synchronization via the GitHub REST API.
- **Containerization & CI/CD:** Orchestrated PostgreSQL and Next.js services using Docker Compose, configured multi-stage Docker builds, and created GitHub Actions CI workflows.
