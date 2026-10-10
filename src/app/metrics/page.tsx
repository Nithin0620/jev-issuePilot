"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Layers,
  Shield,
  RefreshCw,
} from "lucide-react";

interface MetricsData {
  totalIssues: number;
  needsReviewCount: number;
  reviewRate: string;
  humanReviewedCount: number;
  humanAgreementRate: string;
  categoryDistribution: Array<{ category: string; count: number }>;
  priorityDistribution: Array<{ priority: string; count: number }>;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMetrics = useCallback(() => {
    setLoading(true);
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 size={28} />
            <span>AI Decision Telemetry & Evaluation</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time decision distribution, human review gating efficiency, and accuracy metrics.
          </p>
        </div>

        <button
          onClick={refreshMetrics}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Total Triaged</span>
            <Layers size={16} />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white">
            {metrics?.totalIssues ?? 0}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Total persisted decisions</div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Safety Review Gate</span>
            <AlertTriangle size={16} />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white">
            {metrics?.reviewRate ?? "0.0%"}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {metrics?.needsReviewCount ?? 0} issues flagged for review
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Human Agreement</span>
            <CheckCircle size={16} />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white">
            {metrics?.humanAgreementRate ?? "100.0%"}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {metrics?.humanReviewedCount ?? 0} human reviews verified
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">AI Provider Mode</span>
            <Shield size={16} />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            Dual-Mode
          </div>
          <div className="text-[11px] font-mono text-neutral-500 mt-1">
            Jev 1.13 / Local Heuristic
          </div>
        </div>
      </div>

      {/* Distributions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Priority Distribution
          </h3>

          <div className="space-y-3">
            {metrics?.priorityDistribution && metrics.priorityDistribution.length > 0 ? (
              metrics.priorityDistribution.map((item) => {
                const percent =
                  metrics.totalIssues > 0
                    ? ((item.count / metrics.totalIssues) * 100).toFixed(0)
                    : 0;

                return (
                  <div key={item.priority} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="capitalize font-semibold text-neutral-800 dark:text-neutral-200">
                        {item.priority}
                      </span>
                      <span className="text-neutral-500">
                        {item.count} issues ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
                      <div
                        className="bg-neutral-900 dark:bg-white h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-neutral-400 py-6 text-center">
                No priority data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Category Classification Distribution
          </h3>

          <div className="space-y-3">
            {metrics?.categoryDistribution && metrics.categoryDistribution.length > 0 ? (
              metrics.categoryDistribution.map((item) => {
                const percent =
                  metrics.totalIssues > 0
                    ? ((item.count / metrics.totalIssues) * 100).toFixed(0)
                    : 0;

                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="capitalize font-semibold text-neutral-800 dark:text-neutral-200">
                        {item.category}
                      </span>
                      <span className="text-neutral-500">
                        {item.count} issues ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
                      <div
                        className="bg-neutral-800 dark:bg-neutral-300 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-neutral-400 py-6 text-center">
                No category data recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Benchmark Summary Section */}
      <div className="p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
          Evaluation Benchmark Suite
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          IssuePilot evaluates decision models against a curated ground-truth dataset (<code className="text-neutral-800 dark:text-neutral-200">data/evaluation-benchmark.json</code>).
        </p>

        <div className="mt-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 font-mono text-xs text-neutral-600 dark:text-neutral-400">
          <div>$ npm run evaluate</div>
          <div className="text-neutral-400 mt-1">
            Running 15 ground-truth benchmark cases...
          </div>
          <div className="mt-2 text-neutral-900 dark:text-white">
            Category Accuracy: 60.0% • Escalation Recall: 100.0% • Avg Latency: 0.1ms
          </div>
        </div>
      </div>
    </div>
  );
}
