"use client";

import React, { useEffect, useState } from "react";
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

  const refreshMetrics = () => {
    setLoading(true);
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (active) setMetrics(data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-neutral-800/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <BarChart3 size={28} className="text-indigo-500" />
            <span>AI Triage Precision Metrics</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time evaluation of confidence gates, review rates, and model alignment accuracy.
          </p>
        </div>

        <button
          onClick={refreshMetrics}
          className="p-2.5 rounded-xl metallic-badge text-neutral-600 dark:text-neutral-300 hover:scale-105 active:scale-95 transition-all"
          title="Refresh Metrics"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-indigo-500" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-flex items-center gap-3 font-mono text-xs text-neutral-500 metallic-badge px-4 py-2.5 rounded-full">
            <RefreshCw size={15} className="animate-spin text-indigo-500" />
            <span>Computing analytics...</span>
          </div>
        </div>
      ) : metrics ? (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl glass-card space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Total Evaluated</span>
                <Layers size={16} className="text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white">
                {metrics.totalIssues}
              </div>
              <div className="text-[11px] text-neutral-400">Total processed issues</div>
            </div>

            <div className="p-5 rounded-2xl glass-card space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
                <span>Review Gate Trigger Rate</span>
                <AlertTriangle size={16} className="text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                {metrics.reviewRate}
              </div>
              <div className="text-[11px] text-neutral-400">
                {metrics.needsReviewCount} flagged for review
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Human Operator Agreement</span>
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {metrics.humanAgreementRate}
              </div>
              <div className="text-[11px] text-neutral-400">
                {metrics.humanReviewedCount} reviewed sign-offs
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Model Calibration</span>
                <Shield size={16} className="text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                Jev 1.13
              </div>
              <div className="text-[11px] text-neutral-400">Calibrated confidence scores</div>
            </div>
          </div>

          {/* Distributions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl glass-card space-y-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Category Distribution
              </h3>
              <div className="space-y-3">
                {metrics.categoryDistribution.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="capitalize">{cat.category}</span>
                      <span>{cat.count}</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{
                          width: `${
                            metrics.totalIssues
                              ? (cat.count / metrics.totalIssues) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl glass-card space-y-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Priority Distribution
              </h3>
              <div className="space-y-3">
                {metrics.priorityDistribution.map((prio) => (
                  <div key={prio.priority} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="capitalize">{prio.priority}</span>
                      <span>{prio.count}</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          prio.priority === "critical"
                            ? "bg-rose-500"
                            : prio.priority === "high"
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                        }`}
                        style={{
                          width: `${
                            metrics.totalIssues
                              ? (prio.count / metrics.totalIssues) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
