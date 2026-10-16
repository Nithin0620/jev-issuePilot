"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Inbox,
  LayoutDashboard,
  GitBranch,
  BarChart2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  ArrowRight,
  LogOut,
  LogIn,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [repoCount, setRepoCount] = useState<number>(1);
  const [githubConnected, setGithubConnected] = useState<boolean>(true);
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/repos")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.repositories)) {
          setRepoCount(data.repositories.length);
          setGithubConnected(data.repositories.length > 0);
        }
      })
      .catch(() => {});

    fetch("/api/issues")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.issues)) {
          const reviewItems = data.issues.filter(
            (i: { needsReview: boolean; humanReviewed: boolean }) =>
              i.needsReview && !i.humanReviewed
          );
          setPendingReviewCount(reviewItems.length);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Review Inbox",
      href: "/inbox",
      icon: Inbox,
      active: pathname === "/inbox",
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
      badgeTone: "amber",
    },
    {
      label: "Linked Repositories",
      href: "/repos",
      icon: GitBranch,
      active: pathname === "/repos",
      badge: repoCount,
    },
    {
      label: "Decision Simulator",
      href: "/playground",
      icon: Sparkles,
      active: pathname === "/playground",
    },
    {
      label: "Accuracy Metrics",
      href: "/metrics",
      icon: BarChart2,
      active: pathname === "/metrics" || pathname === "/analytics",
    },
    {
      label: "Workspace Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ];

  return (
    <div className="min-h-screen flex text-neutral-900 dark:text-neutral-100 relative">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col glass-panel border-r select-none z-10">
        {/* Brand & Workspace Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-200/50 dark:border-neutral-800/60">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl metallic-btn flex items-center justify-center font-extrabold text-sm tracking-wide">
              IP
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span>IssuePilot</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full metallic-badge">
                  SaaS
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-medium">
                Acme Cloud Workspace
              </div>
            </div>
          </Link>
        </div>

        {/* GitHub Connection Pill */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href={githubConnected ? "/repos" : "/onboarding"}
            className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
              githubConnected
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
                : "border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/15"
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
                    ? "metallic-btn font-semibold shadow-sm scale-102"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100"
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
                        : "metallic-badge"
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
        <div className="p-3 border-t border-neutral-200/50 dark:border-neutral-800/60 space-y-2.5">
          <div className="px-3 py-2 rounded-xl metallic-card text-[11px] flex items-center justify-between">
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
              <div className="text-[11px] text-neutral-400 truncate font-mono">
                {session?.user?.email || "admin@issuepilot.local"}
              </div>
            </div>
            {session?.user ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <LogOut size={15} />
              </button>
            ) : (
              <Link
                href="/login"
                title="Sign in"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <LogIn size={15} />
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top Workspace Bar */}
        <header className="sticky top-0 z-40 h-16 border-b border-neutral-200/50 dark:border-neutral-800/60 glass-panel px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl metallic-badge text-neutral-600 dark:text-neutral-300"
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl metallic-badge text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-all hover:scale-105"
            >
              <GitBranch size={13} />
              <span>Repositories ({repoCount})</span>
            </Link>
            <Link
              href="/playground"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl metallic-btn text-xs font-semibold hover:opacity-90 transition-all"
            >
              <Sparkles size={13} />
              <span>Triage Issue</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-neutral-200 dark:border-neutral-800 glass-panel px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                    item.active
                      ? "metallic-btn font-semibold"
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
