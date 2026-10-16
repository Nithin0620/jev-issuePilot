"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  KeyRound,
  Webhook,
  Sliders,
  Cpu,
  CheckCircle2,
  Copy,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("Acme Cloud Engineering");
  const [githubMode, setGithubMode] = useState<"none" | "demo" | "pat" | "oauth">("demo");
  const [tokenHint, setTokenHint] = useState<string | null>(null);
  const [newToken, setNewToken] = useState("");
  const [minConfidence, setMinConfidence] = useState(0.75);
  const [escalationThreshold, setEscalationThreshold] = useState(0.85);
  const [autoSyncLabels, setAutoSyncLabels] = useState(true);
  const [aiEngineMode, setAiEngineMode] = useState("mock/jev-deterministic-v1");
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    fetch("/api/workspace")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          setOrgName(data.config.organizationName || "Acme Cloud Engineering");
          setGithubMode(data.config.githubConnectionMode || "demo");
          setTokenHint(data.config.githubTokenHint || null);
          setMinConfidence(data.config.defaultMinConfidence ?? 0.75);
          setEscalationThreshold(data.config.defaultEscalation ?? 0.85);
          setAutoSyncLabels(data.config.autoSyncLabels ?? true);
        }
        if (data?.aiEngineMode) {
          setAiEngineMode(data.aiEngineMode);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedToast(false);

    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: orgName,
          githubConnected: true,
          githubConnectionMode: newToken.trim() ? "pat" : githubMode,
          ...(newToken.trim() ? { githubToken: newToken.trim() } : {}),
          defaultMinConfidence: minConfidence,
          defaultEscalation: escalationThreshold,
          autoSyncLabels,
        }),
      });
      const data = await res.json();
      if (data?.config?.githubTokenHint) {
        setTokenHint(data.config.githubTokenHint);
      }
      setNewToken("");
      setSavedToast(true);
    } finally {
      setSaving(false);
    }
  };

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/github`
      : "http://localhost:3000/api/webhooks/github";

  const copyWebhook = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
          <Settings size={26} />
          <span>Workspace & Integration Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Configure GitHub credentials, webhook endpoints, and global Jev 1.13 safety policy defaults.
        </p>
      </div>

      {savedToast && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 size={15} className="text-emerald-500" />
          <span>Workspace settings saved and applied.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Organization & AI Engine Card */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Cpu size={17} className="text-emerald-500" />
              <span>Workspace & AI Decision Engine</span>
            </h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {aiEngineMode}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full max-w-md px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
        </div>

        {/* GitHub Connection & Webhook Card */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <KeyRound size={17} />
              <span>GitHub API & Webhook Integration</span>
            </h2>
            <span className="text-xs font-mono text-neutral-500 uppercase">
              Mode: {githubMode}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                GitHub Personal Access Token (Optional)
              </label>
              <input
                type="password"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder={tokenHint || "ghp_xxxxxxxxxxxxxxxxxxxx"}
                className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-mono text-xs"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Used to fetch live repositories and push triage labels back to GitHub issues.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                Webhook Delivery URL (HMAC-SHA256)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 font-mono text-xs text-neutral-600 dark:text-neutral-300 truncate">
                  <Webhook size={12} className="inline mr-1.5 text-neutral-400" />
                  {webhookUrl}
                </div>
                <button
                  type="button"
                  onClick={copyWebhook}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium inline-flex items-center gap-1"
                >
                  <Copy size={13} />
                  <span>{copiedWebhook ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Configure in GitHub Repo Settings → Webhooks → <code className="font-mono">Issues</code> event.
              </p>
            </div>
          </div>
        </div>

        {/* Default Policy Thresholds Card */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 space-y-5">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Sliders size={17} />
            <span>Global Default Safety Gate Policy</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold">Default Min Confidence</span>
                <span className="font-mono font-bold">
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
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold">Default Critical Escalation</span>
                <span className="font-mono font-bold">
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
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={autoSyncLabels}
              onChange={(e) => setAutoSyncLabels(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="font-medium">
              Enable automatic GitHub label push by default for newly linked repositories
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
          >
            <Save size={15} />
            <span>{saving ? "Saving..." : "Save Workspace Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
