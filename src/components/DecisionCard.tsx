"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  Tag,
  Cpu,
} from "lucide-react";

export interface DecisionCardProps {
  decision: {
    id?: string | null;
    model: string;
    answers: {
      category: {
        choice: string;
        confidence: number;
        probabilities?: Record<string, number>;
      };
      severity: {
        score: number;
        confidence: number;
      };
      needs_escalation: {
        noul: number;
      };
    };
    policy: {
      category: string;
      priority: "low" | "medium" | "high" | "critical";
      needsReview: boolean;
      escalationProbability: number;
      routingTeam: string;
      suggestedLabels: string[];
    };
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
    createdAt?: string;
  };
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const { answers, policy, model, usage } = decision;

  const priorityColors = {
    critical:
      "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white",
    high: "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-950 border-neutral-700",
    medium:
      "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700",
    low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800",
  };

  const getSeverityDescription = (score: number) => {
    if (score >= 2.5) return "Tier 3: Critical outage or core functionality broken";
    if (score >= 1.5) return "Tier 2: Important functionality degraded";
    if (score >= 0.8) return "Tier 1: Limited functionality affected";
    return "Tier 0: Minor inconvenience with simple workaround";
  };

  return (
    <div className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 shadow-sm transition-all duration-300">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-900">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-neutral-400">
              Assigned Priority
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                priorityColors[policy.priority]
              }`}
            >
              {policy.priority}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-600 dark:text-neutral-400">
            <Users size={12} />
            <span>{policy.routingTeam}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <Cpu size={14} />
          <span>{model}</span>
        </div>
      </div>

      {/* Review Gate Banner */}
      {policy.needsReview ? (
        <div className="my-6 p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-900/80 flex items-start gap-3">
          <AlertTriangle
            size={18}
            className="text-neutral-900 dark:text-neutral-100 mt-0.5 shrink-0"
          />
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Flagged for Human Review
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {answers.category.confidence < 0.75 || answers.severity.confidence < 0.75
                ? `Low model confidence (Category: ${(answers.category.confidence * 100).toFixed(
                    0
                  )}%, Severity: ${(answers.severity.confidence * 100).toFixed(
                    0
                  )}%). Requires human confirmation before auto-labeling.`
                : `Borderline escalation risk (${(
                    policy.escalationProbability * 100
                  ).toFixed(0)}%). Review queue verification advised.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="my-6 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
          <CheckCircle2 size={16} className="text-neutral-900 dark:text-neutral-100 shrink-0" />
          <span>High confidence decision. Meets threshold for automated routing.</span>
        </div>
      )}

      {/* Structured Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        {/* Metric 1: Category */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-neutral-50/60 dark:bg-neutral-900/40">
          <div className="text-xs uppercase font-mono tracking-wider text-neutral-400 mb-1">
            Category Decision
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold capitalize text-neutral-900 dark:text-neutral-100">
              {answers.category.choice}
            </span>
            <span className="text-xs font-mono font-medium text-neutral-500">
              {(answers.category.confidence * 100).toFixed(0)}% conf
            </span>
          </div>

          <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-neutral-900 dark:bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, answers.category.confidence * 100)}%` }}
            />
          </div>

          {answers.category.probabilities && (
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 gap-1 text-[11px] font-mono text-neutral-500">
              {Object.entries(answers.category.probabilities).map(([cat, prob]) => (
                <div key={cat} className="flex justify-between">
                  <span className="capitalize">{cat}:</span>
                  <span>{(prob * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metric 2: Severity Score */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-neutral-50/60 dark:bg-neutral-900/40">
          <div className="text-xs uppercase font-mono tracking-wider text-neutral-400 mb-1">
            Severity Impact Score
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {answers.severity.score.toFixed(1)} <span className="text-sm text-neutral-400">/ 3.0</span>
            </span>
            <span className="text-xs font-mono font-medium text-neutral-500">
              {(answers.severity.confidence * 100).toFixed(0)}% conf
            </span>
          </div>

          <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-neutral-900 dark:bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${(answers.severity.score / 3) * 100}%` }}
            />
          </div>

          <p className="mt-3 text-[11px] text-neutral-500 leading-snug">
            {getSeverityDescription(answers.severity.score)}
          </p>
        </div>

        {/* Metric 3: Escalation Risk */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-neutral-50/60 dark:bg-neutral-900/40">
          <div className="text-xs uppercase font-mono tracking-wider text-neutral-400 mb-1">
            Escalation Probability
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {(answers.needs_escalation.noul * 100).toFixed(1)}%
            </span>
            <span className="text-xs font-mono font-medium text-neutral-500">
              {answers.needs_escalation.noul >= 0.85
                ? "Immediate"
                : answers.needs_escalation.noul >= 0.6
                ? "Borderline"
                : "Routine"}
            </span>
          </div>

          <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                answers.needs_escalation.noul >= 0.85
                  ? "bg-neutral-900 dark:bg-white"
                  : "bg-neutral-500 dark:bg-neutral-400"
              }`}
              style={{
                width: `${answers.needs_escalation.noul * 100}%`,
              }}
            />
          </div>

          <p className="mt-3 text-[11px] text-neutral-500 leading-snug">
            {answers.needs_escalation.noul >= 0.85
              ? "Major outage or critical blocker requiring incident response."
              : "Standard operational triage handling."}
          </p>
        </div>
      </div>

      {/* Suggested GitHub Labels & Usage */}
      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-neutral-400" />
          <span className="text-xs font-mono text-neutral-400">Labels:</span>
          <div className="flex flex-wrap gap-1.5">
            {policy.suggestedLabels.map((lbl) => (
              <span
                key={lbl}
                className="px-2 py-0.5 rounded text-[11px] font-mono border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
              >
                {lbl}
              </span>
            ))}
          </div>
        </div>

        {usage && (
          <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-3">
            <span>In: {usage.input_tokens ?? 0} tokens</span>
            <span>•</span>
            <span>Out: {usage.output_tokens ?? 0} tokens</span>
          </div>
        )}
      </div>
    </div>
  );
}
