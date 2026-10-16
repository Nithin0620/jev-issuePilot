import { NextResponse } from "next/server";
import { db } from "@/lib/db";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const needsReviewOnly = searchParams.get("needsReview") === "true";
    const repoFilter = searchParams.get("repository");
    const priorityFilter = searchParams.get("priority");

    const customRepoCount = await db.repository
      .count({
        where: {
          fullName: { not: "acme-cloud/api-gateway" },
          connectionMode: { not: "demo" },
        },
      })
      .catch(() => 0);

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

    const issues = await db.issue.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const pendingReviewCount = await db.issue.count({
      where: {
        needsReview: true,
        humanReviewed: false,
        ...(customRepoCount > 0 && (!repoFilter || repoFilter === "all")
          ? { repository: { not: "acme-cloud/api-gateway" } }
          : repoFilter && repoFilter !== "all"
          ? { repository: repoFilter }
          : {}),
      },
    });

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
