import { describe, expect, it } from "vitest";
import { applyPolicy, TriageAnswers } from "../src/lib/policy";

describe("applyPolicy", () => {
  it("flags low-confidence decisions for review when category confidence is low", () => {
    const answers: TriageAnswers = {
      category: { choice: "bug", confidence: 0.5 },
      severity: { score: 1.0, confidence: 0.9 },
      needs_escalation: { noul: 0.1 },
    };
    const result = applyPolicy(answers);
    expect(result.needsReview).toBe(true);
    expect(result.priority).toBe("medium");
    expect(result.routingTeam).toBe("Core Engineering");
  });

  it("flags low-confidence decisions for review when severity confidence is low", () => {
    const answers: TriageAnswers = {
      category: { choice: "feature", confidence: 0.9 },
      severity: { score: 0.5, confidence: 0.6 },
      needs_escalation: { noul: 0.1 },
    };
    const result = applyPolicy(answers);
    expect(result.needsReview).toBe(true);
    expect(result.priority).toBe("low");
    expect(result.routingTeam).toBe("Product & UI");
  });

  it("marks high escalation cases critical and routes to Incident Response", () => {
    const answers: TriageAnswers = {
      category: { choice: "bug", confidence: 0.95 },
      severity: { score: 3.0, confidence: 0.95 },
      needs_escalation: { noul: 0.92 },
    };
    const result = applyPolicy(answers);
    expect(result.priority).toBe("critical");
    expect(result.needsReview).toBe(false);
    expect(result.routingTeam).toBe("Incident Response / Platform");
    expect(result.suggestedLabels).toContain("priority:critical");
    expect(result.suggestedLabels).toContain("type:bug");
  });

  it("flags borderline escalation cases (0.60 to 0.85) for human review", () => {
    const answers: TriageAnswers = {
      category: { choice: "bug", confidence: 0.85 },
      severity: { score: 2.0, confidence: 0.85 },
      needs_escalation: { noul: 0.72 },
    };
    const result = applyPolicy(answers);
    expect(result.needsReview).toBe(true);
    expect(result.priority).toBe("medium");
  });
});
