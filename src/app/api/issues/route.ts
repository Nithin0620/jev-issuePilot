import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const needsReviewOnly = searchParams.get("needsReview") === "true";

    const issues = await db.issue.findMany({
      where: needsReviewOnly
        ? { needsReview: true, humanReviewed: false }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const pendingReviewCount = await db.issue.count({
      where: { needsReview: true, humanReviewed: false },
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
