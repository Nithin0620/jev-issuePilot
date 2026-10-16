import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { addLabelsToGitHubIssue } from "@/lib/github";

const ReviewSchema = z.object({
  action: z.enum(["approve", "override"]),
  humanCategory: z.string().optional(),
  humanPriority: z.string().optional(),
  humanNotes: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const parsed = ReviewSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
    }

    const current = await db.issue.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const finalCategory = parsed.data.humanCategory || current.category;
    const finalPriority = parsed.data.humanPriority || current.priority;

    const finalLabels = [
      `type:${finalCategory}`,
      `priority:${finalPriority}`,
    ];

    let isGithubSynced = current.githubSynced;

    const ws = await db.workspaceConfig
      .findUnique({ where: { id: "default" } })
      .catch(() => null);
    const token = ws?.githubToken || process.env.GITHUB_TOKEN || undefined;

    // Push confirmed labels to GitHub if issue has GitHub number and repository
    if (current.githubIssueNumber && current.repository && current.repository.includes("/")) {
      const [owner, repo] = current.repository.split("/");
      if (owner && repo) {
        const syncRes = await addLabelsToGitHubIssue({
          owner,
          repo,
          issueNumber: current.githubIssueNumber,
          labels: finalLabels,
          token,
        });
        if (syncRes.success) {
          isGithubSynced = true;
        }
      }
    }

    const updated = await db.issue.update({
      where: { id },
      data: {
        humanReviewed: true,
        humanCategory: parsed.data.humanCategory,
        humanPriority: parsed.data.humanPriority,
        humanNotes: parsed.data.humanNotes,
        appliedLabels: finalLabels,
        githubSynced: isGithubSynced,
      },
    });

    return NextResponse.json({ success: true, issue: updated });
  } catch {
    return NextResponse.json(
      { error: "Could not update issue review" },
      { status: 500 }
    );
  }
}
