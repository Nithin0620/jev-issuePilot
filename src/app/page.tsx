"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  Shield,
  Layers,
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
    escalationProb: 0.94,
    routingTeam: "Incident Response",
    priority: "critical",
    needsReview: false,
  },
  {
    id: "ambiguous",
    badge: "⚠️ Low Confidence Gate",
    repo: "acme-cloud/web-dashboard",
    issueNumber: 809,
    title: "Settings page looks kind of slow or weird on refresh",
    body: "Sometimes when I reload the profile settings it takes a few seconds and the theme looks white for a split second.",
    category: "bug",
    categoryConfidence: 0.62,
    probabilities: { bug: 0.62, feature: 0.28, question: 0.05, other: 0.05 },
    severity: 0.8,
    escalationProb: 0.12,
    routingTeam: "Frontend Core",
    priority: "low",
    needsReview: true,
  },
];

export default function LandingPage() {
  const [selectedScenario, setSelectedScenario] = useState(DEMO_SCENARIOS[0]);

  return (
    <div className="min-h-screen text-neutral-900 dark:text-neutral-100 relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pt-12 pb-24 space-y-20">
        {/* Navigation / Header */}
        <header className="flex items-center justify-between py-4 border-b border-neutral-200/50 dark:border-neutral-800/60 glass-panel px-6 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl metallic-btn flex items-center justify-center font-extrabold text-base tracking-wide">
              IP
            </div>
            <span className="font-extrabold text-base tracking-tight">IssuePilot</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono metallic-badge">
              v1.0 SaaS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl metallic-btn text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
            >
              <span>Open App</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center space-y-6 pt-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full metallic-badge text-xs font-medium">
            <Sparkles size={14} className="text-indigo-500" />
            <span>Deterministic Jev 1.13 Structured AI Decision Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15]">
            Structured AI Triage & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Automated Safety Gates
            </span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Stop noisy auto-labelers from misrouting production incidents. IssuePilot evaluates GitHub issue text with typed Jev models, enforces confidence thresholds, and routes low-confidence items to human review queues.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl metallic-btn text-sm font-semibold hover:scale-105 active:scale-95 transition-all"
            >
              <span>Go to Operations Dashboard</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/playground"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass-card text-sm font-semibold hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles size={16} className="text-indigo-500" />
              <span>Interactive Decision Simulator</span>
            </Link>
          </div>
        </section>

        {/* Interactive Scenario Demo Card */}
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold flex items-center justify-center gap-2">
              <Zap className="text-amber-500" size={20} />
              <span>Live Decision Pipeline Simulation</span>
            </h2>
            <p className="text-xs text-neutral-500 font-mono">
              Select a sample scenario to inspect real-time safety gate evaluations
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {DEMO_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedScenario.id === sc.id
                    ? "metallic-btn scale-102"
                    : "glass-card text-neutral-600 dark:text-neutral-400 hover:scale-102"
                }`}
              >
                {sc.badge}
              </button>
            ))}
          </div>

          {/* Simulated Decision Card Output */}
          <div className="rounded-2xl glass-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200/50 dark:border-neutral-800/60">
              <div className="flex items-center gap-2 font-mono text-xs text-neutral-500">
                <GitBranch size={14} className="text-indigo-500" />
                <span>{selectedScenario.repo}</span>
                <span>#{selectedScenario.issueNumber}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono text-neutral-400">Priority:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    selectedScenario.priority === "critical"
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40"
                      : "metallic-badge"
                  }`}
                >
                  {selectedScenario.priority}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {selectedScenario.title}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono bg-neutral-100/50 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60">
                {selectedScenario.body}
              </p>
            </div>

            {selectedScenario.needsReview ? (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-xs">
                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-neutral-900 dark:text-white">
                    Flagged for Human Review Gate
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Category confidence ({(selectedScenario.categoryConfidence * 100).toFixed(0)}%) is below the configured 75% confidence gate. Auto-labeling held until operator confirmation.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>High confidence decision ({(selectedScenario.categoryConfidence * 100).toFixed(0)}%). Automated routing approved for {selectedScenario.routingTeam}.</span>
              </div>
            )}
          </div>
        </section>

        {/* Key Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl metallic-btn flex items-center justify-center">
              <Shield size={20} />
            </div>
            <h3 className="text-base font-bold">Safety Confidence Gates</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Define repository-level confidence thresholds (e.g. &ge; 75%). Ambiguous issues are routed to a human inbox rather than misclassified.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl metallic-btn flex items-center justify-center">
              <Layers size={20} />
            </div>
            <h3 className="text-base font-bold">Typed Jev Decision Engine</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Returns structured JSON output: category choice, probabilities, 0-3.0 impact severity scores, and escalation likelihoods.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl metallic-btn flex items-center justify-center">
              <GitBranch size={20} />
            </div>
            <h3 className="text-base font-bold">GitHub REST & Webhook Sync</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Pushes <code className="font-mono text-[10px]">type:*</code> and <code className="font-mono text-[10px]">priority:*</code> labels directly back to your GitHub issues automatically.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
