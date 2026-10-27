"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Lock, AlertCircle } from "lucide-react";
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
        setError("Invalid email or password");
        setLoading(false);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("An unexpected authentication error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl glass-card space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-xl metallic-btn flex items-center justify-center font-black text-lg">
          IP
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Sign In to IssuePilot
        </h1>
        <p className="text-xs text-neutral-500">
          Enter your credentials or use GitHub OAuth
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCredentialsLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@issuepilot.local"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl metallic-btn text-xs font-semibold hover:scale-102 active:scale-98 transition-all disabled:opacity-50"
        >
          <span>{loading ? "Authenticating..." : "Sign In with Credentials"}</span>
          <ArrowRight size={14} />
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-indigo-500 hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs font-mono text-neutral-500">Loading auth form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
