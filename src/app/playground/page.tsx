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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Sparkles size={26} />
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-mono font-semibold"
          >
            <Code2 size={14} />
            <span>{showRawJson ? "Hide Raw JSON" : "Inspect Raw JSON"}</span>
          </button>
        )}
      </div>

      {/* Intake Simulator Form */}
      <IssueForm
        onTriageSuccess={(res) => setDecision(res)}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />

      {/* Decision Output */}
      {decision && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs uppercase font-mono tracking-wider text-neutral-400">
            <ArrowDown size={14} />
            <span>Structured Model Output & Safety Gate Routing</span>
          </div>
          <DecisionCard decision={decision} />

          {showRawJson && (
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-emerald-400 p-5 overflow-x-auto text-xs font-mono">
              <pre>{JSON.stringify(decision, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
