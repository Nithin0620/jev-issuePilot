# IssuePilot SaaS Platform Revamp — Design Specification

## 1. Overview & Goal
Transform IssuePilot from a single-page backend testing tool into an end-to-end B2B Developer SaaS product (Linear / Vercel / Raycast aesthetic) with a high-conversion marketing landing page, full authentication & user registration, an interactive post-auth onboarding wizard, hybrid GitHub repository connection (real GitHub API + 1-click Demo GitHub account), repository-level AI safety policy configuration, split-pane Human Review Inbox, AI Triage Playground, Decision Telemetry Analytics, and Workspace Settings.

---

## 2. Information Architecture & Route Structure

### Public / Marketing Routes
- `/` — **Marketing Landing Page:**
  - Sticky SaaS navigation bar with product links, theme toggle, and session-aware CTA (`Open Workspace` if signed in, `Sign In` + `Start Free` if signed out).
  - Hero section with badge, headline, dual CTAs, and an interactive live preview card showing Jev 1.13 structured probabilities (`choice`, `score`, `noul`), severity rubric, and safety gate routing.
  - Architecture pipeline walkthrough (`GitHub Webhook` → `Jev 1.13 Structured Model` → `Safety Gate Policy` → `Auto-Label / Human Review Inbox`).
  - Feature Bento Grid highlighting Calibrated Probabilities, Borderline Escalation Gates, Constant-Time Webhook Verification, and Per-Repo Policy Controls.
  - Footer with links to `/dashboard`, `/playground`, `/inbox`, `/login`, and `/register`.
- `/login` — **Sign In Page:**
  - Email/password login, 1-click Demo Admin login (`admin@issuepilot.local` / `admin123`), GitHub/Google OAuth buttons, and link to `/register`.
  - Redirects to `/dashboard` (or `/onboarding` for new accounts) after sign-in.
- `/register` — **Create Account Page:**
  - Full name, work email, password registration backed by `POST /api/auth/register` (hashes password with `bcryptjs` and creates a `User` in PostgreSQL).
  - Automatically signs the user in and redirects to `/onboarding`.

### Authenticated Workspace Routes (Persistent Sidebar Layout)
All workspace routes share a sleek collapsible sidebar (`src/components/WorkspaceShell.tsx`) with active route indicators, pending human review badge count, connected repo count, user profile/role footer, and sign-out action:
- `/onboarding` — **3-Step Onboarding & GitHub Connection Wizard:**
  1. **Connect GitHub:** Choose between **Connect with GitHub Personal Access Token** (live GitHub API) or **Connect Demo GitHub Account** (instant realistic sample org `acme-cloud` with 4 repositories).
  2. **Link Repositories:** Select which repositories to enable for IssuePilot webhook monitoring & automated triage.
  3. **Configure Safety Thresholds:** Set default confidence threshold (e.g., `75%`), critical escalation threshold (`85%`), and auto-sync labels toggle, then launch into `/dashboard`.
- `/dashboard` — **Workspace Command Center:**
  - Top KPI strip: Total Triaged Issues, Pending Human Review, Auto-Routed Percentage, Connected Repositories.
  - Quick-action banner (Link Repository, Sync Issues from GitHub, Open AI Playground).
  - Connected Repositories health panel with quick "Sync Issues" trigger.
  - Recent Triage Decisions table with priority badges (`P0 Critical`, `P1 High`, `P2 Medium`, `P3 Low`), confidence pills, and direct links to review in `/inbox`.
