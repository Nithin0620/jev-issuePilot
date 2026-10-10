import { describe, expect, it } from "vitest";
import { classifyIssue } from "../src/lib/jev";

describe("classifyIssue", () => {
  it("correctly classifies an outage issue with high escalation in mock mode", async () => {
    const result = await classifyIssue({
      title: "Critical outage: 500 error on all checkout endpoints",
      body: "All customers cannot purchase items. Production database is failing.",
      repository: "acme/store",
    });

    expect(result.answers.category.choice).toBe("bug");
    expect(result.answers.severity.score).toBeGreaterThanOrEqual(2.5);
    expect(result.answers.needs_escalation.noul).toBeGreaterThanOrEqual(0.85);
    expect(result.model).toBeDefined();
  });

  it("classifies a feature request appropriately", async () => {
    const result = await classifyIssue({
      title: "Add dark mode toggle in preferences",
      body: "It would be great to have a dark theme switch for better night reading.",
      repository: "acme/store",
    });

    expect(result.answers.category.choice).toBe("feature");
    expect(result.answers.needs_escalation.noul).toBeLessThan(0.3);
  });

  it("yields low confidence for ambiguous issue descriptions", async () => {
    const result = await classifyIssue({
      title: "Something weird happened",
      body: "I clicked something and it was strange.",
      repository: "acme/store",
    });

    expect(result.answers.category.confidence).toBeLessThan(0.75);
  });
});
