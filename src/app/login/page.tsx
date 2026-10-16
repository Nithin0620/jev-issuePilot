"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Mail, ArrowRight, Lock, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setLoading(false);
        setError("Invalid email or password");
      } else if (res?.ok) {
        // Full page redirect ensures session cookie is committed before route-guard checks
        window.location.href = callbackUrl;
      } else {
        setLoading(false);
        setError("Login failed. Please try again.");
      }
    } catch {
      setLoading(false);
      setError("An unexpected error occurred during sign in.");
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email: "admin@issuepilot.local",
      password: "admin123",
      redirect: false,
    });

    if (res?.error) {
      setLoading(false);
      setError("Demo login failed");
    } else if (res?.ok) {
      const target = callbackUrl === "/dashboard" ? "/onboarding" : callbackUrl;
      window.location.href = target;
    }
  };

  return (
    <div className="w-full max-w-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-2xl p-8 shadow-sm">
      <div className="flex flex-col items-center text-center mb-7">
        <div className="w-12 h-12 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold mb-4 shadow-xs">
          <Shield size={24} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Sign in to IssuePilot
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Access your GitHub repositories, safety policies & review queue
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Instant Demo Workspace Button */}
      <button
        type="button"
        onClick={handleQuickDemoLogin}
        disabled={loading}
        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold text-xs transition-colors"
      >
        <Sparkles size={15} />
        <span>1-Click Demo Login & Launch GitHub Onboarding</span>
      </button>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl })}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium text-xs transition-colors"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>GitHub</span>
        </button>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium text-xs transition-colors"
        >
          <Mail size={15} />
          <span>Google</span>
        </button>
      </div>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-neutral-950 px-2 text-neutral-400">
            Or email & password
          </span>
        </div>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleCredentialsLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
            Work Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="name@company.com"
            className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />
            <Lock
              size={16}
              className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in to Workspace"}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
        <span>New to IssuePilot?</span>
        <Link
          href="/register"
          className="font-semibold text-neutral-900 dark:text-white hover:underline"
        >
          Create a Workspace Account →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-neutral-400">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
