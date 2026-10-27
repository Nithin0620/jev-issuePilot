import { NextResponse } from "next/server";
import {
  verifyGitHubWebhookSignature,
  addLabelsToGitHubIssue,
  GitHubWebhookPayload,
} from "@/lib/github";
import { classifyIssue } from "@/lib/jev";
import { applyPolicy } from "@/lib/policy";
import { db } from "@/lib/db";
import { getWorkspaceConfig } from "@/app/api/workspace/route";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");
    const deliveryId = request.headers.get("x-github-delivery");

    if (process.env.GITHUB_WEBHOOK_SECRET) {
      const isValid = verifyGitHubWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    if (event !== "issues") {
      return NextResponse.json(
        { status: "ignored", message: `Event ${event} is not supported` },
        { status: 200 }
      );
    }

    const payload: GitHubWebhookPayload = JSON.parse(rawBody);

    if (payload.action !== "opened" || !payload.issue) {
      return NextResponse.json(
        { status: "ignored", message: `Action ${payload.action} not triaged` },
        { status: 200 }
      );
    }

    const repoFullName = payload.repository?.full_name ?? "unknown/repo";
    const repoName = payload.repository?.name ?? "repo";
    const owner = payload.repository?.owner?.login ?? "unknown";
    const issueNumber = payload.issue.number;

    if (deliveryId) {
      try {
        const existing = await db.issue.findUnique({
          where: { githubDeliveryId: deliveryId },
        });
        if (existing) {
          return NextResponse.json(
            { status: "duplicate", id: existing.id },
            { status: 200 }
          );
        }
      } catch (dbErr) {
        console.warn("DB deduplication check skipped:", dbErr);
      }
    }

    const triageResult = await classifyIssue({
      title: payload.issue.title,
      body: payload.issue.body || "",
      repository: repoFullName,
    });

    const policy = applyPolicy(triageResult.answers);

    const ws = await getWorkspaceConfig();
    const token = ws?.githubToken || process.env.GITHUB_TOKEN || undefined;

    let isSynced = false;
    if (!policy.needsReview && owner !== "unknown") {
      const syncResult = await addLabelsToGitHubIssue({
        owner,
        repo: repoName,
        issueNumber,
        labels: policy.suggestedLabels,
        token,
      });
      isSynced = syncResult.success;
    }

    let savedId: string | null = null;
    try {
      const saved = await db.issue.create({
        data: {
          title: payload.issue.title,
          body: payload.issue.body || "",
          repository: repoFullName,
          githubIssueNumber: issueNumber,
          githubDeliveryId: deliveryId,
          githubSynced: isSynced,
          appliedLabels: policy.suggestedLabels,
          category: triageResult.answers.category.choice,
          categoryConfidence: triageResult.answers.category.confidence,
          severity: triageResult.answers.severity.score,
          severityConfidence: triageResult.answers.severity.confidence,
          escalationProbability: triageResult.answers.needs_escalation.noul,
          priority: policy.priority,
          suggestedTeam: policy.routingTeam,
          needsReview: policy.needsReview,
          model: triageResult.model,
          rawProbabilities: triageResult.answers.category.probabilities ?? {},
          inputTokens: triageResult.usage?.input_tokens ?? null,
          outputTokens: triageResult.usage?.output_tokens ?? null,
        },
      });
      savedId = saved.id;
    } catch (saveErr) {
      console.error("Failed to save webhook decision to DB:", saveErr);
    }

    return NextResponse.json({
      status: "processed",
      id: savedId,
      issueNumber,
      priority: policy.priority,
      needsReview: policy.needsReview,
      githubSynced: isSynced,
      suggestedLabels: policy.suggestedLabels,
    });
  } catch (err) {
    console.error("Error processing GitHub webhook:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
