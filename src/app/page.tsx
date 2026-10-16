"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lock,
  Sliders,
  Inbox,
  Zap,
  Tag,
} from "lucide-react";

const DEMO_SCENARIOS = [
  {
    id: "outage",
    badge: "🚨 Critical Outage",
    repo: "acme-cloud/payments-engine",
    issueNumber: 412,
    title: "HTTP 500 timeout on Stripe settlement webhook in us-east-1",
    body: "All production invoice webhooks are failing with 500 Internal Server Error following v3.2 deploy. Customer ledger settlements are halted.",
    category: "bug",
    categoryConfidence: 0.96,
    probabilities: { bug: 0.96, feature: 0.01, question: 0.01, other: 0.02 },
    severity: 3.0,
    severityConfidence: 0.95,
    escalation: 0.94,
    priority: "critical",
    team: "Incident Response / Platform",
    needsReview: false,
    gateStatus: "Auto-Synced to GitHub",
    labels: ["type:bug", "priority:critical"],
  },
  {
    id: "ambiguous",
    badge: "⚠️ Borderline / Low Confidence",
    repo: "acme-cloud/web-dashboard",
    issueNumber: 289,
    title: "Something weird happens when switching orgs quickly",
    body: "I clicked the workspace switcher twice and the sidebar flashed a strange state before recovering.",
    category: "bug",
    categoryConfidence: 0.58,
    probabilities: { bug: 0.58, feature: 0.14, question: 0.18, other: 0.1 },
    severity: 1.4,
    severityConfidence: 0.62,
    escalation: 0.68,
    priority: "medium",
    team: "Core Engineering",
    needsReview: true,
    gateStatus: "Held in Human Review Inbox (<75% conf)",
    labels: ["type:bug", "priority:medium"],
  },
  {
    id: "feature",
    badge: "✨ Feature Request",
    repo: "acme-cloud/sdk-typescript",
    issueNumber: 104,
    title: "Add exponential backoff retry option to TypeSafeClient",
    body: "Please allow configuring maxRetries and jitter delay in the SDK constructor for high-latency edge environments.",
    category: "feature",
    categoryConfidence: 0.94,
    probabilities: { bug: 0.02, feature: 0.94, question: 0.03, other: 0.01 },
    severity: 0.8,
    severityConfidence: 0.91,
    escalation: 0.02,
    priority: "low",
    team: "Product & UI",
    needsReview: false,
    gateStatus: "Auto-Synced to GitHub",
    labels: ["type:feature", "priority:low"],
  },
];

