"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  History,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface IssueItem {
  id: string;
  title: string;
  body: string;
  repository: string;
  category: string;
  categoryConfidence: number;
  severity: number;
  severityConfidence: number;
  escalationProbability: number;
  priority: string;
  suggestedTeam: string;
  needsReview: boolean;
  humanReviewed: boolean;
  humanCategory?: string;
  humanPriority?: string;
  humanNotes?: string;
  model: string;
  appliedLabels: string[];
  createdAt: string;
}

export default function HistoryPage() {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [overrideCategory, setOverrideCategory] = useState("bug");
  const [overridePriority, setOverridePriority] = useState("medium");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const refreshIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/issues?needsReview=${filterNeedsReview}`);
      const data = await res.json();
      setIssues(data.issues || []);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [filterNeedsReview]);

  useEffect(() => {
    let active = true;
    fetch(`/api/issues?needsReview=${filterNeedsReview}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setIssues(data.issues || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setIssues([]);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [filterNeedsReview]);

  const handleApprove = async (id: string) => {
    setReviewing(true);
    try {
      await fetch(`/api/issues/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      refreshIssues();
      setSelectedIssue(null);
    } finally {
      setReviewing(false);
    }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setReviewing(true);
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
      refreshIssues();
      setSelectedIssue(null);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <History size={28} />
            <span>Decision Audit & Review Queue</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Persisted history of AI decisions, confidence ratings, and human overrides.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterNeedsReview(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              !filterNeedsReview
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                : "border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
            }`}
          >
            All Decisions
          </button>
          <button
            onClick={() => setFilterNeedsReview(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              filterNeedsReview
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                : "border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
            }`}
          >
            <AlertTriangle size={14} />
            <span>Needs Human Review</span>
          </button>
          <button
            onClick={refreshIssues}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="py-20 text-center text-sm text-neutral-400">
          Loading persisted issues...
        </div>
      ) : issues.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-8">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No issues found in this view.
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Run a triage test from the Live Triage page to populate the audit history.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 uppercase font-mono">
                <tr>
                  <th className="px-4 py-3">Issue Title & Repo</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Escalation</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {issues.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors"
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 truncate">
                        {item.repository}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize font-medium text-neutral-800 dark:text-neutral-200">
                        {item.humanCategory || item.category}
                      </span>
                      <div className="text-[10px] font-mono text-neutral-400">
                        {(item.categoryConfidence * 100).toFixed(0)}% conf
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {item.severity.toFixed(1)}/3.0
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {(item.escalationProbability * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900">
                        {item.humanPriority || item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.humanReviewed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                          <CheckCircle size={12} /> Approved
                        </span>
                      ) : item.needsReview ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                          <AlertTriangle size={12} /> Needs Review
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Auto-routed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.needsReview && !item.humanReviewed ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={reviewing}
                            className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIssue(item);
                              setOverrideCategory(item.category);
                              setOverridePriority(item.priority);
                            }}
                            className="px-2.5 py-1 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-[11px] font-medium hover:opacity-90 transition-opacity"
                          >
                            Override
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-neutral-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Override AI Classification
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                {selectedIssue.title}
              </p>
            </div>

            <form onSubmit={handleOverride} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Correct Category
                  </label>
                  <select
                    value={overrideCategory}
                    onChange={(e) => setOverrideCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm"
                  >
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="question">Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Correct Priority
                  </label>
                  <select
                    value={overridePriority}
                    onChange={(e) => setOverridePriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                  Reviewer Notes
                </label>
                <textarea
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  rows={3}
                  placeholder="Reason for overriding AI decision..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Save & Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
