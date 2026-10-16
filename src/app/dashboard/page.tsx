"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Inbox,
  ShieldAlert,
  Plus,
} from "lucide-react";

interface RepoItem {
  id: string;
  fullName: string;
  language: string;
  webhookActive: boolean;
  autoSyncLabels: boolean;
  minConfidence: number;
  escalationThreshold: number;
  triagedCount: number;
  pendingReviewCount: number;
}

interface IssueItem {
  id: string;
  title: string;
  repository: string;
  githubIssueNumber?: number;
  githubSynced?: boolean;
  category: string;
  categoryConfidence: number;
  severity: number;
  escalationProbability: number;
  priority: string;
  suggestedTeam: string;
  needsReview: boolean;
  humanReviewed: boolean;
  humanCategory?: string;
  humanPriority?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncingRepoId, setSyncingRepoId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  const loadWorkspaceData = useCallback(async () => {
    setLoading(true);
    try {
      const [reposRes, issuesRes] = await Promise.all([
        fetch("/api/repos").then((r) => r.json()),
        fetch("/api/issues").then((r) => r.json()),
      ]);
      setRepos(reposRes.repositories || []);
      setIssues(issuesRes.issues || []);
      setPendingReviewCount(issuesRes.pendingReviewCount || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/repos").then((r) => r.json()),
      fetch("/api/issues").then((r) => r.json()),
    ])
      .then(([reposRes, issuesRes]) => {
        if (!active) return;
        setRepos(reposRes.repositories || []);
        setIssues(issuesRes.issues || []);
        setPendingReviewCount(issuesRes.pendingReviewCount || 0);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSyncRepo = async (repoId: string) => {
    setSyncingRepoId(repoId);
    try {
      await fetch(`/api/repos/${repoId}/sync`, { method: "POST" });
      await loadWorkspaceData();
    } finally {
      setSyncingRepoId(null);
    }
  };

  const handleQuickBootstrapDemo = async () => {
    setBootstrapping(true);
    try {
      const demoTargets = [
        {
          fullName: "acme-cloud/api-gateway",
          description:
            "High-throughput edge routing, rate-limiting, and JWT verification proxy",
          language: "TypeScript",
          defaultTeam: "Platform & Infra",
        },
      ];

      for (const item of demoTargets) {
        const res = await fetch("/api/repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...item,
            connectionMode: "demo",
            minConfidence: 0.75,
            escalationThreshold: 0.85,
            autoSyncLabels: true,
          }),
        });
        const created = await res.json();
        if (created?.repository?.id) {
          await fetch(`/api/repos/${created.repository.id}/sync`, { method: "POST" });
        }
      }

      await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubConnected: true,
          githubConnectionMode: "demo",
          onboardingCompleted: true,
        }),
      });

      await loadWorkspaceData();
    } finally {
      setBootstrapping(false);
    }
  };

  const totalTriaged = issues.length;
  const criticalCount = issues.filter(
    (i) => (i.humanPriority || i.priority) === "critical"
  ).length;
  const autoRoutedCount = issues.filter((i) => !i.needsReview).length;
  const autoRoutedRate =
    totalTriaged > 0 ? Math.round((autoRoutedCount / totalTriaged) * 100) : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <LayoutDashboard size={26} />
            <span>Workspace Command Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time overview of connected GitHub repositories, Jev 1.13 triage decisions, and safety review gates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadWorkspaceData}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Refresh workspace"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/repos"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <Plus size={14} />
            <span>Link Repository</span>
          </Link>
          <Link
            href="/playground"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90"
          >
            <Sparkles size={14} />
            <span>New Triage</span>
          </Link>
        </div>
      </div>

      {/* Onboarding Callout Banner when no repos are linked yet */}
      {!loading && repos.length === 0 && (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
              <GitBranch size={14} />
              <span>GitHub Integration Not Linked Yet</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Connect your GitHub repositories to start automated issue triage
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-2xl">
              Use the 3-step Onboarding Wizard to connect a GitHub Personal Access Token, or click below to instantly provision 3 demo microservices and triage their open issues.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleQuickBootstrapDemo}
              disabled={bootstrapping}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {bootstrapping ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Provisioning Demo Repos...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>1-Click Provision Demo Repos & Issues</span>
                </>
              )}
            </button>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold"
            >
              <span>Open Setup Wizard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Total Triaged Issues</span>
            <Sparkles size={15} className="text-neutral-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
            {totalTriaged}
          </div>
          <div className="text-[11px] text-neutral-400">
            Processed via Jev structured decision engine
          </div>
        </div>

        <Link
          href="/inbox?needsReview=true"
          className="p-5 rounded-2xl border border-amber-500/30 bg-white dark:bg-neutral-950 hover:border-amber-500/60 transition-colors space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold">
            <span>Pending Human Review</span>
            <Inbox size={15} />
          </div>
          <div className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
            {pendingReviewCount}
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 flex items-center gap-1">
            <span>Open Review Inbox</span>
            <ArrowRight size={11} />
          </div>
        </Link>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Auto-Routed Confidence Rate</span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
            {autoRoutedRate}%
          </div>
          <div className="text-[11px] text-neutral-400">
            Cleared confidence gate without manual intervention
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Critical (P0) Escalations</span>
            <ShieldAlert size={15} className="text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
            {criticalCount}
          </div>
          <div className="text-[11px] text-neutral-400">
            Routed to Incident Response / Platform
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: Connected Repos + Recent Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Linked Repositories */}
        <div className="lg:col-span-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <GitBranch size={17} />
                <span>Linked Repositories ({repos.length})</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Active webhook & policy thresholds per repo
              </p>
            </div>
            <Link
              href="/repos"
              className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:underline"
            >
              Manage All →
            </Link>
          </div>

          {repos.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-2">
              <p className="text-xs text-neutral-500">No repositories linked yet.</p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold"
              >
                <span>Connect GitHub Repos</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800/90 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {repo.fullName}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSyncRepo(repo.id)}
                      disabled={syncingRepoId === repo.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-medium transition-colors"
                    >
                      <RefreshCw
                        size={11}
                        className={syncingRepoId === repo.id ? "animate-spin" : ""}
                      />
                      <span>{syncingRepoId === repo.id ? "Syncing..." : "Sync Issues"}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 font-mono">
                    <span>
                      Gate: &ge;{(repo.minConfidence * 100).toFixed(0)}% conf • Esc: &ge;
                      {(repo.escalationThreshold * 100).toFixed(0)}%
                    </span>
                    <span>
                      {repo.triagedCount} triaged
                      {repo.pendingReviewCount > 0
                        ? ` • ${repo.pendingReviewCount} review`
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Triage Stream */}
        <div className="lg:col-span-7 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Recent Triage Decisions
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Latest issues classified by Jev 1.13 across all repositories
              </p>
            </div>
            <Link
              href="/inbox"
              className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:underline"
            >
              Open Full Inbox →
            </Link>
          </div>

          {issues.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-2">
              <p className="text-xs text-neutral-500">
                No issues have been triaged yet.
              </p>
              <Link
                href="/playground"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold"
              >
                <span>Run a Triage in Playground</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {issues.slice(0, 7).map((issue) => {
                const effectivePriority = issue.humanPriority || issue.priority;
                const effectiveCategory = issue.humanCategory || issue.category;
                return (
                  <div
                    key={issue.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {issue.title}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-neutral-400">
                        <span>{issue.repository}</span>
                        {issue.githubIssueNumber && (
                          <span>#{issue.githubIssueNumber}</span>
                        )}
                        <span>•</span>
                        <span className="capitalize text-neutral-600 dark:text-neutral-300">
                          {effectiveCategory} ({(issue.categoryConfidence * 100).toFixed(0)}%)
                        </span>
                        <span>•</span>
                        <span>{issue.suggestedTeam}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          effectivePriority === "critical"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            : effectivePriority === "high"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800"
                        }`}
                      >
                        {effectivePriority}
                      </span>

                      {issue.needsReview && !issue.humanReviewed ? (
                        <Link
                          href="/inbox?needsReview=true"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-semibold"
                        >
                          <AlertTriangle size={11} />
                          <span>Review</span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 size={12} />
                          <span>{issue.humanReviewed ? "Approved" : "Synced"}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