export default function LandingPage() {
  const [activeScenario, setActiveScenario] = useState(DEMO_SCENARIOS[0]);

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-14 sm:pt-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Cpu size={14} />
              <span>Powered by Jev 1.13 Structured Decision Models</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.08]">
              Autonomous GitHub Issue Triage with{" "}
              <span className="underline decoration-emerald-500/60 decoration-wavy underline-offset-8">
                Calibrated Safety Gates.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
              Stop relying on brittle prompt wrappers. IssuePilot connects to your GitHub repositories, computes calibrated{" "}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                choice
              </code>
              ,{" "}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                score
              </code>
              , and{" "}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                noul
              </code>{" "}
              probabilities, auto-labels high-confidence issues, and routes uncertain cases to your team&apos;s review inbox.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-sm hover:opacity-90 transition-all shadow-sm"
              >
                <GitBranch size={16} />
                <span>Connect GitHub & Start</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-sm transition-colors"
              >
                <span>Open Live Workspace</span>
              </Link>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-neutral-200 dark:border-neutral-800/80 text-xs">
              <div>
                <div className="font-bold text-lg text-neutral-900 dark:text-white font-mono">
                  &lt; 75%
                </div>
                <div className="text-neutral-500 dark:text-neutral-400">
                  Confidence Safety Gate
                </div>
              </div>
              <div>
                <div className="font-bold text-lg text-neutral-900 dark:text-white font-mono">
                  HMAC-256
                </div>
                <div className="text-neutral-500 dark:text-neutral-400">
                  Verified GitHub Webhooks
                </div>
              </div>
              <div>
                <div className="font-bold text-lg text-neutral-900 dark:text-white font-mono">
                  2-Way Sync
                </div>
                <div className="text-neutral-500 dark:text-neutral-400">
                  Auto-Label & Override Push
                </div>
              </div>
            </div>
          </div>

          {/* Right Interactive Decision Preview Card */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xl overflow-hidden">
              {/* Top Window Bar */}
              <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-neutral-500">
                    Interactive Decision Inspector • Jev 1.13
                  </span>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                  {activeScenario.repo}#{activeScenario.issueNumber}
                </span>
              </div>

              {/* Scenario Selector Tabs */}
              <div className="px-5 pt-4 flex flex-wrap gap-2">
                {DEMO_SCENARIOS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveScenario(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeScenario.id === item.id
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs"
                        : "border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    }`}
                  >
                    {item.badge}
                  </button>
                ))}
              </div>

              {/* Issue Content */}
              <div className="p-5 space-y-5">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40">
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">
                    {activeScenario.title}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                    {activeScenario.body}
                  </p>
                </div>

                {/* Structured Probabilities Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="text-[10px] font-mono uppercase text-neutral-400">
                      choice(Category)
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-base font-bold capitalize text-neutral-900 dark:text-white">
                        {activeScenario.category}
                      </span>
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {(activeScenario.categoryConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-300"
                        style={{ width: `${activeScenario.categoryConfidence * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="text-[10px] font-mono uppercase text-neutral-400">
                      score(Severity)
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                        {activeScenario.severity.toFixed(1)}/3.0
                      </span>
                      <span className="text-xs font-mono text-neutral-500">
                        {(activeScenario.severityConfidence * 100).toFixed(0)}% conf
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-300"
                        style={{ width: `${(activeScenario.severity / 3) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="text-[10px] font-mono uppercase text-neutral-400">
                      noul(Escalation)
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                        {(activeScenario.escalation * 100).toFixed(0)}%
                      </span>
                      <span className="text-[11px] font-mono uppercase text-neutral-500">
                        {activeScenario.priority}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          activeScenario.escalation >= 0.85
                            ? "bg-rose-500"
                            : activeScenario.escalation >= 0.6
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${activeScenario.escalation * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Gate Outcome Bar */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    activeScenario.needsReview
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {activeScenario.needsReview ? (
                      <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    )}
                    <span>{activeScenario.gateStatus}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {activeScenario.labels.map((lbl) => (
                      <span
                        key={lbl}
                        className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/80 dark:bg-neutral-950/80 border border-current/20"
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* End-to-End SaaS Pipeline Section */}
      <section id="pipeline" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            End-to-End Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            From GitHub Issue Webhook to Verified Label in Milliseconds
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Designed for engineering organizations that need deterministic safety controls around AI automation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: "01",
              icon: GitBranch,
              title: "Connect Repositories",
              desc: "Link your GitHub repositories via OAuth, Personal Access Token, or HMAC-SHA256 webhooks with automatic delivery deduplication.",
            },
            {
              step: "02",
              icon: Cpu,
              title: "Jev 1.13 Inference",
              desc: "Computes structured choice probabilities, rubric severity scores (0–3), and critical escalation risk without brittle regex parsing.",
            },
            {
              step: "03",
              icon: Sliders,
              title: "Per-Repo Safety Gates",
              desc: "Enforces your repository's custom confidence threshold (e.g. 75%) and flags borderline escalations (60%–85%) for human review.",
            },
            {
              step: "04",
              icon: Tag,
              title: "2-Way GitHub Label Sync",
              desc: "High-confidence decisions auto-apply labels on GitHub immediately; uncertain issues wait in your split-pane Review Inbox.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-3 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-mono text-neutral-400">{item.step}</span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            Enterprise-Grade Controls
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Built Like a Real Engineering SaaS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-3">
            <Inbox size={20} className="text-amber-500" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Split-Pane Human Review Inbox
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Inspect low-confidence or borderline escalation issues side-by-side with full probability breakdowns. Approve with one click or override category and priority before syncing to GitHub.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-3">
            <Sliders size={20} className="text-emerald-500" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Per-Repository Policy Thresholds
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Configure stricter confidence gates (e.g., 85%) on mission-critical payment or auth repositories while keeping docs and SDK repos on fast auto-routing.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-3">
            <Lock size={20} className="text-indigo-500" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Zero-Cost Local & Live Dual Mode
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Seamlessly switches between live Jev 1.13 API inference and deterministic local evaluation, complete with a 15-case ground-truth benchmark suite.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-900 dark:bg-neutral-900 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
              <Zap size={14} />
              <span>Ready in 60 seconds</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Connect your GitHub repositories today
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg">
              Try the full onboarding flow with a real GitHub Personal Access Token or our 1-click Demo GitHub Organization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-neutral-950 font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity"
            >
              <Sparkles size={15} />
              <span>Launch Onboarding Wizard</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm transition-colors"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
