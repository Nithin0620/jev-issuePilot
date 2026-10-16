"use client";

import React, { useEffect, useState } from "react";
import {
  GitBranch,
  RefreshCw,
  Plus,
  Lock,
  Globe,
  Webhook,
} from "lucide-react";

interface RepoRecord {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  isPrivate: boolean;
  connectionMode: string;
  webhookActive: boolean;
  autoSyncLabels: boolean;
  minConfidence: number;
  escalationThreshold: number;
  defaultTeam: string;
  triagedCount: number;
  pendingReviewCount: number;
}

export default function ReposPage() {
  const [repos, setRepos] = useState<RepoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/repos");
      const data = await res.json();
      if (data && Array.isArray(data.repositories)) {
        setRepos(data.repositories);
      }
    } catch (e) {
      console.error("Failed to fetch repositories", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/repos")
      .then((res) => res.json())
      .then((data) => {
        if (active && data && Array.isArray(data.repositories)) {
          setRepos(data.repositories);
        }
      })
      .catch((e) => console.error("Failed to fetch repos", e))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;
    setAddLoading(true);
    setAddError(null);

    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: newFullName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to link repository");
      }
      setNewFullName("");
      setShowAddForm(false);
      await fetchRepos();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to link repository");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateRepoSettings = async (
    id: string,
    updates: Partial<RepoRecord>
  ) => {
    try {
      await fetch(`/api/repos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await fetchRepos();
    } catch (e) {
      console.error("Failed to update repo settings", e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-neutral-800/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <GitBranch size={28} className="text-indigo-500" />
            <span>Linked GitHub Repositories</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Configure safety gates, confidence thresholds, and webhook automation per repository.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl metallic-btn text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={15} />
            <span>Link Repository</span>
          </button>
        </div>
      </div>

      {/* Add Repo Form */}
      {showAddForm && (
        <form onSubmit={handleAddRepo} className="p-6 rounded-2xl glass-card space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <GitBranch size={16} className="text-indigo-500" />
            <span>Link a New GitHub Repository</span>
          </h2>

          {addError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
              {addError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. acme-cloud/payments-service"
              required
              className="flex-1 min-w-[240px] px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
            />
            <button
              type="submit"
              disabled={addLoading}
              className="px-5 py-2.5 rounded-xl metallic-btn text-xs font-semibold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {addLoading ? "Linking..." : "Confirm & Link"}
            </button>
          </div>
        </form>
      )}

      {/* Repos Stream */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-flex items-center gap-3 font-mono text-xs text-neutral-500 metallic-badge px-4 py-2.5 rounded-full">
            <RefreshCw size={15} className="animate-spin text-indigo-500" />
            <span>Loading linked repositories...</span>
          </div>
        </div>
      ) : repos.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-8 space-y-2 glass-card">
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            No repositories connected yet.
          </p>
          <p className="text-xs text-neutral-500">
            Click &quot;Link Repository&quot; above or run onboarding to sync GitHub repos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {repos.map((repo) => (
            <div key={repo.id} className="p-6 rounded-2xl glass-card space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-neutral-900 dark:text-white">
                      {repo.fullName}
                    </span>
                    {repo.isPrivate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono metallic-badge">
                        <Lock size={10} /> Private
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono metallic-badge">
                        <Globe size={10} /> Public
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {repo.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono metallic-badge">
                  <Webhook
                    size={12}
                    className={repo.webhookActive ? "text-emerald-500" : "text-amber-500"}
                  />
                  <span>{repo.webhookActive ? "Webhook Active" : "Polling"}</span>
                </div>
              </div>

              {/* Confidence Threshold Controls */}
              <div className="space-y-3 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/60">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-500">Confidence Review Gate:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      &ge; {(repo.minConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={repo.minConfidence}
                    onChange={(e) =>
                      handleUpdateRepoSettings(repo.id, {
                        minConfidence: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-500">Escalation Threshold:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      &ge; {(repo.escalationThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="0.98"
                    step="0.02"
                    value={repo.escalationThreshold}
                    onChange={(e) =>
                      handleUpdateRepoSettings(repo.id, {
                        escalationThreshold: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-mono text-neutral-400">
                <span>Total Triaged: {repo.triagedCount}</span>
                <span>Pending Review: {repo.pendingReviewCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
