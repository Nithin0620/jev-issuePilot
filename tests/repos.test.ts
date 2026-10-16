import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { GET as getRepos, POST as createRepo } from "../src/app/api/repos/route";
import { POST as syncRepoIssues } from "../src/app/api/repos/[id]/sync/route";
import { DEMO_GITHUB_REPOS, getDemoIssuesForRepo } from "../src/lib/github";
import { db } from "../src/lib/db";

describe("Repositories & Issue Sync API", () => {
  const createdFullNames: string[] = [];

  beforeEach(() => {
    process.env.MOCK_JEV = "true";
  });

  afterEach(async () => {
    if (createdFullNames.length > 0) {
      try {
        await db.issue.deleteMany({
          where: { repository: { in: createdFullNames } },
        });
        await db.repository.deleteMany({
          where: { fullName: { in: createdFullNames } },
        });
      } catch {
        // Ignore if DB offline
      }
      createdFullNames.length = 0;
    }
  });

  it("provides 1 demo GitHub repository and 2 demo issues", () => {
    expect(DEMO_GITHUB_REPOS.length).toBe(1);
    const sampleIssues = getDemoIssuesForRepo("acme-cloud/api-gateway");
    expect(sampleIssues.length).toBe(2);
    expect(sampleIssues[0]).toHaveProperty("title");
    expect(sampleIssues[0]).toHaveProperty("body");
  });

  it("links a repository via POST /api/repos and lists it via GET /api/repos", async () => {
    const repoName = `test-service-${Date.now()}`;
    const fullName = `acme-cloud/${repoName}`;
    createdFullNames.push(fullName);

    const postReq = new Request("http://localhost:3000/api/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        description: "Core distributed microservice",
        language: "TypeScript",
        connectionMode: "demo",
        minConfidence: 0.8,
        escalationThreshold: 0.85,
        autoSyncLabels: true,
      }),
    });

    const postRes = await createRepo(postReq);
    expect(postRes.status).toBe(201);
    const createdData = await postRes.json();
    expect(createdData.repository.fullName).toBe(fullName);
    expect(createdData.repository.minConfidence).toBe(0.8);

    const getRes = await getRepos();
    expect(getRes.status).toBe(200);
    const listData = await getRes.json();
    expect(Array.isArray(listData.repositories)).toBe(true);
    expect(
      listData.repositories.some((r: { fullName: string }) => r.fullName === fullName)
    ).toBe(true);

    // Sync issues for this newly linked repository
    if (createdData.repository.id) {
      const syncReq = new Request(
        `http://localhost:3000/api/repos/${createdData.repository.id}/sync`,
        { method: "POST" }
      );
      const syncRes = await syncRepoIssues(syncReq, {
        params: Promise.resolve({ id: createdData.repository.id }),
      });
      expect(syncRes.status).toBe(200);
      const syncData = await syncRes.json();
      expect(syncData.syncedCount).toBe(2);
    }
  });
});
