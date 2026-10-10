import { describe, expect, it, beforeEach } from "vitest";
import crypto from "crypto";
import { POST } from "../src/app/api/webhooks/github/route";

describe("POST /api/webhooks/github", () => {
  const secret = "test-webhook-secret-12345";

  beforeEach(() => {
    process.env.GITHUB_WEBHOOK_SECRET = secret;
    process.env.MOCK_JEV = "true";
  });

  it("rejects unauthorized webhook when signature is missing or invalid", async () => {
    const rawPayload = JSON.stringify({ action: "opened" });
    const request = new Request("http://localhost:3000/api/webhooks/github", {
      method: "POST",
      headers: {
        "x-github-event": "issues",
        "x-hub-signature-256": "sha256=invalid-signature",
      },
      body: rawPayload,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("ignores non-issues events gracefully with 200", async () => {
    const rawPayload = JSON.stringify({ ref: "refs/heads/main" });
    const signature = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(rawPayload)
      .digest("hex")}`;

    const request = new Request("http://localhost:3000/api/webhooks/github", {
      method: "POST",
      headers: {
        "x-github-event": "push",
        "x-hub-signature-256": signature,
      },
      body: rawPayload,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("ignored");
  });

  it("processes valid issue opened webhook and persists triage decision", async () => {
    const deliveryId = `delivery-${Date.now()}`;
    const rawPayload = JSON.stringify({
      action: "opened",
      issue: {
        number: 88,
        title: "Critical outage: 500 error on payment gateway",
        body: "Production is down and transactions are failing completely.",
      },
      repository: {
        name: "payment-api",
        full_name: "acme/payment-api",
        owner: { login: "acme" },
      },
    });

    const signature = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(rawPayload)
      .digest("hex")}`;

    const request = new Request("http://localhost:3000/api/webhooks/github", {
      method: "POST",
      headers: {
        "x-github-event": "issues",
        "x-github-delivery": deliveryId,
        "x-hub-signature-256": signature,
      },
      body: rawPayload,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("processed");
    expect(data.priority).toBe("critical");
    expect(data.issueNumber).toBe(88);
    expect(data.suggestedLabels).toContain("priority:critical");

    // Test deduplication on same deliveryId
    const dupRequest = new Request("http://localhost:3000/api/webhooks/github", {
      method: "POST",
      headers: {
        "x-github-event": "issues",
        "x-github-delivery": deliveryId,
        "x-hub-signature-256": signature,
      },
      body: rawPayload,
    });

    const dupResponse = await POST(dupRequest);
    expect(dupResponse.status).toBe(200);
    const dupData = await dupResponse.json();
    expect(dupData.status).toBe("duplicate");
  });
});
