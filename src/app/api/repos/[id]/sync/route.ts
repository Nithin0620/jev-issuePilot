import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classifyIssue } from "@/lib/jev";
import { applyPolicy } from "@/lib/policy";
import { addLabelsToGitHubIssue, fetchGitHubRepoIssues, DEMO_GITHUB_REPOS } from "@/lib/github";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let repo = null;
    try {
      repo = await db.repository.findUnique({
        where: { id },
      });
    } catch (dbErr) {
      console.warn(`[Sync] db.repository.findUnique error for ${id}:`, dbErr);
    }

    // Fallback: If not found by ID, attempt lookup by fullName or demo catalog fallback
    if (!repo) {
      try {
        repo = await db.repository.findFirst({
          where: { fullName: id },
        });
      } catch {
        // ignore
      }
    }

    if (!repo) {
      const demoMatch = DEMO_GITHUB_REPOS.find(
        (r) => r.fullName === id || r.name === id || id.startsWith("local-")
      );
      if (demoMatch) {
        repo = {
          id,
          fullName: demoMatch.fullName,
          owner: demoMatch.owner,
          name: demoMatch.name,
          description: demoMatch.description,
          language: demoMatch.language,
          isPrivate: demoMatch.isPrivate,
          connectionMode: "demo",
          webhookActive: true,
          autoSyncLabels: true,
          minConfidence: 0.75,
          escalationThreshold: 0.85,
          defaultTeam: demoMatch.defaultTeam,
          lastSyncedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    }

    if (!repo) {
      return NextResponse.json(
        { error: `Repository not found for identifier "${id}"` },
        { status: 404 }
      );
    }

    const ws = await db.workspaceConfig
      .findUnique({ where: { id: "default" } })
      .catch(() => null);
    const token = ws?.githubToken || process.env.GITHUB_TOKEN || undefined;

    const fetched = await fetchGitHubRepoIssues(repo.fullName, token);
    const createdIssues = [];

    for (const item of fetched.issues) {
      try {
        const deliveryId = `sync-${repo.fullName}#${item.number}`;
        const existing = await db.issue
          .findUnique({
            where: { githubDeliveryId: deliveryId },
          })
          .catch(() => null);

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
            token,
          });
          githubSynced = syncRes.success;
        }

        const saved = await db.issue
          .create({
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
          })
          .catch((err) => {
            console.warn(`[Sync] Failed to persist issue #${item.number} to DB:`, err);
            return null;
          });

        if (saved) {
          createdIssues.push(saved);
        }
      } catch (issueErr) {
        console.warn(`[Sync] Skipped issue #${item.number} due to processing error:`, issueErr);
      }
    }

    if (!repo.id.startsWith("local-")) {
      await db.repository
        .update({
          where: { id: repo.id },
          data: { lastSyncedAt: new Date() },
        })
        .catch(() => {});
    }

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
      { error: "Unable to sync repository issues", details: String(error) },
      { status: 500 }
    );
  }
}
