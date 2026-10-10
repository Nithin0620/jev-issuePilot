import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { History } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IssuePilot — AI GitHub Issue Triage Platform",
  description:
    "AI-powered issue classification, severity scoring, escalation routing, and decision audit with Jev AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md transition-colors">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Brand Logo */}
                <div className="flex items-center gap-6">
                  <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm tracking-tight transition-transform group-hover:scale-105">
                      IP
                    </div>
                    <div>
                      <div className="font-bold text-base tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                        IssuePilot
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                          Jev 1.13
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Navigation Links */}
                  <nav className="hidden md:flex items-center gap-1 text-sm">
                    <Link
                      href="/"
                      className="px-3 py-1.5 rounded-md text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white font-medium transition-colors"
                    >
                      Live Triage
                    </Link>
                    <Link
                      href="/history"
                      className="px-3 py-1.5 rounded-md text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white font-medium transition-colors flex items-center gap-1.5"
                    >
                      <History size={15} />
                      History & Reviews
                    </Link>
                  </nav>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                  <ThemeToggle />

                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    Account
                  </Link>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span>IssuePilot • Structured Decision Engine</span>
                  <span className="text-neutral-300 dark:text-neutral-700">|</span>
                  <span className="font-mono">Node 22 • Next.js 15 • PostgreSQL</span>
                </div>
                <div className="flex items-center gap-4 text-neutral-500">
                  <span>Dual-Mode AI (Live Jev / Heuristic Mock)</span>
                </div>
              </div>
            </footer>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
