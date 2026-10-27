import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fetchGitHubRepositories } from "@/lib/github";
import { getOrSetCache, invalidateCache } from "@/lib/cache";

const UpdateWorkspaceSchema = z.object({
  organizationName: z.string().min(2).max(100).optional(),
  githubConnected: z.boolean().optional(),
  githubConnectionMode: z.enum(["none", "demo", "pat", "oauth"]).optional(),
  githubUsername: z.string().max(100).nullable().optional(),
  githubToken: z.string().max(255).optional(),
  onboardingCompleted: z.boolean().optional(),
  defaultMinConfidence: z.number().min(0.5).max(0.99).optional(),
  defaultEscalation: z.number().min(0.5).max(0.99).optional(),
  autoSyncLabels: z.boolean().optional(),
});

export async function getWorkspaceConfig() {
  return getOrSetCache("workspace_config", async () => {
    let dbConfig = null;
    try {
      dbConfig = await db.workspaceConfig.findUnique({
        where: { id: "default" },
      });
      if (!dbConfig) {
        dbConfig = await db.workspaceConfig.create({
          data: {
            id: "default",
            organizationName: "Acme Cloud Engineering",
            githubConnected: Boolean(process.env.GITHUB_TOKEN),
            githubConnectionMode: process.env.GITHUB_TOKEN ? "pat" : "none",
            githubUsername: "acme-cloud",
            defaultMinConfidence: 0.75,
            defaultEscalation: 0.85,
            autoSyncLabels: true,
          },
        });
      }
    } catch {
      // Fallback to null if DB is unavailable
    }
    return dbConfig;
  }, 60_000);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenParam = searchParams.get("token") || undefined;

  let config = {
    id: "default",
    organizationName: "Acme Cloud Engineering",
    githubConnected: Boolean(process.env.GITHUB_TOKEN),
    githubConnectionMode: process.env.GITHUB_TOKEN ? "pat" : "demo",
    githubUsername: "acme-cloud",
    githubTokenHint: process.env.GITHUB_TOKEN ? "ghp_••••••configured" : null,
    onboardingCompleted: false,
    defaultMinConfidence: 0.75,
    defaultEscalation: 0.85,
    autoSyncLabels: true,
  };

  const dbConfig = await getWorkspaceConfig();

  if (dbConfig) {
    config = {
      ...dbConfig,
      githubUsername: dbConfig.githubUsername ?? "acme-cloud",
    };
  }

  try {
    const effectiveToken =
      tokenParam || dbConfig?.githubToken || process.env.GITHUB_TOKEN || undefined;
    const catalog = await fetchGitHubRepositories(effectiveToken);

    return NextResponse.json({
      config: {
        ...config,
        githubToken: undefined,
      },
      catalog: catalog.repositories,
      catalogMode: catalog.mode,
      aiEngineMode:
        process.env.MOCK_JEV === "true" || !process.env.TYPESAFE_API_KEY
          ? "mock/jev-deterministic-v1"
          : "typesafe/jev-1.13",
      webhookConfigured: Boolean(process.env.GITHUB_WEBHOOK_SECRET),
    });
  } catch {
    const catalog = await fetchGitHubRepositories(tokenParam);
    return NextResponse.json({
      config,
      catalog: catalog.repositories,
      catalogMode: catalog.mode,
      aiEngineMode: "mock/jev-deterministic-v1",
      webhookConfigured: false,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const parsed = UpdateWorkspaceSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid workspace settings", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const tokenHint = data.githubToken
      ? `${data.githubToken.slice(0, 6)}••••${data.githubToken.slice(-4)}`
      : undefined;

    if (data.githubToken) {
      process.env.GITHUB_TOKEN = data.githubToken;
    }

    try {
      const updated = await db.workspaceConfig.upsert({
        where: { id: "default" },
        update: {
          ...(data.organizationName !== undefined && {
            organizationName: data.organizationName,
          }),
          ...(data.githubConnected !== undefined && {
            githubConnected: data.githubConnected,
          }),
          ...(data.githubConnectionMode !== undefined && {
            githubConnectionMode: data.githubConnectionMode,
          }),
          ...(data.githubUsername !== undefined && {
            githubUsername: data.githubUsername,
          }),
          ...(tokenHint !== undefined && { githubTokenHint: tokenHint }),
          ...(data.githubToken !== undefined && { githubToken: data.githubToken }),
          ...(data.onboardingCompleted !== undefined && {
            onboardingCompleted: data.onboardingCompleted,
          }),
          ...(data.defaultMinConfidence !== undefined && {
            defaultMinConfidence: data.defaultMinConfidence,
          }),
          ...(data.defaultEscalation !== undefined && {
            defaultEscalation: data.defaultEscalation,
          }),
          ...(data.autoSyncLabels !== undefined && {
            autoSyncLabels: data.autoSyncLabels,
          }),
        },
        create: {
          id: "default",
          organizationName: data.organizationName ?? "Acme Cloud Engineering",
          githubConnected: data.githubConnected ?? true,
          githubConnectionMode: data.githubConnectionMode ?? "demo",
          githubUsername: data.githubUsername ?? "acme-cloud",
          githubTokenHint: tokenHint ?? null,
          githubToken: data.githubToken ?? null,
          onboardingCompleted: data.onboardingCompleted ?? false,
          defaultMinConfidence: data.defaultMinConfidence ?? 0.75,
          defaultEscalation: data.defaultEscalation ?? 0.85,
          autoSyncLabels: data.autoSyncLabels ?? true,
        },
      });

      invalidateCache("workspace_config");

      return NextResponse.json({
        config: {
          ...updated,
          githubToken: undefined,
        },
      });
    } catch {
      return NextResponse.json({
        config: {
          id: "default",
          ...data,
        },
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Unable to update workspace settings" },
      { status: 500 }
    );
  }
}
