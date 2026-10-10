import { TypeSafeClient, choice, score, noul } from "@typesafe-ai/sdk";

export interface TriageResult {
  model: string;
  answers: {
    category: {
      choice: "bug" | "feature" | "question" | "other" | string;
      confidence: number;
      probabilities: Record<string, number>;
    };
    severity: {
      score: number;
      confidence: number;
    };
    needs_escalation: {
      noul: number;
    };
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export interface IssueInput {
  title: string;
  body: string;
  repository?: string;
}

export function mockClassifyIssue(input: IssueInput): TriageResult {
  const text = `${input.title} ${input.body}`.toLowerCase();

  const isAmbiguous = text.length < 55 || /weird|strange|help me|broken thing/.test(text);
  const isOutage = /500|outage|crash|down|critical|timeout|incident|security|leak|fail/i.test(text);
  const isBug = isOutage || /error|bug|defect|regression|broken|fix|exception|fails/i.test(text);
  const isFeature = /feature|add support|support|request|allow|improve|enhancement|dark mode|toggle/i.test(text);
  const isQuestion = /how do i|how to|question|where can i|is there a way|documentation|docs/i.test(text);

  let categoryChoice: "bug" | "feature" | "question" | "other" = "other";
  const catConfidence = isAmbiguous ? 0.55 : 0.92;

  if (isBug) categoryChoice = "bug";
  else if (isFeature) categoryChoice = "feature";
  else if (isQuestion) categoryChoice = "question";

  let severityScore = 0.5;
  let severityConfidence = isAmbiguous ? 0.6 : 0.9;
  let escalationProb = 0.05;

  if (isOutage) {
    severityScore = 3.0;
    escalationProb = 0.95;
    severityConfidence = 0.95;
  } else if (isBug) {
    severityScore = 1.8;
    escalationProb = 0.25;
  } else if (isFeature) {
    severityScore = 0.8;
    escalationProb = 0.02;
  } else if (isQuestion) {
    severityScore = 0.2;
    escalationProb = 0.01;
  }

  const probabilities: Record<string, number> = {
    bug: categoryChoice === "bug" ? 0.85 : 0.05,
    feature: categoryChoice === "feature" ? 0.85 : 0.05,
    question: categoryChoice === "question" ? 0.85 : 0.05,
    other: categoryChoice === "other" ? 0.85 : 0.05,
  };

  return {
    model: "mock/jev-deterministic-v1",
    answers: {
      category: {
        choice: categoryChoice,
        confidence: catConfidence,
        probabilities,
      },
      severity: {
        score: severityScore,
        confidence: severityConfidence,
      },
      needs_escalation: {
        noul: escalationProb,
      },
    },
    usage: {
      input_tokens: Math.ceil(text.length / 4),
      output_tokens: 35,
    },
  };
}

export async function classifyIssue(input: IssueInput): Promise<TriageResult> {
  const apiKey = process.env.TYPESAFE_API_KEY;
  const forceMock = process.env.MOCK_JEV === "true" || !apiKey;

  if (forceMock) {
    return mockClassifyIssue(input);
  }

  const client = new TypeSafeClient();
  const result = await client.systemOne({
    model: "typesafe/jev-1.13",
    state: {
      repository: input.repository ?? "unknown",
      title: input.title,
      body: input.body,
    },
    questions: {
      category: choice("Which category best describes this issue?", {
        bug: "A defect, crash, regression, or broken behavior",
        feature: "A request for new or improved functionality",
        question: "A request for help or clarification",
        other: "Does not fit the other categories",
      }),
      severity: score(
        "Rate the impact of this issue, from lowest to highest.",
        [
          "0: Minor inconvenience with a workaround",
          "1: Limited functionality is affected",
          "2: Important functionality is broken",
          "3: Major outage or critical functionality is unavailable",
        ]
      ),
      needs_escalation: noul(
        "Does this issue describe a major outage, a security incident, or an impact that requires immediate human attention?"
      ),
    },
  });

  return result as unknown as TriageResult;
}
