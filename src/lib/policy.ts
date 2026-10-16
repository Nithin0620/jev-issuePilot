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

export interface PolicyOptions {
  minConfidence?: number;
  escalationThreshold?: number;
  defaultTeam?: string;
}

export function applyPolicy(
  answers: TriageAnswers,
  options?: PolicyOptions
): PolicyDecision {
  const minConf = options?.minConfidence ?? 0.75;
  const escThreshold = options?.escalationThreshold ?? 0.85;

  const lowConfidence =
    answers.category.confidence < minConf || answers.severity.confidence < minConf;

  const escalationProbability = answers.needs_escalation.noul;

  let priority: Priority;
  if (escalationProbability >= escThreshold) {
    priority = "critical";
  } else if (answers.severity.score >= 2.5) {
    priority = "high";
  } else if (answers.severity.score >= 1.0) {
    priority = "medium";
  } else {
    priority = "low";
  }

  const isBorderlineEscalation =
    escalationProbability >= 0.6 && escalationProbability < escThreshold;

  let routingTeam = options?.defaultTeam || "General Triage";
  if (priority === "critical") {
    routingTeam = "Incident Response / Platform";
  } else if (answers.category.choice === "bug") {
    routingTeam = options?.defaultTeam || "Core Engineering";
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

