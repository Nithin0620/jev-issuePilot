import crypto from "crypto";

export interface GitHubWebhookPayload {
  action: string;
  issue?: {
    number: number;
    title: string;
    body: string;
    labels?: Array<{ name: string }>;
  };
  repository?: {
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
}

/**
 * Validates HMAC SHA-256 signature from GitHub's X-Hub-Signature-256 header.
 */
export function verifyGitHubWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret?: string
): boolean {
  const webhookSecret = secret ?? process.env.GITHUB_WEBHOOK_SECRET;

  // If no secret configured, allow in development only if explicit
  if (!webhookSecret) {
    console.warn("GITHUB_WEBHOOK_SECRET is not configured; rejecting webhook");
    return false;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody, "utf8")
    .digest("hex")}`;

  const sigBuffer = Buffer.from(signatureHeader, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Pushes triage labels to a GitHub issue using the GitHub REST API.
 * Safely simulates the action if GITHUB_TOKEN is not configured.
 */
export async function addLabelsToGitHubIssue(input: {
  owner: string;
  repo: string;
  issueNumber: number;
  labels: string[];
}): Promise<{ success: boolean; labelsAdded: string[]; simulated?: boolean }> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.info(
      `[GitHub Label Sync (Simulated)] Added labels to ${input.owner}/${input.repo}#${input.issueNumber}:`,
      input.labels
    );
    return {
      success: true,
      labelsAdded: input.labels,
      simulated: true,
    };
  }

  const url = `https://api.github.com/repos/${input.owner}/${input.repo}/issues/${input.issueNumber}/labels`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "IssuePilot-Triage",
      },
      body: JSON.stringify({
        labels: input.labels,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(
        `Failed to push labels to GitHub: ${response.status} ${response.statusText}`,
        errText
      );
      return { success: false, labelsAdded: [] };
    }

    return { success: true, labelsAdded: input.labels };
  } catch (error) {
    console.error("Error communicating with GitHub API:", error);
    return { success: false, labelsAdded: [] };
  }
}
