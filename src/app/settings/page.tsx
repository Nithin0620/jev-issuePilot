"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  KeyRound,
  Sliders,
  CheckCircle2,
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
      .then((d) => {
        if (d?.config) {
          if (d.config.orgName) setOrgName(d.config.orgName);
          if (d.config.githubMode) setGithubMode(d.config.githubMode);
          if (d.config.minConfidence !== undefined) setMinConfidence(d.config.minConfidence);
          if (d.config.escalationThreshold !== undefined) setEscalationThreshold(d.config.escalationThreshold);
          if (d.config.autoSyncLabels !== undefined) setAutoSyncLabels(d.config.autoSyncLabels);
          if (d.config.aiEngineMode) setAiEngineMode(d.config.aiEngineMode);
          if (d.config.tokenHint) setTokenHint(d.config.tokenHint);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          githubMode,
          minConfidence,
          escalationThreshold,
          autoSyncLabels,
          aiEngineMode,
          ...(newToken.trim() ? { personalAccessToken: newToken.trim() } : {}),
        }),
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/github`);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-neutral-800/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <Settings size={28} className="text-indigo-500" />
            <span>Workspace Operations Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Global AI engine modes, GitHub PAT auth, webhook URLs, and default confidence gates.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl metallic-btn text-xs font-semibold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save size={15} />
          <span>{saving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

      {savedToast && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Workspace settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Name */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            Organization & Workspace Details
          </h2>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-medium"
            />
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-white">
            <KeyRound size={18} className="text-indigo-500" />
            <span>GitHub Authentication & Webhooks</span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Personal Access Token
            </label>
            {tokenHint && (
              <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1">
                Active Token: {tokenHint}
              </div>
            )}
            <input
              type="password"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Webhook Endpoint URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/api/webhooks/github`
                    : "/api/webhooks/github"
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono text-neutral-500"
              />
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="px-4 py-2.5 rounded-xl metallic-badge text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
              >
                {copiedWebhook ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* AI Confidence Gates */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-white">
            <Sliders size={18} className="text-indigo-500" />
            <span>Default Confidence Review Gates</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 p-4 rounded-xl metallic-card">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-500">Min Category Confidence:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {(minConfidence * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="space-y-2 p-4 rounded-xl metallic-card">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-500">Escalation Risk Gate:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {(escalationThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="0.98"
                step="0.02"
                value={escalationThreshold}
                onChange={(e) => setEscalationThreshold(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
