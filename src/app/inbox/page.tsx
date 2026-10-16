"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Tag,
  Cpu,
  Users,
  Sliders,
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
  humanCategory?: string;
  humanPriority?: string;
  humanNotes?: string;
  model: string;
  appliedLabels: string[];
  createdAt: string;
}

export default function InboxPage() {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState<"all" | "review" | "critical" | "reviewed">("all");
  const [repoFilter, setRepoFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Override form state
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideCategory, setOverrideCategory] = useState("bug");
  const [overridePriority, setOverridePriority] = useState("medium");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/issues");
      const data = await res.json();
      const loaded: IssueItem[] = data.issues || [];
      setIssues(loaded);
      if (loaded.length > 0 && !selectedId) {
        setSelectedId(loaded[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    let active = true;
    fetch("/api/issues")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const loaded: IssueItem[] = data.issues || [];
        setIssues(loaded);
        if (loaded.length > 0) {
          setSelectedId((prev) => prev ?? loaded[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const repositories = Array.from(
    new Set(issues.map((i) => i.repository).filter(Boolean))
  );

  const filteredIssues = issues.filter((item) => {
    if (tabFilter === "review" && (!item.needsReview || item.humanReviewed)) {
      return false;
    }
    if (
      tabFilter === "critical" &&
      (item.humanPriority || item.priority) !== "critical"
    ) {
      return false;
    }
    if (tabFilter === "reviewed" && !item.humanReviewed) {
      return false;
    }
    if (repoFilter !== "all" && item.repository !== repoFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.repository.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedIssue =
    filteredIssues.find((i) => i.id === selectedId) || filteredIssues[0] || null;

  const handleSelectIssue = (issue: IssueItem) => {
    setSelectedId(issue.id);
    setShowOverrideForm(false);
    setOverrideCategory(issue.humanCategory || issue.category);
    setOverridePriority(issue.humanPriority || issue.priority);
    setOverrideNotes(issue.humanNotes || "");
  };

  const handleApprove = async (issueId: string) => {
    setSubmittingReview(true);
    try {
      await fetch(`/api/issues/${issueId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      await loadIssues();
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setSubmittingReview(true);
    try {
      await fetch(`/api/issues/${selectedIssue.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override",
          humanCategory: overrideCategory,
          humanPriority: overridePriority,
          humanNotes: overrideNotes,
        }),
      });
      setShowOverrideForm(false);
      await loadIssues();
    } finally {
      setSubmittingReview(false);
    }
  };

  const pendingReviewTotal = issues.filter(
    (i) => i.needsReview && !i.humanReviewed
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Inbox size={26} />
            <span>Triage Review Inbox & Audit Log</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Inspect structured Jev 1.13 probabilities, approve uncertain decisions, and sync labels back to GitHub.
          </p>
        </div>

        <button
          type="button"
          onClick={loadIssues}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: `All (${issues.length})` },
            {
              id: "review",
              label: `Needs Review (${pendingReviewTotal})`,
              highlight: pendingReviewTotal > 0,
            },
            { id: "critical", label: "Critical P0" },
            { id: "reviewed", label: "Human Reviewed" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setTabFilter(tab.id as "all" | "review" | "critical" | "reviewed")
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                tabFilter === tab.id
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                  : tab.highlight
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={repoFilter}
            onChange={(e) => setRepoFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-mono"
          >
            <option value="all">All Repositories</option>
            {repositories.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-2 text-neutral-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter issues..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs w-48 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Split-Pane Layout */}
      {loading ? (
        <div className="py-20 text-center text-sm text-neutral-400">
          Loading triage inbox...
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-14 text-center space-y-2">
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            No issues match this filter
          </p>
          <p className="text-xs text-neutral-500">
            Sync issues from a linked GitHub repository on the Repositories page or submit a test issue in the AI Playground.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Issue Queue List */}
          <div className="lg:col-span-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 divide-y divide-neutral-200 dark:divide-neutral-800 overflow-hidden max-h-[720px] overflow-y-auto">
            {filteredIssues.map((item) => {
              const isSelected = selectedIssue?.id === item.id;
              const effPriority = item.humanPriority || item.priority;
              const effCategory = item.humanCategory || item.category;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectIssue(item)}
                  className={`w-full text-left p-4 transition-colors space-y-2 ${
                    isSelected
                      ? "bg-neutral-100/90 dark:bg-neutral-900"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-neutral-500 truncate">
                      {item.repository}
                      {item.githubIssueNumber ? `#${item.githubIssueNumber}` : ""}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        effPriority === "critical"
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          : effPriority === "high"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                      }`}
                    >
                      {effPriority}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                    {item.title}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="capitalize font-mono text-neutral-500">
                      {effCategory} • {(item.categoryConfidence * 100).toFixed(0)}% conf
                    </span>

                    {item.humanReviewed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 size={12} /> Reviewed
                      </span>
                    ) : item.needsReview ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                        <AlertTriangle size={12} /> Needs Review
                      </span>
                    ) : (
                      <span className="text-neutral-400">Auto-Routed</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Pane: Issue Inspector & Review Controls */}
          {selectedIssue && (
            <div className="lg:col-span-7 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 space-y-6">
              {/* Top Metadata Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                    <span>{selectedIssue.repository}</span>
                    {selectedIssue.githubIssueNumber && (
                      <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
                        #{selectedIssue.githubIssueNumber}
                      </span>
                    )}
                    <span>•</span>
                    <span>
                      {selectedIssue.githubSynced
                        ? "GitHub Labels Synced"
                        : "Pending Label Push"}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {selectedIssue.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    <Users size={12} />
                    <span>{selectedIssue.suggestedTeam}</span>
                  </span>
                </div>
              </div>

              {/* Issue Body */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                {selectedIssue.body}
              </div>

              {/* Structured Jev 1.13 Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="text-[10px] font-mono uppercase text-neutral-400">
                    Category Classification
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold capitalize text-neutral-900 dark:text-white">
                      {selectedIssue.humanCategory || selectedIssue.category}
                    </span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      {(selectedIssue.categoryConfidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                  {selectedIssue.rawProbabilities && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900 grid grid-cols-2 gap-1 text-[10px] font-mono text-neutral-500">
                      {Object.entries(selectedIssue.rawProbabilities).map(
                        ([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="capitalize">{k}:</span>
                            <span>{(Number(v) * 100).toFixed(0)}%</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="text-[10px] font-mono uppercase text-neutral-400">
                    Severity Rubric Score
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                      {selectedIssue.severity.toFixed(1)} / 3.0
                    </span>
                    <span className="text-xs font-mono text-neutral-500">
                      {(selectedIssue.severityConfidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-white rounded-full"
                      style={{ width: `${(selectedIssue.severity / 3) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="text-[10px] font-mono uppercase text-neutral-400">
                    Escalation Risk (noul)
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                      {(selectedIssue.escalationProbability * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs font-mono uppercase text-neutral-500">
                      {selectedIssue.humanPriority || selectedIssue.priority}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{
                        width: `${selectedIssue.escalationProbability * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Applied Labels & Model Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-neutral-100 dark:border-neutral-900">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-neutral-400" />
                  <span className="text-neutral-400 font-mono">GitHub Labels:</span>
                  {selectedIssue.appliedLabels.map((lbl) => (
                    <span
                      key={lbl}
                      className="px-2 py-0.5 rounded font-mono text-[11px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                    >
                      {lbl}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
                  <Cpu size={13} />
                  <span>{selectedIssue.model}</span>
                </div>
              </div>

              {/* Operator Action Bar */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Human Operator Controls
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {selectedIssue.humanReviewed
                        ? `Reviewed${
                            selectedIssue.humanNotes
                              ? ` — "${selectedIssue.humanNotes}"`
                              : ""
                          }`
                        : "Approve AI decision or override classification before pushing labels to GitHub."}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={submittingReview}
                      onClick={() => handleApprove(selectedIssue.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      <span>
                        {selectedIssue.humanReviewed
                          ? "Re-Sync Labels"
                          : "Approve & Sync to GitHub"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOverrideForm(!showOverrideForm);
                        setOverrideCategory(
                          selectedIssue.humanCategory || selectedIssue.category
                        );
                        setOverridePriority(
                          selectedIssue.humanPriority || selectedIssue.priority
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <Sliders size={14} />
                      <span>Override Decision</span>
                    </button>
                  </div>
                </div>

                {/* Inline Override Form */}
                {showOverrideForm && (
                  <form
                    onSubmit={handleOverride}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">
                          Override Category
                        </label>
                        <select
                          value={overrideCategory}
                          onChange={(e) => setOverrideCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                        >
                          <option value="bug">Bug</option>
                          <option value="feature">Feature</option>
                          <option value="question">Question</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">
                          Override Priority
                        </label>
                        <select
                          value={overridePriority}
                          onChange={(e) => setOverridePriority(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                        >
                          <option value="critical">Critical (P0)</option>
                          <option value="high">High (P1)</option>
                          <option value="medium">Medium (P2)</option>
                          <option value="low">Low (P3)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">
                        Audit Notes
                      </label>
                      <input
                        type="text"
                        value={overrideNotes}
                        onChange={(e) => setOverrideNotes(e.target.value)}
                        placeholder="Why is this classification being overridden?"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowOverrideForm(false)}
                        className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold"
                      >
                        Save Override & Push Labels
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
