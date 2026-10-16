"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [patToken, setPatToken] = useState("");
  const [orgName, setOrgName] = useState("Acme Cloud Engineering");
  const [selectedRepos, setSelectedRepos] = useState<string[]>([
    "acme-cloud/payments-engine",
    "acme-cloud/web-dashboard",
  ]);
  const [minConfidence, setMinConfidence] = useState(0.75);
  const [escalationThreshold, setEscalationThreshold] = useState(0.85);
  const [autoSync] = useState(true);
  const [finishing, setFinishing] = useState(false);

  const DEMO_REPOS = [
    {
      fullName: "acme-cloud/payments-engine",
      description: "Core Stripe & ledger processing pipeline in Node.js",
      isPrivate: true,
      openIssues: 12,
    },
    {
      fullName: "acme-cloud/web-dashboard",
      description: "Next.js frontend app for SaaS customers",
      isPrivate: false,
      openIssues: 5,
    },
    {
      fullName: "acme-cloud/api-gateway",
      description: "Edge proxy and rate limiting gateway",
      isPrivate: true,
      openIssues: 8,
    },
  ];

  const toggleRepo = (fullName: string) => {
    if (selectedRepos.includes(fullName)) {
      setSelectedRepos(selectedRepos.filter((r) => r !== fullName));
    } else {
      setSelectedRepos([...selectedRepos, fullName]);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          minConfidence,
          escalationThreshold,
          autoSyncLabels: autoSync,
        }),
      });

      for (const repoName of selectedRepos) {
        await fetch("/api/repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: repoName }),
        });
      }

      router.push("/dashboard");
    } catch (e) {
      console.error(e);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8">
      {/* Step Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center justify-center gap-2.5">
          <Sparkles className="text-indigo-500" size={28} />
          <span>IssuePilot Workspace Onboarding</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500">
          Set up your GitHub integrations and safety gate thresholds in 3 easy steps.
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: 1, label: "GitHub Auth" },
          { num: 2, label: "Select Repos" },
          { num: 3, label: "Confidence Gates" },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3 rounded-xl text-center text-xs font-semibold transition-all ${
              step === s.num
                ? "metallic-btn"
                : step > s.num
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                : "glass-card text-neutral-400"
            }`}
          >
            {s.num}. {s.label}
          </div>
        ))}
      </div>

      {/* Step 1: PAT / Org Name */}
      {step === 1 && (
        <div className="p-8 rounded-2xl glass-card space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            1. Connect Workspace & GitHub Access
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                Workspace / Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                GitHub Personal Access Token (Optional for demo)
              </label>
              <input
                type="password"
                value={patToken}
                onChange={(e) => setPatToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl metallic-btn text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
            >
              <span>Continue to Repo Selection</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Repos */}
      {step === 2 && (
        <div className="p-8 rounded-2xl glass-card space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            2. Select Repositories for AI Triage
          </h2>

          <div className="space-y-3">
            {DEMO_REPOS.map((r) => {
              const checked = selectedRepos.includes(r.fullName);
              return (
                <div
                  key={r.fullName}
                  onClick={() => toggleRepo(r.fullName)}
                  className={`p-4 rounded-xl metallic-card flex items-center justify-between cursor-pointer transition-all ${
                    checked ? "border-indigo-500/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="h-4 w-4 rounded accent-indigo-500"
                    />
                    <div>
                      <div className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                        {r.fullName}
                      </div>
                      <div className="text-[11px] text-neutral-500">{r.description}</div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-neutral-400">
                    {r.openIssues} issues
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl metallic-badge text-xs font-semibold"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl metallic-btn text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
            >
              <span>Configure Safety Gates</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Safety Gates & Finish */}
      {step === 3 && (
        <div className="p-8 rounded-2xl glass-card space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            3. Configure AI Confidence Safety Gates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 p-4 rounded-xl metallic-card">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-500">Confidence Gate:</span>
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
                <span className="text-neutral-500">Escalation Threshold:</span>
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

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl metallic-badge text-xs font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={finishing}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl metallic-btn text-xs font-semibold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {finishing ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-indigo-500" />
                  <span>Finishing Setup...</span>
                </>
              ) : (
                <>
                  <span>Complete Onboarding</span>
                  <CheckCircle2 size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
