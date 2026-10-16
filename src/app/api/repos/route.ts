import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { DEMO_GITHUB_REPOS } from "@/lib/github";

const CreateRepoSchema = z.object({
  fullName: z.string().trim().min(3).max(200),
  description: z.string().max(2000).nullable().optional(),
  language: z.string().max(100).nullable().optional().default("TypeScript"),
  isPrivate: z.boolean().optional().default(false),
  connectionMode: z.enum(["demo", "pat", "oauth"]).optional().default("demo"),
  webhookActive: z.boolean().optional().default(true),
  autoSyncLabels: z.boolean().optional().default(true),
  minConfidence: z.number().min(0.5).max(0.99).optional().default(0.75),
  escalationThreshold: z.number().min(0.5).max(0.99).optional().default(0.85),
  defaultTeam: z.string().max(100).optional().default("Core Engineering"),
});

export async function GET() {
  try {
    const repos = await db.repository.findMany({
      orderBy: { createdAt: "desc" },
    });

    const issueCounts = await db.issue.groupBy({
      by: ["repository"],
      _count: { repository: true },
    });

    const pendingCounts = await db.issue.groupBy({
      by: ["repository"],
      where: { needsReview: true, humanReviewed: false },
      _count: { repository: true },
    });

    const countMap = new Map(
      issueCounts.map((item) => [item.repository || "default", item._count.repository])
    );
    const pendingMap = new Map(
      pendingCounts.map((item) => [item.repository || "default", item._count.repository])
    );

    const hasCustomRepos = repos.some(
      (r) => r.fullName !== "acme-cloud/api-gateway" && r.connectionMode !== "demo"
    );

    const filteredRepos = hasCustomRepos
      ? repos.filter((r) => r.fullName !== "acme-cloud/api-gateway")
      : repos;

    const enriched = filteredRepos.map((r) => ({
      ...r,
      triagedCount: countMap.get(r.fullName) ?? 0,
      pendingReviewCount: pendingMap.get(r.fullName) ?? 0,
    }));

    return NextResponse.json({
      repositories: enriched,
      availableCatalog: hasCustomRepos ? [] : DEMO_GITHUB_REPOS,
    });
  } catch {
    return NextResponse.json({
      repositories: [],
      availableCatalog: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = CreateRepoSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid repository payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const parts = data.fullName.split("/");
    const owner = parts.length > 1 ? parts[0] : "acme-cloud";
    const name = parts.length > 1 ? parts.slice(1).join("/") : data.fullName;
    const normalizedFullName = `${owner}/${name}`;

    try {
      // If user connects a real custom repo, purge demo repo and its dummy issues
      if (
        normalizedFullName !== "acme-cloud/api-gateway" &&
        data.connectionMode !== "demo"
      ) {
        await db.issue
          .deleteMany({
            where: { repository: "acme-cloud/api-gateway" },
          })
          .catch(() => {});
        await db.repository
          .deleteMany({
            where: { fullName: "acme-cloud/api-gateway" },
          })
          .catch(() => {});
      }

      const repo = await db.repository.upsert({
        where: { fullName: normalizedFullName },
        update: {
          description: data.description,
          language: data.language,
          isPrivate: data.isPrivate,
          connectionMode: data.connectionMode,
          webhookActive: data.webhookActive,
          autoSyncLabels: data.autoSyncLabels,
          minConfidence: data.minConfidence,
          escalationThreshold: data.escalationThreshold,
          defaultTeam: data.defaultTeam,
        },
        create: {
          fullName: normalizedFullName,
          owner,
          name,
          description:
            data.description ||
            `Connected GitHub repository ${normalizedFullName} monitored by IssuePilot`,
          language: data.language,
          isPrivate: data.isPrivate,
          connectionMode: data.connectionMode,
          webhookActive: data.webhookActive,
          autoSyncLabels: data.autoSyncLabels,
          minConfidence: data.minConfidence,
          escalationThreshold: data.escalationThreshold,
          defaultTeam: data.defaultTeam,
        },
      });

      return NextResponse.json({ repository: repo }, { status: 201 });
    } catch (upsertError) {
      console.error("[POST /api/repos] Upsert DB error:", upsertError);
      return NextResponse.json(
        {
          repository: {
            id: `local-${Date.now()}`,
            ...data,
            fullName: normalizedFullName,
            owner,
            name,
          },
        },
        { status: 201 }
      );
    }
  } catch (err) {
    console.error("[POST /api/repos] Unhandled error:", err);
    return NextResponse.json(
      { error: "Failed to link repository" },
      { status: 500 }
    );
  }
}
