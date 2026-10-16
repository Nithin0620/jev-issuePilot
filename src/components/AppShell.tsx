"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import {
  LayoutDashboard,
  Inbox,
  GitBranch,
  Sparkles,
  BarChart3,
  Settings,
  Compass,
  LogOut,
  LogIn,
  ArrowRight,
  ShieldCheck,
  Menu,
  X,
  CheckCircle2,
  Cpu,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [repoCount, setRepoCount] = useState(0);
  const [githubConnected, setGithubConnected] = useState(false);

  const isMarketingRoute =
    pathname === "/" || pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (isMarketingRoute) return;
    let active = true;

    Promise.all([
      fetch("/api/issues?needsReview=true").then((r) => r.json()).catch(() => ({})),
      fetch("/api/repos").then((r) => r.json()).catch(() => ({})),
      fetch("/api/workspace").then((r) => r.json()).catch(() => ({})),
    ]).then(([issuesData, reposData, wsData]) => {
      if (!active) return;
      if (typeof issuesData?.pendingReviewCount === "number") {
        setPendingReviews(issuesData.pendingReviewCount);
      }
      if (Array.isArray(reposData?.repositories)) {
        setRepoCount(reposData.repositories.length);
      }
      if (wsData?.config?.githubConnected || (reposData?.repositories?.length ?? 0) > 0) {
        setGithubConnected(true);
      }
    });

    return () => {
      active = false;
    };
  }, [pathname, isMarketingRoute]);

  if (isMarketingRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:scale-105 transition-transform">
                  IP
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-white">
                    IssuePilot
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
                    Jev 1.13
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                <Link
                  href="/#pipeline"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Pipeline
                </Link>
                <Link
                  href="/#features"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Safety Gates
                </Link>
                <Link
                  href="/playground"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Live Playground
                </Link>
                <Link
                  href="/dashboard"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Workspace
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <span>Open Workspace</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
                  >
                    <span>Start Free</span>
                    <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-neutral-200 dark:border-neutral-800 py-10 bg-neutral-50/50 dark:bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-[11px]">
                IP
              </div>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                IssuePilot SaaS
              </span>
              <span>•</span>
              <span>Structured AI GitHub Triage & Policy Engine</span>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/dashboard" className="hover:underline">
                Command Center
              </Link>
              <Link href="/repos" className="hover:underline">
                Repositories
              </Link>
              <Link href="/inbox" className="hover:underline">
                Review Inbox
              </Link>
              <Link href="/playground" className="hover:underline">
                AI Playground
              </Link>
              <Link href="/analytics" className="hover:underline">
                Telemetry
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  const navItems = [
    {
      label: "Command Center",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Review Inbox",
      href: "/inbox",
      icon: Inbox,
      active: pathname === "/inbox" || pathname === "/history",
      badge: pendingReviews > 0 ? pendingReviews : undefined,
      badgeTone: "amber" as const,
    },
    {
      label: "Repositories",
      href: "/repos",
      icon: GitBranch,
      active: pathname.startsWith("/repos"),
      badge: repoCount > 0 ? repoCount : undefined,
      badgeTone: "neutral" as const,
    },
    {
      label: "AI Playground",
      href: "/playground",
      icon: Sparkles,
      active: pathname === "/playground",
    },
    {
      label: "Telemetry & Eval",
      href: "/analytics",
      icon: BarChart3,
      active: pathname === "/analytics" || pathname === "/metrics",
    },
    {
      label: "GitHub Onboarding",
      href: "/onboarding",
      icon: Compass,
      active: pathname === "/onboarding",
    },
    {
      label: "Workspace Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ];

  return (
    <div className="min-h-screen flex bg-neutral-50/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 select-none">
        {/* Brand & Workspace Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm">
              IP
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span>IssuePilot</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  SaaS
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                Acme Cloud Workspace
              </div>
            </div>
          </Link>
        </div>

        {/* GitHub Connection Pill */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href={githubConnected ? "/repos" : "/onboarding"}
            className={`w-full px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition-colors ${
              githubConnected
                ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/15"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={14}
                className={githubConnected ? "text-emerald-500" : "text-amber-500"}
              />
              <span className="font-medium">
                {githubConnected
                  ? `${repoCount} GitHub Repo${repoCount === 1 ? "" : "s"} Linked`
                  : "Connect GitHub"}
              </span>
            </div>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  item.active
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      item.badgeTone === "amber"
                        ? item.active
                          ? "bg-amber-400 text-neutral-950"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : item.active
                        ? "bg-neutral-700 text-white dark:bg-neutral-200 dark:text-neutral-900"
                        : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Model Engine Footer + User Card */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800/80 space-y-2.5">
          <div className="px-3 py-2 rounded-xl bg-neutral-100/80 dark:bg-neutral-900/70 border border-neutral-200/70 dark:border-neutral-800 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <Cpu size={13} className="text-emerald-500" />
              <span className="font-mono">typesafe/jev-1.13</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {session?.user?.name || "Demo Admin"}
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                {session?.user?.email || "admin@issuepilot.local"}
              </div>
            </div>
            {session?.user ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                <LogOut size={15} />
              </button>
            ) : (
              <Link
                href="/login"
                title="Sign in"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                <LogIn size={15} />
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Bar */}
        <header className="sticky top-0 z-40 h-16 border-b border-neutral-200 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <ShieldCheck size={15} className="text-emerald-500" />
              <span className="hidden sm:inline font-medium text-neutral-700 dark:text-neutral-300">
                Structured AI Triage Workspace
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="font-mono text-[11px] text-neutral-400">{pathname}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/repos"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <GitBranch size={13} />
              <span>Repositories ({repoCount})</span>
            </Link>
            <Link
              href="/playground"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Sparkles size={13} />
              <span>Triage Issue</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                    item.active
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-500">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
