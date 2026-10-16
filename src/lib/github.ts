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

export interface GitHubRepoCatalogItem {
  fullName: string;
  name: string;
  owner: string;
  description: string;
  language: string;
  isPrivate: boolean;
  openIssuesCount: number;
  defaultTeam: string;
}

export const DEMO_GITHUB_REPOS: GitHubRepoCatalogItem[] = [
  {
    fullName: "acme-cloud/api-gateway",
    name: "api-gateway",
    owner: "acme-cloud",
    description: "High-throughput edge routing, rate-limiting, and JWT verification proxy",
    language: "TypeScript",
    isPrivate: false,
    openIssuesCount: 2,
    defaultTeam: "Platform & Infra",
  },
];

export interface SyncedGitHubIssueInput {
  number: number;
  title: string;
  body: string;
}

export function getDemoIssuesForRepo(fullName: string): SyncedGitHubIssueInput[] {
  const baseNum = Math.floor(100 + (fullName.length * 17) % 800);
  return [
    {
      number: baseNum + 1,
      title: `Production crash: 500 gateway timeout on ${fullName} healthcheck`,
      body: `Cluster nodes in us-east-1 are reporting critical connection pool exhaustion and crashing under normal traffic load. Immediate escalation needed.`,
    },
    {
      number: baseNum + 2,
      title: `Something weird in ${fullName} settings panel`,
      body: `I clicked save and a strange message flashed briefly.`,
    },
  ];
}

export async function fetchGitHubRepositories(token?: string): Promise<{
  mode: "live" | "demo";
  repositories: GitHubRepoCatalogItem[];
}> {
  const activeToken = token || process.env.GITHUB_TOKEN;
  if (!activeToken) {
    return { mode: "demo", repositories: DEMO_GITHUB_REPOS };
  }

  try {
    const res = await fetch(
      "https://api.github.com/user/repos?per_page=25&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "IssuePilot-SaaS",
        },
      }
    );

    if (!res.ok) {
      return { mode: "demo", repositories: DEMO_GITHUB_REPOS };
    }

    const data = (await res.json()) as Array<{
      full_name: string;
      name: string;
      owner: { login: string };
      description: string | null;
      language: string | null;
      private: boolean;
      open_issues_count: number;
    }>;

    const mapped: GitHubRepoCatalogItem[] = data.map((r) => ({
      fullName: r.full_name,
      name: r.name,
      owner: r.owner.login,
      description: r.description || "GitHub repository connected via IssuePilot",
      language: r.language || "TypeScript",
      isPrivate: r.private,
      openIssuesCount: r.open_issues_count ?? 0,
      defaultTeam: "Core Engineering",
    }));

    return {
      mode: "live",
      repositories: mapped.length > 0 ? mapped : DEMO_GITHUB_REPOS,
    };
  } catch {
    return { mode: "demo", repositories: DEMO_GITHUB_REPOS };
  }
}

export async function fetchGitHubRepoIssues(
  fullName: string,
  token?: string
): Promise<{ mode: "live" | "demo"; issues: SyncedGitHubIssueInput[] }> {
  const activeToken = token || process.env.GITHUB_TOKEN;
  if (!activeToken) {
    return { mode: "demo", issues: getDemoIssuesForRepo(fullName) };
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${fullName}/issues?state=open&per_page=8`,
      {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "IssuePilot-SaaS",
        },
      }
    );

    if (!res.ok) {
      return { mode: "demo", issues: getDemoIssuesForRepo(fullName) };
    }

    const data = (await res.json()) as Array<{
      number: number;
      title: string;
      body: string | null;
      pull_request?: unknown;
    }>;

    const onlyIssues = data
      .filter((item) => !item.pull_request)
      .map((item) => ({
        number: item.number,
        title: item.title,
        body:
          item.body && item.body.trim().length >= 10
            ? item.body
            : `${item.title} — imported from GitHub repository ${fullName}.`,
      }));

    return {
      mode: "live",
      issues: onlyIssues.length > 0 ? onlyIssues : getDemoIssuesForRepo(fullName),
    };
  } catch {
    return { mode: "demo", issues: getDemoIssuesForRepo(fullName) };
  }
}

