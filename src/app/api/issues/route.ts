import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrSetCache } from "@/lib/cache";

async function getCustomRepoCount(): Promise<number> {
  return getOrSetCache("custom_repo_count", async () => {
    return db.repository
      .count({
        where: {
          fullName: { not: "acme-cloud/api-gateway" },
          connectionMode: { not: "demo" },
        },
      })
      .catch(() => 0);
  }, 30_000);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const needsReviewOnly = searchParams.get("needsReview") === "true";
    const repoFilter = searchParams.get("repository");
    const priorityFilter = searchParams.get("priority");

    const customRepoCount = await getCustomRepoCount();

    const whereClause: Record<string, unknown> = {};
    if (needsReviewOnly) {
      whereClause.needsReview = true;
      whereClause.humanReviewed = false;
    }
    if (repoFilter && repoFilter !== "all") {
      whereClause.repository = repoFilter;
    } else if (customRepoCount > 0) {
      whereClause.repository = { not: "acme-cloud/api-gateway" };
    }
    if (priorityFilter && priorityFilter !== "all") {
      whereClause.priority = priorityFilter;
    }

    const pendingWhereClause = {
      needsReview: true,
      humanReviewed: false,
      ...(customRepoCount > 0 && (!repoFilter || repoFilter === "all")
        ? { repository: { not: "acme-cloud/api-gateway" } }
        : repoFilter && repoFilter !== "all"
        ? { repository: repoFilter }
        : {}),
    };

    const [issues, pendingReviewCount] = await Promise.all([
      db.issue.findMany({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.issue.count({
        where: pendingWhereClause,
      }),
    ]);

    return NextResponse.json({
      issues,
      pendingReviewCount,
    });
  } catch {
    return NextResponse.json({
      issues: [],
      pendingReviewCount: 0,
      note: "Database offline, running in stateless mode",
    });
  }
}
