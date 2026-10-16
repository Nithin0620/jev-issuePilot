import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classifyIssue } from "@/lib/jev";
import { applyPolicy } from "@/lib/policy";
import { addLabelsToGitHubIssue, fetchGitHubRepoIssues } from "@/lib/github";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const repo = await db.repository.findUnique({
      where: { id },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const fetched = await fetchGitHubRepoIssues(repo.fullName);
    const createdIssues = [];

    for (const item of fetched.issues) {
      const deliveryId = `sync-${repo.fullName}#${item.number}`;
      const existing = await db.issue.findUnique({
        where: { githubDeliveryId: deliveryId },
      });

      if (existing) {
        continue;
      }

      const triage = await classifyIssue({
        title: item.title,
        body: item.body,
        repository: repo.fullName,
      });

      const policy = applyPolicy(triage.answers, {
        minConfidence: repo.minConfidence,
        escalationThreshold: repo.escalationThreshold,
        defaultTeam: repo.defaultTeam,
      });

      let githubSynced = false;
      if (!policy.needsReview && repo.autoSyncLabels) {
        const syncRes = await addLabelsToGitHubIssue({
          owner: repo.owner,
          repo: repo.name,
          issueNumber: item.number,
          labels: policy.suggestedLabels,
        });
        githubSynced = syncRes.success;
      }

      const saved = await db.issue.create({
        data: {
          title: item.title,
          body: item.body,
          repository: repo.fullName,
          githubIssueNumber: item.number,
          githubDeliveryId: deliveryId,
          githubSynced,
          appliedLabels: policy.suggestedLabels,
          category: triage.answers.category.choice,
          categoryConfidence: triage.answers.category.confidence,
          severity: triage.answers.severity.score,
          severityConfidence: triage.answers.severity.confidence,
          escalationProbability: triage.answers.needs_escalation.noul,
          priority: policy.priority,
          suggestedTeam: policy.routingTeam,
          needsReview: policy.needsReview,
          rawProbabilities: triage.answers.category.probabilities ?? {},
          model: triage.model,
          inputTokens: triage.usage?.input_tokens ?? null,
          outputTokens: triage.usage?.output_tokens ?? null,
        },
      });

      createdIssues.push(saved);
    }

    await db.repository.update({
      where: { id: repo.id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      mode: fetched.mode,
      repository: repo.fullName,
      syncedCount: createdIssues.length,
      totalFound: fetched.issues.length,
      issues: createdIssues,
    });
  } catch (error) {
    console.error("Repository sync failed:", error);
    return NextResponse.json(
      { error: "Unable to sync repository issues" },
      { status: 500 }
    );
  }
}
