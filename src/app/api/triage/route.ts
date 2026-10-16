import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyIssue } from "@/lib/jev";
import { applyPolicy } from "@/lib/policy";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

const IssueSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(200),
  body: z.string().trim().min(10, "Body must be at least 10 characters").max(8000),
  repository: z.string().trim().max(200).optional().default("default"),
});

export async function POST(request: Request) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous-client";
    const rateLimit = checkRateLimit(`triage:${clientIp}`, { maxRequests: 60, windowMs: 60 * 1000 });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before submitting more issues." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateLimit.resetInMs / 1000).toString(),
          },
        }
      );
    }
    const json = await request.json();
    const parsed = IssueSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid issue input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const triageResult = await classifyIssue(parsed.data);

    let repoOptions: {
      minConfidence?: number;
      escalationThreshold?: number;
      defaultTeam?: string;
    } = {};

    try {
      const linkedRepo = await db.repository.findUnique({
        where: { fullName: parsed.data.repository },
      });
      if (linkedRepo) {
        repoOptions = {
          minConfidence: linkedRepo.minConfidence,
          escalationThreshold: linkedRepo.escalationThreshold,
          defaultTeam: linkedRepo.defaultTeam,
        };
      }
    } catch {
      // Fallback to default policy thresholds
    }

    const policy = applyPolicy(triageResult.answers, repoOptions);

    // Persist to PostgreSQL (if DB is configured & online)
    let savedId: string | null = null;
    try {
      const saved = await db.issue.create({
        data: {
          title: parsed.data.title,
          body: parsed.data.body,
          repository: parsed.data.repository,
          category: triageResult.answers.category.choice,
          categoryConfidence: triageResult.answers.category.confidence,
          severity: triageResult.answers.severity.score,
          severityConfidence: triageResult.answers.severity.confidence,
          escalationProbability: triageResult.answers.needs_escalation.noul,
          priority: policy.priority,
          suggestedTeam: policy.routingTeam,
          needsReview: policy.needsReview,
          appliedLabels: policy.suggestedLabels,
          model: triageResult.model,
          rawProbabilities: triageResult.answers.category.probabilities ?? {},
          inputTokens: triageResult.usage?.input_tokens ?? null,
          outputTokens: triageResult.usage?.output_tokens ?? null,
        },
      });
      savedId = saved.id;
    } catch (dbErr) {
      console.warn("DB write skipped or failed (operating in stateless/dev mode):", dbErr);
    }

    return NextResponse.json({
      id: savedId,
      model: triageResult.model,
      answers: triageResult.answers,
      policy,
      usage: triageResult.usage,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Triage failed:", error);
    return NextResponse.json(
      { error: "Unable to process issue triage at this time" },
      { status: 502 }
    );
  }
}
