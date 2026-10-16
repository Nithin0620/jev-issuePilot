"use client";

import React, { useState } from "react";
import { Send, Sparkles, RefreshCw } from "lucide-react";
import { DecisionCardProps } from "./DecisionCard";

export interface IssueFormProps {
  onTriageSuccess: (result: DecisionCardProps["decision"]) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

const PRESETS = [
  {
    label: "🚨 Production Outage",
    title: "Critical outage: 500 error on all checkout endpoints",
    body: "Every user attempting to checkout receives HTTP 500 Internal Server Error following the v2.4 deploy. Payment gateway connections are failing globally. Immediate escalation needed.",
    repo: "acme-cloud/api-gateway",
  },
  {
    label: "❓ Ambiguous Bug",
    title: "Something weird happened in settings",
    body: "I clicked around the profile page and it looked broken or weird.",
    repo: "acme-cloud/api-gateway",
  },
];

export function IssueForm({
  onTriageSuccess,
  isLoading,
  setIsLoading,
}: IssueFormProps) {
  const [title, setTitle] = useState(PRESETS[0].title);
  const [body, setBody] = useState(PRESETS[0].body);
  const [repository, setRepository] = useState(PRESETS[0].repo);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setTitle(preset.title);
    setBody(preset.body);
    setRepository(preset.repo);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, repository }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to triage issue");
      }

      onTriageSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during triage");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span>Submit Issue for AI Triage</span>
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          IssuePilot evaluates text via Jev&apos;s structured decision model to classify category, estimate severity, and trigger safety review gates.
        </p>

        {/* Preset Selectors */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-neutral-400 mr-1 flex items-center gap-1">
            <Sparkles size={12} /> Presets:
          </span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-all hover:scale-102 active:scale-98"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
              Issue Title <span className="text-neutral-400 font-normal">({title.length}/200)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={5}
              maxLength={200}
              placeholder="e.g. Production login fails with HTTP 500"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
              Repository
            </label>
            <input
              type="text"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              placeholder="e.g. org/repo-name"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 font-mono text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
            Issue Description / Body <span className="text-neutral-400 font-normal">({body.length}/8000)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            minLength={10}
            maxLength={8000}
            rows={5}
            placeholder="Detailed description of the issue or feature request..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 resize-y"
          />
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Calls typed Jev decision model with calibrated confidence rating
          </span>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-sm hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Triaging Issue...</span>
              </>
            ) : (
              <>
                <span>Run Decision Triage</span>
                <Send size={15} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
