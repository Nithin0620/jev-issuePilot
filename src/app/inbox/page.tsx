"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Sliders,
  Check,
  Sparkles,
} from "lucide-react";

interface IssueItem {
  id: string;
  title: string;
  body: string;
  repository: string;
  githubIssueNumber?: number;
  githubSynced?: boolean;
  category: string;
  categoryConfidence: number;
  severity: number;
  severityConfidence: number;
  escalationProbability: number;
  priority: string;
  suggestedTeam: string;
  rawProbabilities?: Record<string, number> | null;
  needsReview: boolean;
  humanReviewed: boolean;
  humanCategory?: string | null;
  humanPriority?: string | null;
  createdAt: string;
}

export default function InboxPage() {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNeedsReview, setFilterNeedsReview] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/issues";
      if (filterNeedsReview !== null) {
        url += `?needsReview=${filterNeedsReview}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data && Array.isArray(data.issues)) {
        setIssues(data.issues);
      }
    } catch (e) {
      console.error("Failed to fetch issues", e);
    } finally {
      setLoading(false);
    }
  }, [filterNeedsReview]);

  useEffect(() => {
    let active = true;
    fetch("/api/issues" + (filterNeedsReview !== null ? `?needsReview=${filterNeedsReview}` : ""))
      .then((res) => res.json())
      .then((data) => {
        if (active && data && Array.isArray(data.issues)) {
          setIssues(data.issues);
        }
      })
      .catch((e) => console.error("Failed to fetch issues", e))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filterNeedsReview]);

  const handleReviewAction = async (
    issueId: string,
    action: "approve" | "override",
    overrideData?: { category?: string; priority?: string }
  ) => {
    setActionLoadingId(issueId);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          humanCategory: overrideData?.category,
          humanPriority: overrideData?.priority,
        }),
      });
      if (res.ok) {
        await fetchIssues();
      }
    } catch (e) {
      console.error("Failed to submit review action", e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredIssues = issues.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      i.repository.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.priority.toLowerCase().includes(q)
    );
  });

  const pendingReviewCount = issues.filter((i) => i.needsReview && !i.humanReviewed).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-neutral-800/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <Inbox size={28} className="text-indigo-500" />
            <span>AI Decision Review Inbox</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Human-in-the-loop review queue for low confidence predictions and escalation safety gates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchIssues()}
            className="p-2.5 rounded-xl metallic-badge text-neutral-600 dark:text-neutral-300 hover:scale-105 active:scale-95 transition-all"
            title="Refresh Inbox"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-indigo-500" : ""} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterNeedsReview(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterNeedsReview === null
                ? "metallic-btn font-semibold"
                : "glass-card text-neutral-600 dark:text-neutral-400"
            }`}
          >
            All Issues ({issues.length})
          </button>
          <button
            onClick={() => setFilterNeedsReview(true)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              filterNeedsReview === true
                ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-semibold"
                : "glass-card text-neutral-600 dark:text-neutral-400"
            }`}
          >
            <AlertTriangle size={13} className="text-amber-500" />
            <span>Needs Review ({pendingReviewCount})</span>
          </button>
          <button
            onClick={() => setFilterNeedsReview(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              filterNeedsReview === false
                ? "metallic-btn font-semibold"
                : "glass-card text-neutral-600 dark:text-neutral-400"
            }`}
          >
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Auto-Cleared</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-3 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, repo, label..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl glass-input text-xs text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-flex items-center gap-3 font-mono text-xs text-neutral-500 metallic-badge px-4 py-2.5 rounded-full">
            <RefreshCw size={15} className="animate-spin text-indigo-500" />
            <span>Loading decision stream...</span>
          </div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-8 space-y-2 glass-card">
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            No issues match the selected review criteria.
          </p>
          <p className="text-xs text-neutral-500">
            All triage items are either cleared or no incoming webhooks are pending review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const isPending = issue.needsReview && !issue.humanReviewed;
            const effectiveCategory = issue.humanCategory || issue.category;
            const effectivePriority = issue.humanPriority || issue.priority;

            return (
              <div
                key={issue.id}
                className={`p-6 rounded-2xl glass-card space-y-4 transition-all ${
                  isPending ? "border-amber-500/40" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {issue.repository}
                      </span>
                      {issue.githubIssueNumber && (
                        <span className="font-mono text-xs text-neutral-400">
                          #{issue.githubIssueNumber}
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <AlertTriangle size={10} /> Needs Review
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 pt-1 font-mono bg-neutral-100/50 dark:bg-neutral-900/50 p-2.5 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60">
                      {issue.body}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                        effectivePriority === "critical"
                          ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40"
                          : effectivePriority === "high"
                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40"
                          : "metallic-badge"
                      }`}
                    >
                      {effectivePriority}
                    </span>

                    <span className="text-[11px] font-mono text-neutral-400">
                      Team: {issue.suggestedTeam}
                    </span>
                  </div>
                </div>

                {/* Model Confidence & Metrics Pill Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/60 text-xs">
                  <div className="p-2.5 rounded-xl metallic-card flex items-center justify-between">
                    <span className="text-neutral-500 font-mono">Category:</span>
                    <span className="font-semibold capitalize text-neutral-900 dark:text-white">
                      {effectiveCategory} ({(issue.categoryConfidence * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl metallic-card flex items-center justify-between">
                    <span className="text-neutral-500 font-mono">Severity:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {issue.severity.toFixed(1)} / 3.0 ({(issue.severityConfidence * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl metallic-card flex items-center justify-between">
                    <span className="text-neutral-500 font-mono">Escalation:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {(issue.escalationProbability * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Review Gate Action Controls */}
                {isPending && (
                  <div className="pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3 bg-amber-500/5 -mx-6 -mb-6 p-4 rounded-b-2xl">
                    <div className="text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>Low model confidence triggers required operator sign-off</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewAction(issue.id, "approve")}
                        disabled={actionLoadingId === issue.id}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        <Check size={14} />
                        <span>Approve Decision</span>
                      </button>

                      <button
                        onClick={() =>
                          handleReviewAction(issue.id, "override", {
                            category: "bug",
                            priority: "high",
                          })
                        }
                        disabled={actionLoadingId === issue.id}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl metallic-badge text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        <Sliders size={14} />
                        <span>Override (P1 Bug)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
