"use client";

import React, { useState } from "react";
import { IssueForm } from "@/components/IssueForm";
import { DecisionCard, DecisionCardProps } from "@/components/DecisionCard";
import { Sparkles, Code2, ArrowDown } from "lucide-react";

export default function PlaygroundPage() {
  const [decision, setDecision] = useState<DecisionCardProps["decision"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-neutral-800/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Sparkles size={26} className="text-indigo-500" />
            <span>AI Decision Playground & Simulator</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Simulate incoming GitHub issues against your repository policy gates and inspect Jev 1.13 structured outputs.
          </p>
        </div>

        {decision && (
          <button
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl metallic-badge text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
          >
            <Code2 size={14} />
            <span>{showRawJson ? "Show Formatted Card" : "Inspect Raw Jev JSON"}</span>
          </button>
        )}
      </div>

      {/* Input Form */}
      <IssueForm
        onTriageSuccess={(res) => setDecision(res)}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />

      {/* Output Stream */}
      {decision && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 justify-center">
            <ArrowDown size={14} className="animate-bounce text-indigo-500" />
            <span>Jev 1.13 Triage Decision Result</span>
          </div>

          {showRawJson ? (
            <div className="p-6 rounded-2xl glass-card font-mono text-xs overflow-x-auto text-emerald-600 dark:text-emerald-400">
              <pre>{JSON.stringify(decision, null, 2)}</pre>
            </div>
          ) : (
            <DecisionCard decision={decision} />
          )}
        </div>
      )}
    </div>
  );
}
