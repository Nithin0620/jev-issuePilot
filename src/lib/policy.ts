export interface TriageAnswers {
  category: {
    choice: "bug" | "feature" | "question" | "other" | string;
    confidence: number;
    probabilities?: Record<string, number>;
  };
  severity: {
    score: number;
    confidence: number;
  };
  needs_escalation: {
    noul: number;
  };
}

export type Priority = "low" | "medium" | "high" | "critical";

export interface PolicyDecision {
  category: string;
  priority: Priority;
  needsReview: boolean;
  escalationProbability: number;
  routingTeam: string;
  suggestedLabels: string[];
}

export function applyPolicy(answers: TriageAnswers): PolicyDecision {
  const lowConfidence =
    answers.category.confidence < 0.75 || answers.severity.confidence < 0.75;

  const escalationProbability = answers.needs_escalation.noul;

  let priority: Priority;
  if (escalationProbability >= 0.85) {
    priority = "critical";
  } else if (answers.severity.score >= 2.5) {
    priority = "high";
  } else if (answers.severity.score >= 1.0) {
    priority = "medium";
  } else {
    priority = "low";
  }

  const isBorderlineEscalation =
    escalationProbability >= 0.6 && escalationProbability < 0.85;

  let routingTeam = "General Triage";
  if (priority === "critical") {
    routingTeam = "Incident Response / Platform";
  } else if (answers.category.choice === "bug") {
    routingTeam = "Core Engineering";
  } else if (answers.category.choice === "feature") {
    routingTeam = "Product & UI";
  } else if (answers.category.choice === "question") {
    routingTeam = "Developer Support";
  }

  const suggestedLabels = [
    `type:${answers.category.choice}`,
    `priority:${priority}`,
  ];

  return {
    category: answers.category.choice,
    priority,
    needsReview: lowConfidence || isBorderlineEscalation,
    escalationProbability,
    routingTeam,
    suggestedLabels,
  };
}
