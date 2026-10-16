"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  CheckCircle2,
  Sliders,
  Sparkles,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Lock,
  Globe,
} from "lucide-react";

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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [connectionMode, setConnectionMode] = useState<"demo" | "pat">("demo");
  const [githubToken, setGithubToken] = useState("");
  const [orgName, setOrgName] = useState("Acme Cloud Engineering");
  const [catalog, setCatalog] = useState<CatalogRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([
    "acme-cloud/api-gateway",
  ]);
  const [minConfidence, setMinConfidence] = useState(0.75);
  const [escalationThreshold, setEscalationThreshold] = useState(0.85);
  const [autoSyncLabels, setAutoSyncLabels] = useState(true);
  const [syncInitialIssues, setSyncInitialIssues] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    fetch("/api/workspace")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.catalog)) {
          setCatalog(data.catalog);
        }
        if (data?.config?.organizationName) {
          setOrgName(data.config.organizationName);
        }
      })
      .catch(() => {});
  }, []);

  const handleConnectDemo = async () => {
    setConnectionMode("demo");
    setLoadingCatalog(true);
    try {
      const res = await fetch("/api/workspace");
      const data = await res.json();
      if (Array.isArray(data?.catalog)) {
        setCatalog(data.catalog);
        setSelectedRepos(data.catalog.slice(0, 3).map((r: CatalogRepo) => r.fullName));
      }
      setStep(2);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleConnectPat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken.trim()) return;
    setConnectionMode("pat");
    setLoadingCatalog(true);
    try {
      const res = await fetch(
        `/api/workspace?token=${encodeURIComponent(githubToken.trim())}`
      );
      const data = await res.json();
      if (Array.isArray(data?.catalog)) {
        setCatalog(data.catalog);
        setSelectedRepos(data.catalog.slice(0, 3).map((r: CatalogRepo) => r.fullName));
      }
      setStep(2);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const toggleRepo = (fullName: string) => {
    setSelectedRepos((prev) =>
      prev.includes(fullName)
        ? prev.filter((item) => item !== fullName)
        : [...prev, fullName]
    );
  };

  const handleFinishOnboarding = async () => {
    setSubmitting(true);
    try {
      setStatusText("Saving workspace configuration...");
      await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: orgName,
          githubConnected: true,
          githubConnectionMode: connectionMode,
          githubUsername: connectionMode === "demo" ? "acme-cloud" : "github-user",
          ...(githubToken.trim() ? { githubToken: githubToken.trim() } : {}),
          onboardingCompleted: true,
          defaultMinConfidence: minConfidence,
          defaultEscalation: escalationThreshold,
          autoSyncLabels,
        }),
      });

      const chosenCatalogItems = catalog.filter((c) =>
        selectedRepos.includes(c.fullName)
      );

      const createdRepoIds: string[] = [];
      for (const repoItem of chosenCatalogItems) {
        setStatusText(`Linking ${repoItem.fullName}...`);
        const res = await fetch("/api/repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: repoItem.fullName,
            description: repoItem.description,
            language: repoItem.language,
            isPrivate: repoItem.isPrivate,
            connectionMode,
            webhookActive: true,
            autoSyncLabels,
            minConfidence,
            escalationThreshold,
            defaultTeam: repoItem.defaultTeam || "Core Engineering",
          }),
        });
        const data = await res.json();
        if (data?.repository?.id) {
          createdRepoIds.push(data.repository.id);
        }
      }

      if (syncInitialIssues && createdRepoIds.length > 0) {
        setStatusText("Importing & triaging open GitHub issues with Jev 1.13...");
        await Promise.all(
          createdRepoIds.slice(0, 2).map((id) =>
            fetch(`/api/repos/${id}/sync`, { method: "POST" })
          )
        );
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Header & Step Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={14} />
            <span>Workspace Setup Wizard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
            Connect GitHub & Configure AI Triage
          </h1>
        </div>

        {/* Stepper Pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {[
            { num: 1, label: "1. GitHub Auth" },
            { num: 2, label: "2. Link Repos" },
            { num: 3, label: "3. Safety Policy" },
          ].map((item) => (
            <div
              key={item.num}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                step === item.num
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-bold"
                  : step > item.num
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-neutral-200 dark:border-neutral-800 text-neutral-400"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Connect GitHub */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option 1: 1-Click Demo GitHub Organization */}
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-white dark:bg-neutral-950 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Sparkles size={13} />
                <span>Recommended for Instant Evaluation</span>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Connect Demo GitHub Org (acme-cloud)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Instantly link 5 realistic engineering repositories (API Gateway, Web Dashboard, Payments Engine, Auth Service, TypeScript SDK) with simulated GitHub webhooks and live Jev triage.
              </p>
              <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Pre-loaded microservices & realistic GitHub issues</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Full webhook & 2-way label sync simulation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>No external GitHub credentials required</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleConnectDemo}
              disabled={loadingCatalog}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {loadingCatalog ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  <GitBranch size={16} />
                  <span>Connect Demo GitHub Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Option 2: Live GitHub Personal Access Token */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-xs font-medium">
                <KeyRound size={13} />
                <span>Live GitHub REST API</span>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Connect Real GitHub Account (PAT)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Provide a GitHub Personal Access Token with <code className="font-mono">repo</code> and <code className="font-mono">issues</code> scope to fetch your actual repositories, import open issues, and push triage labels directly.
              </p>

              <form onSubmit={handleConnectPat} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">
                    Organization / Workspace Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">
                    GitHub Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-mono text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingCatalog || !githubToken.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <span>Fetch My GitHub Repositories</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Select Repositories */}
      {step === 2 && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Select Repositories to Monitor ({selectedRepos.length} selected)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                IssuePilot will attach webhook listeners and apply structured AI triage to selected repositories.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedRepos(
                  selectedRepos.length === catalog.length
                    ? []
                    : catalog.map((r) => r.fullName)
                )
              }
              className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:underline"
            >
              {selectedRepos.length === catalog.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            {catalog.map((repo) => {
              const isSelected = selectedRepos.includes(repo.fullName);
              return (
                <label
                  key={repo.fullName}
                  className={`flex items-start justify-between gap-4 p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-emerald-500/5 dark:bg-emerald-500/10"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRepo(repo.fullName)}
                      className="mt-1 h-4 w-4 rounded border-neutral-300"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                          {repo.fullName}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 text-neutral-500">
                          {repo.isPrivate ? <Lock size={10} /> : <Globe size={10} />}
                          {repo.isPrivate ? "Private" : "Public"}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                          {repo.language}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {repo.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono text-neutral-500">
                      {repo.openIssuesCount} open issues
                    </span>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Team: {repo.defaultTeam}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-800 text-xs font-semibold"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={selectedRepos.length === 0}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold disabled:opacity-50"
            >
              <span>Continue to Safety Thresholds</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Configure Safety Gate Thresholds */}
      {step === 3 && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Sliders size={18} className="text-emerald-500" />
              <span>Configure AI Decision Safety Gates</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Set the default confidence and escalation thresholds for your {selectedRepos.length} linked repositories. You can customize these per repository at any time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Minimum Auto-Label Confidence
                </label>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {(minConfidence * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={0.95}
                step={0.05}
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                className="w-full accent-neutral-900 dark:accent-white"
              />
              <p className="text-[11px] text-neutral-500">
                Issues where Jev&apos;s category or severity confidence falls below{" "}
                <strong>{(minConfidence * 100).toFixed(0)}%</strong> are held in the Human Review Inbox.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Critical P0 Escalation Threshold
                </label>
                <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                  {(escalationThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.65}
                max={0.95}
                step={0.05}
                value={escalationThreshold}
                onChange={(e) => setEscalationThreshold(parseFloat(e.target.value))}
                className="w-full accent-neutral-900 dark:accent-white"
              />
              <p className="text-[11px] text-neutral-500">
                Issues with <code className="font-mono">noul</code> probability ≥{" "}
                <strong>{(escalationThreshold * 100).toFixed(0)}%</strong> are marked{" "}
                <code className="font-mono">priority:critical</code> and routed to Incident Response.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncLabels}
                onChange={(e) => setAutoSyncLabels(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Automatically push labels to GitHub on high-confidence decisions
                </div>
                <div className="text-[11px] text-neutral-500">
                  Applies <code className="font-mono">type:*</code> and <code className="font-mono">priority:*</code> labels via the GitHub REST API when needsReview is false.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 cursor-pointer">
              <input
                type="checkbox"
                checked={syncInitialIssues}
                onChange={(e) => setSyncInitialIssues(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Import and triage open issues from linked repositories right now
                </div>
                <div className="text-[11px] text-neutral-500">
                  Populates your Command Center and Review Inbox immediately so you can inspect decisions right away.
                </div>
              </div>
            </label>
          </div>

          {submitting && statusText && (
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center gap-2.5 text-xs font-mono text-neutral-600 dark:text-neutral-300">
              <RefreshCw size={14} className="animate-spin text-emerald-500" />
              <span>{statusText}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-800 text-xs font-semibold"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleFinishOnboarding}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Provisioning Workspace...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup & Launch Workspace</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
