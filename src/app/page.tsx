"use client";

import React, { useState } from "react";
import { IssueForm } from "@/components/IssueForm";
import { DecisionCard } from "@/components/DecisionCard";
import { ShieldCheck, ArrowDown, Activity } from "lucide-react";

export default function HomePage() {
  const [decision, setDecision] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Hero Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <ShieldCheck size={14} className="text-neutral-900 dark:text-neutral-100" />
          <span>Production AI Decision Pipeline • Dual-Mode</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Intelligent GitHub Issue Triage
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Evaluates incoming issues with Jev AI's structured decision model to compute classifications, rubric-based severity, and escalation probabilities with human review gates.
        </p>
      </div>

      {/* Intake Form */}
      <IssueForm
        onTriageSuccess={(res) => setDecision(res)}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />

      {/* Decision Output Card */}
      {decision && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-center gap-2 text-xs uppercase font-mono tracking-wider text-neutral-400">
            <ArrowDown size={14} />
            <span>AI Decision & Routing Metadata</span>
          </div>
          <DecisionCard decision={decision} />
        </div>
      )}
    </div>
  );
}
