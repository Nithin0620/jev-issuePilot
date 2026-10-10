import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const totalIssues = await db.issue.count();
    const needsReviewCount = await db.issue.count({ where: { needsReview: true } });
    const humanReviewedCount = await db.issue.count({ where: { humanReviewed: true } });

    // Category distribution
    const categoryGroups = await db.issue.groupBy({
      by: ["category"],
      _count: { category: true },
    });

    // Priority distribution
    const priorityGroups = await db.issue.groupBy({
      by: ["priority"],
      _count: { priority: true },
    });

    // Check human overrides agreement
    const reviewedIssues = await db.issue.findMany({
      where: { humanReviewed: true },
      select: { category: true, humanCategory: true },
    });

    let agreedCount = 0;
    for (const item of reviewedIssues) {
      if (!item.humanCategory || item.category === item.humanCategory) {
        agreedCount++;
      }
    }

    const humanAgreementRate =
      reviewedIssues.length > 0
        ? ((agreedCount / reviewedIssues.length) * 100).toFixed(1)
        : "100.0";

    const reviewRate =
      totalIssues > 0
        ? ((needsReviewCount / totalIssues) * 100).toFixed(1)
        : "0.0";

    return NextResponse.json({
      totalIssues,
      needsReviewCount,
      reviewRate: `${reviewRate}%`,
      humanReviewedCount,
      humanAgreementRate: `${humanAgreementRate}%`,
      categoryDistribution: categoryGroups.map((g) => ({
        category: g.category,
        count: g._count.category,
      })),
      priorityDistribution: priorityGroups.map((g) => ({
        priority: g.priority,
        count: g._count.priority,
      })),
    });
  } catch {
    return NextResponse.json({
      totalIssues: 0,
      needsReviewCount: 0,
      reviewRate: "0.0%",
      humanReviewedCount: 0,
      humanAgreementRate: "100.0%",
      categoryDistribution: [],
      priorityDistribution: [],
    });
  }
}
