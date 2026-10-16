"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  GitBranch,
  RefreshCw,
  Plus,
  CheckCircle2,
  Sliders,
  Trash2,
  Sparkles,
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
  lastSyncedAt: string | null;
  triagedCount: number;
  pendingReviewCount: number;
}

interface CatalogRepo {
  fullName: string;
  name: string;
  owner: string;
  description: string;
  language: string;
  isPrivate: boolean;
  openIssuesCount: number;
  defaultTeam: string;
}

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<RepoRecord[]>([]);
  const [catalog, setCatalog] = useState<CatalogRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  // Custom repo modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [customFullName, setCustomFullName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customLang, setCustomLang] = useState("TypeScript");
  const [customTeam, setCustomTeam] = useState("Core Engineering");

  const loadRepos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/repos");
      const data = await res.json();
      setRepos(data.repositories || []);
      setCatalog(data.availableCatalog || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/repos")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setRepos(data.repositories || []);
        setCatalog(data.availableCatalog || []);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLinkFromCatalog = async (item: CatalogRepo) => {
    setBanner(`Linking ${item.fullName}...`);
    const res = await fetch("/api/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: item.fullName,
        description: item.description,
        language: item.language,
        isPrivate: item.isPrivate,
        connectionMode: "demo",
        minConfidence: 0.75,
        escalationThreshold: 0.85,
        defaultTeam: item.defaultTeam,
      }),
    });
    if (res.ok) {
      setBanner(`Linked ${item.fullName} and activated webhook listener.`);
      await loadRepos();
    }
  };

  const handleAddCustomRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFullName.trim()) return;
    const res = await fetch("/api/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: customFullName.trim(),
        description: customDesc.trim() || undefined,
        language: customLang,
        defaultTeam: customTeam,
        connectionMode: "demo",
      }),
    });
    if (res.ok) {
      setShowAddModal(false);
      setCustomFullName("");
      setCustomDesc("");
      setBanner(`Linked repository ${customFullName.trim()}`);
      await loadRepos();
    }
  };

  const handleSyncIssues = async (repo: RepoRecord) => {
    setSyncingId(repo.id);
    setBanner(null);
    try {
      const res = await fetch(`/api/repos/${repo.id}/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBanner(
          `Synced ${repo.fullName}: ${data.syncedCount} new issue(s) triaged by Jev 1.13 (${data.totalFound} open issues checked).`
        );
        await loadRepos();
      }
    } finally {
      setSyncingId(null);
    }
  };

  const handleUpdateRepoPolicy = async (
    repoId: string,
    updates: Partial<RepoRecord>
  ) => {
    setSavingId(repoId);
    try {
      const res = await fetch(`/api/repos/${repoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setBanner("Updated repository triage policy.");
        await loadRepos();
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteRepo = async (repoId: string, fullName: string) => {
    await fetch(`/api/repos/${repoId}`, { method: "DELETE" });
    setBanner(`Unlinked ${fullName}`);
    await loadRepos();
  };

  const linkedNames = new Set(repos.map((r) => r.fullName));
  const unlinkedCatalog = catalog.filter((c) => !linkedNames.has(c.fullName));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <GitBranch size={26} />
            <span>GitHub Repositories & Policy Gates</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Link repositories, sync open GitHub issues, and customize confidence & escalation gates per repository.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90"
          >
            <Plus size={15} />
            <span>Link Custom Repository</span>
          </button>
        </div>
      </div>

      {/* Status Notification Banner */}
      {banner && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <span>{banner}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-[11px] underline opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Linked Repositories Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 font-mono">
          Active Linked Repositories ({repos.length})
        </h2>

        {loading ? (
          <div className="py-16 text-center text-xs text-neutral-400">
            Loading linked repositories...
          </div>
        ) : repos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              No repositories linked yet
            </p>
            <p className="text-xs text-neutral-500">
              Select a repository from the discovered GitHub catalog below to enable automated issue triage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 space-y-5 shadow-xs"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-base font-bold text-neutral-900 dark:text-white">
                        {repo.fullName}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 text-neutral-500">
                        {repo.isPrivate ? <Lock size={10} /> : <Globe size={10} />}
                        {repo.isPrivate ? "Private" : "Public"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Webhook size={10} className="inline mr-1" />
                        {repo.webhookActive ? "Webhook Active" : "Paused"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {repo.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRepo(repo.id, repo.fullName)}
                    title="Unlink repository"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Stats Strip */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/70 dark:border-neutral-800 text-xs">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-neutral-400">
                      Triaged Issues
                    </div>
                    <div className="font-mono font-bold text-sm text-neutral-900 dark:text-white mt-0.5">
                      {repo.triagedCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-neutral-400">
                      Pending Review
                    </div>
                    <div className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                      {repo.pendingReviewCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-neutral-400">
                      Default Team
                    </div>
                    <div className="font-medium text-xs text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                      {repo.defaultTeam}
                    </div>
                  </div>
                </div>

                {/* Per-Repo Safety Sliders */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <Sliders size={12} />
                      <span>Min Confidence Gate:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {[0.7, 0.75, 0.85].map((val) => (
                        <button
                          key={val}
                          type="button"
                          disabled={savingId === repo.id}
                          onClick={() =>
                            handleUpdateRepoPolicy(repo.id, { minConfidence: val })
                          }
                          className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-colors ${
                            Math.abs(repo.minConfidence - val) < 0.01
                              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-bold"
                              : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-400"
                          }`}
                        >
                          {(val * 100).toFixed(0)}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">
                      Auto-Push GitHub Labels:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateRepoPolicy(repo.id, {
                          autoSyncLabels: !repo.autoSyncLabels,
                        })
                      }
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
                        repo.autoSyncLabels
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-neutral-300 dark:border-neutral-700 text-neutral-500"
                      }`}
                    >
                      {repo.autoSyncLabels ? "Enabled" : "Manual Only"}
                    </button>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-neutral-400">
                    {repo.lastSyncedAt
                      ? `Last synced ${new Date(repo.lastSyncedAt).toLocaleTimeString()}`
                      : "Not synced yet"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSyncIssues(repo)}
                    disabled={syncingId === repo.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={13}
                      className={syncingId === repo.id ? "animate-spin" : ""}
                    />
                    <span>
                      {syncingId === repo.id
                        ? "Importing & Triaging..."
                        : "Sync Issues from GitHub"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available GitHub Repositories to Link */}
      {unlinkedCatalog.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 font-mono flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-500" />
            <span>Available in Connected GitHub Organization ({unlinkedCatalog.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlinkedCatalog.map((item) => (
              <div
                key={item.fullName}
                className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                      {item.fullName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-500">
                      {item.language}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-900">
                  <span className="text-[11px] font-mono text-neutral-400">
                    {item.openIssuesCount} open issues
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLinkFromCatalog(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-950 text-xs font-semibold transition-colors"
                  >
                    <Plus size={13} />
                    <span>Connect Repo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Repo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 space-y-5 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Link GitHub Repository
            </h3>
            <form onSubmit={handleAddCustomRepo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                  Repository Full Name (owner/repo)
                </label>
                <input
                  type="text"
                  required
                  placeholder="acme-cloud/search-service"
                  value={customFullName}
                  onChange={(e) => setCustomFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Distributed search & indexing pipeline"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={customLang}
                    onChange={(e) => setCustomLang(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                    Routing Team
                  </label>
                  <input
                    type="text"
                    value={customTeam}
                    onChange={(e) => setCustomTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold"
                >
                  Connect Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
