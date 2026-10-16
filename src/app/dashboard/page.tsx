"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Sparkles,
  Zap,
  Activity,
  Layers,
} from "lucide-react";

interface Repository {
  id: string;
  fullName: string;
  webhookActive: boolean;
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
  category: string;
  categoryConfidence: number;
  priority: string;
  needsReview: boolean;
  humanReviewed: boolean;
  humanCategory?: string;
  humanPriority?: string;
  suggestedTeam: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingRepoId, setSyncingRepoId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [reposRes, issuesRes] = await Promise.all([
        fetch("/api/repos"),
        fetch("/api/issues"),
      ]);
      const reposData = await reposRes.json();
      const issuesData = await issuesRes.json();

      if (reposData?.repositories) setRepos(reposData.repositories);
      if (issuesData?.issues) setIssues(issuesData.issues);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/repos"), fetch("/api/issues")])
      .then(async ([r1, r2]) => {
        const d1 = await r1.json();
        const d2 = await r2.json();
        if (active) {
          if (d1?.repositories) setRepos(d1.repositories);
          if (d2?.issues) setIssues(d2.issues);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSyncRepo = async (repoId: string) => {
    setSyncingRepoId(repoId);
    try {
      await fetch(`/api/repos/${repoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_issues" }),
      });
      await loadData();
    } catch (e) {
      console.error("Failed to sync repo", e);
    } finally {
      setSyncingRepoId(null);
    }
  };

  const pendingReviewCount = issues.filter((i) => i.needsReview && !i.humanReviewed).length;
  const criticalCount = issues.filter(
    (i) => (i.humanPriority || i.priority) === "critical"
  ).length;
  const autoRoutedRate = issues.length
    ? Math.round(((issues.length - pendingReviewCount) / issues.length) * 100)
    : 100;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-neutral-500 font-mono text-xs metallic-badge px-4 py-2.5 rounded-full">
          <RefreshCw size={16} className="animate-spin text-indigo-500" />
          <span>Loading IssuePilot Operations Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Banner & Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-neutral-800/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <Activity className="text-indigo-500" size={28} />
            <span>AI Decision Operations Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time GitHub triage stream, confidence gate statistics, and routing policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl metallic-btn text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles size={14} />
            <span>Simulate Triage</span>
          </Link>
          <button
            onClick={loadData}
            type="button"
            className="p-2 rounded-xl metallic-badge text-neutral-600 dark:text-neutral-300 hover:scale-105 active:scale-95 transition-all"
            title="Refresh Dashboard Data"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl glass-card space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>Total Issues Triaged</span>
            <Layers size={16} className="text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
            {issues.length}
          </div>
          <div className="text-[11px] text-neutral-400">
            Across {repos.length} linked repositories
          </div>
        </div>

        <Link
          href="/inbox?needsReview=true"
          className="p-5 rounded-2xl glass-card space-y-2 group hover:border-amber-500/50 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span>Pending Review Gate</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>{pendingReviewCount}</span>
            <span className="text-xs font-sans font-normal opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-amber-500">
              Review <ArrowRight size={12} />
            </span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Low confidence or borderline escalation risk
          </div>
        </Link>

        <div className="p-5 rounded-2xl glass-card space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>Auto-Routed Confidence Rate</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {autoRoutedRate}%
          </div>
          <div className="text-[11px] text-neutral-400">
            Cleared confidence gate without manual intervention
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>Critical (P0) Escalations</span>
            <ShieldAlert size={16} className="text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
            {criticalCount}
          </div>
          <div className="text-[11px] text-neutral-400">
            Routed to Incident Response / Platform
          </div>
        </div>
      </div>

      {/* Main Grid: Connected Repos + Recent Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Linked Repositories */}
        <div className="lg:col-span-5 rounded-2xl glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <GitBranch size={17} className="text-indigo-500" />
                <span>Linked Repositories ({repos.length})</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Active webhook & policy thresholds per repo
              </p>
            </div>
            <Link
              href="/repos"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage All →
            </Link>
          </div>

          {repos.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl p-4 space-y-2">
              <p className="text-xs text-neutral-500">No repositories linked yet.</p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl metallic-btn text-xs font-semibold"
              >
                <span>Connect GitHub Repos</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-3.5 rounded-xl metallic-card space-y-2.5 transition-all hover:scale-101"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {repo.fullName}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSyncRepo(repo.id)}
                      disabled={syncingRepoId === repo.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg metallic-badge text-[11px] font-medium transition-colors"
                    >
                      <RefreshCw
                        size={11}
                        className={syncingRepoId === repo.id ? "animate-spin text-indigo-500" : ""}
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
        <div className="lg:col-span-7 rounded-2xl glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Zap size={17} className="text-amber-500" />
                <span>Recent Triage Decisions</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Latest issues classified by Jev 1.13 across all repositories
              </p>
            </div>
            <Link
              href="/inbox"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Open Full Inbox →
            </Link>
          </div>

          {issues.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl p-6 space-y-2">
              <p className="text-xs text-neutral-500">
                No issues have been triaged yet.
              </p>
              <Link
                href="/playground"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg metallic-btn text-xs font-semibold"
              >
                <span>Run a Triage in Playground</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200/50 dark:divide-neutral-800/60">
              {issues.slice(0, 7).map((issue) => {
                const effectivePriority = issue.humanPriority || issue.priority;
                const effectiveCategory = issue.humanCategory || issue.category;
                return (
                  <div
                    key={issue.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/30 px-2 rounded-lg transition-colors"
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
                            ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40"
                            : effectivePriority === "high"
                            ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40"
                            : "metallic-badge"
                        }`}
                      >
                        {effectivePriority}
                      </span>

                      {issue.needsReview && !issue.humanReviewed ? (
                        <Link
                          href="/inbox?needsReview=true"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[11px] font-semibold hover:scale-105 transition-all"
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
