# IssuePilot SaaS Platform Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform IssuePilot from a single-page backend test utility into an end-to-end B2B Developer SaaS application with a marketing landing page, authentication & user registration, 3-step GitHub onboarding wizard, repository linking & issue synchronization, split-pane human review inbox, AI playground, analytics dashboard, and workspace settings.

**Architecture:** We extend the Prisma PostgreSQL schema with `Repository` and `WorkspaceConfig` models, enhance `applyPolicy` to accept per-repository confidence/escalation thresholds, build REST API endpoints for user registration (`/api/auth/register`), workspace settings (`/api/workspace`), and repository management + GitHub issue syncing (`/api/repos`, `/api/repos/[id]/sync`), and introduce a unified shell (`AppChrome`) that renders a public SaaS marketing header on `/` and a collapsible Linear-style workspace sidebar across `/dashboard`, `/onboarding`, `/repos`, `/inbox`, `/playground`, `/analytics`, and `/settings`.

**Tech Stack:** Next.js 16.4 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma ORM, PostgreSQL, NextAuth, `@typesafe-ai/sdk` (Jev 1.13), Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-16-issuepilot-saas-revamp-design.md`

## Global Constraints
- Maintain backward compatibility with all 18 existing Vitest tests (`npm test`).
- Support graceful fallback when database or external API keys are absent so builds and tests succeed offline.
- Support both real GitHub Personal Access Token repo fetching (`api.github.com`) and 1-click Demo GitHub Account mode.

---

### Task 1: Database Schema & Policy Engine Per-Repo Thresholds

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/policy.ts`
- Modify: `tests/policy.test.ts`

- [ ] **Step 1: Add failing test for custom policy thresholds in `tests/policy.test.ts`**
- [ ] **Step 2: Update `src/lib/policy.ts` to support optional `PolicyOptions` (`minConfidence`, `escalationThreshold`)**
- [ ] **Step 3: Add `Repository` and `WorkspaceConfig` models to `prisma/schema.prisma` and apply Prisma migration**
- [ ] **Step 4: Run `npm test` to verify all policy tests pass**

---

### Task 2: User Registration API & Enhanced Auth Flow

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Modify: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`
- Create: `tests/register.test.ts`

- [ ] **Step 1: Write unit tests for `POST /api/auth/register` in `tests/register.test.ts`**
- [ ] **Step 2: Implement `POST /api/auth/register` with Zod validation and `bcryptjs` hashing**
- [ ] **Step 3: Build `/register` page and update `/login` page with SaaS polish and `/dashboard` redirect**
- [ ] **Step 4: Run `npm test` to verify registration tests pass**

---

### Task 3: Hybrid GitHub Repository Catalog, Workspace API & Repo Sync API

**Files:**
- Modify: `src/lib/github.ts`
- Create: `src/app/api/workspace/route.ts`
- Create: `src/app/api/repos/route.ts`
- Create: `src/app/api/repos/[id]/route.ts`
- Create: `src/app/api/repos/[id]/sync/route.ts`
- Modify: `src/app/api/triage/route.ts`
- Create: `tests/repos.test.ts`

- [ ] **Step 1: Write unit tests for repository linking and issue syncing in `tests/repos.test.ts`**
- [ ] **Step 2: Add demo repository catalog, demo issue generator, and live GitHub repo/issue fetcher in `src/lib/github.ts`**
- [ ] **Step 3: Implement `/api/workspace`, `/api/repos`, `/api/repos/[id]`, and `/api/repos/[id]/sync`**
- [ ] **Step 4: Update `/api/triage` to look up linked `Repository` thresholds when triaging an issue**
- [ ] **Step 5: Run `npm test` to verify all tests pass**

---

### Task 4: Adaptive SaaS Navigation Shell & Marketing Landing Page (`/`)

**Files:**
- Create: `src/components/AppShell.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/AppShell.tsx` providing the marketing navbar on `/`, `/login`, `/register` and the Linear/Vercel-style collapsible sidebar workspace on `/dashboard`, `/onboarding`, `/repos`, `/inbox`, `/playground`, `/analytics`, `/settings`**
- [ ] **Step 2: Update `src/app/layout.tsx` to wrap children with `AppShell`**
- [ ] **Step 3: Rebuild `src/app/page.tsx` into a full B2B SaaS marketing landing page with interactive Jev 1.13 decision preview, pipeline diagram, feature bento grid, and live workspace CTAs**

---

### Task 5: Post-Auth Onboarding Wizard (`/onboarding`) & Command Dashboard (`/dashboard`)

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create `/onboarding` 3-step wizard (Connect GitHub via Token or Demo Account → Select & Link Repositories → Configure Safety Thresholds)**
- [ ] **Step 2: Create `/dashboard` SaaS Command Center showing KPI cards, connected repositories status & 1-click sync, recent triage stream, and pending review alerts**

---

### Task 6: Repositories Management (`/repos`), Split-Pane Inbox (`/inbox`), Playground (`/playground`), Analytics (`/analytics`), and Settings (`/settings`)

**Files:**
- Create: `src/app/repos/page.tsx`
- Create: `src/app/inbox/page.tsx`
- Create: `src/app/playground/page.tsx`
- Create: `src/app/analytics/page.tsx`
- Create: `src/app/settings/page.tsx`
- Modify: `src/app/history/page.tsx`
- Modify: `src/app/metrics/page.tsx`

- [ ] **Step 1: Build `/repos` page to link repositories, toggle webhooks & auto-label sync, edit per-repo confidence/escalation thresholds, and trigger "Sync Issues from GitHub"**
- [ ] **Step 2: Build `/inbox` split-pane Human Review & Decision Audit interface (and update `/history` to render it seamlessly)**
- [ ] **Step 3: Build `/playground` with linked repository selector, preset templates, and structured Jev output + raw JSON telemetry**
- [ ] **Step 4: Build `/analytics` and `/settings` pages for decision telemetry and workspace/GitHub webhook configuration**
- [ ] **Step 5: Run `npm test`, `npm run lint`, and `npm run build` to verify everything compiles and passes**
