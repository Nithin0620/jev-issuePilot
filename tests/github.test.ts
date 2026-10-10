import { describe, expect, it } from "vitest";
import crypto from "crypto";
import {
  verifyGitHubWebhookSignature,
  addLabelsToGitHubIssue,
} from "../src/lib/github";

describe("GitHub Integration", () => {
  const secret = "test-webhook-secret-12345";
  const payload = JSON.stringify({ action: "opened", issue: { title: "Test Bug" } });

  const validSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex")}`;

  it("successfully verifies valid GitHub webhook HMAC signature", () => {
    const isValid = verifyGitHubWebhookSignature(payload, validSignature, secret);
    expect(isValid).toBe(true);
  });

  it("rejects tampered webhook payload", () => {
    const tamperedPayload = JSON.stringify({
      action: "opened",
      issue: { title: "Tampered Bug" },
    });
    const isValid = verifyGitHubWebhookSignature(tamperedPayload, validSignature, secret);
    expect(isValid).toBe(false);
  });

  it("rejects invalid signature header format", () => {
    const isValid = verifyGitHubWebhookSignature(payload, "invalid_sig", secret);
    expect(isValid).toBe(false);
  });

  it("rejects null or empty signature header", () => {
    const isValid = verifyGitHubWebhookSignature(payload, null, secret);
    expect(isValid).toBe(false);
  });

  it("simulates label push when GITHUB_TOKEN is absent without throwing error", async () => {
    const result = await addLabelsToGitHubIssue({
      owner: "acme",
      repo: "app",
      issueNumber: 101,
      labels: ["type:bug", "priority:critical"],
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.labelsAdded).toEqual(["type:bug", "priority:critical"]);
  });
});