- `/repos` — **GitHub Repositories & Policy Configuration:**
  - Grid/list of linked `Repository` records showing repo name, description, language badge, webhook status (`Active` / `Simulated`), auto-label toggle, custom confidence threshold, escalation threshold, and issue counts.
  - **"Connect Repository" Modal:** Discover repos from connected GitHub account (live token or demo catalog) or add a custom `owner/repo` with custom webhook secret and thresholds.
  - **"Sync Issues" Action (`POST /api/repos/[id]/sync`):** Fetches open issues from GitHub REST API (if token provided) or generates realistic repository-specific issues (in demo mode), runs each through `classifyIssue` + `applyPolicy` (using the repo's custom thresholds), and persists them to PostgreSQL.
- `/inbox` (plus `/history` redirect/alias) — **Split-Pane Human Review Inbox:**
  - Left pane: Search & filter bar (`Needs Review`, `All Decisions`, `Critical P0`, `Reviewed`, plus Repository filter dropdown) and scrollable issue cards.
  - Right pane: Full issue inspector with title, repository badge, GitHub issue number & sync status, full markdown/text body, Jev 1.13 probability distribution bars, severity rubric score, escalation gauge, and action bar to **Approve & Sync to GitHub** or **Override Classification & Priority** with reviewer notes.
- `/playground` — **Interactive AI Triage Simulator:**
  - Enhanced version of `IssueForm` + `DecisionCard` with repository selector populated from linked repositories, preset scenario pills, and raw JSON telemetry view.
- `/analytics` (plus `/metrics` alias) — **Decision Telemetry & Model Evaluation:**
  - Confidence & agreement KPIs, Category & Priority distribution bar charts, Human-vs-AI override agreement breakdown, and evaluation benchmark summary.
- `/settings` — **Workspace & Integration Settings:**
  - GitHub Integration status (Token configuration, Demo mode toggle, Webhook URL & HMAC secret copy box).
  - Global Default Policy Thresholds (`minConfidence`, `escalationThreshold`, `autoSyncLabels`).
  - AI Engine status (`typesafe/jev-1.13` vs `mock/jev-deterministic-v1`).

---

## 3. Data Model Additions (`prisma/schema.prisma`)

Add `Repository` and `WorkspaceConfig` models while keeping all existing `User`, `Account`, `Session`, `VerificationToken`, and `Issue` fields backward-compatible:

```prisma
model Repository {
  id                  String   @id @default(cuid())
  fullName            String   @unique // e.g. "acme/cloud-api"
  name                String           // e.g. "cloud-api"
  owner               String           // e.g. "acme"
  description         String?
  language            String?  @default("TypeScript")
  isPrivate           Boolean  @default(false)
  connectionMode      String   @default("demo") // "github_pat" | "oauth" | "demo"
  webhookActive       Boolean  @default(true)
  autoSyncLabels      Boolean  @default(true)
  minConfidence       Float    @default(0.75)
  escalationThreshold Float    @default(0.85)
  defaultTeam         String   @default("Core Engineering")
  lastSyncedAt        DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model WorkspaceConfig {
  id                  String   @id @default("default")
  organizationName    String   @default("Acme Engineering")
  githubConnected     Boolean  @default(false)
  githubConnectionMode String  @default("none") // "none" | "demo" | "pat" | "oauth"
  githubUsername      String?
  githubTokenHint     String?
  onboardingCompleted Boolean  @default(false)
  defaultMinConfidence Float   @default(0.75)
  defaultEscalation   Float    @default(0.85)
  autoSyncLabels      Boolean  @default(true)
  updatedAt           DateTime @updatedAt
}
```

---

## 4. Policy Engine Enhancement (`src/lib/policy.ts`)
Extend `applyPolicy(answers, options?)` with optional threshold overrides (`minConfidence?: number`, `escalationThreshold?: number`) so existing callers (`applyPolicy(answers)`) work identically (passing all existing unit tests) while per-repository policy thresholds are respected when triaging or syncing repo issues.

---

## 5. Testing & Verification Strategy
- Preserve 100% compatibility with existing unit and integration tests (`tests/policy.test.ts`, `tests/triage.test.ts`, `tests/github.test.ts`, `tests/webhook.test.ts`, `tests/ratelimit.test.ts`).
- Add unit/integration tests for:
  - Custom policy thresholds (`tests/policy.test.ts`).
  - User registration API (`tests/register.test.ts`).
  - Repository linking & issue syncing API (`tests/repos.test.ts`).
- Verify `npm test`, `npm run lint`, and `npm run build` pass with zero errors.
