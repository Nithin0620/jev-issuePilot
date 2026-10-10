import fs from "fs";
import path from "path";
import { classifyIssue } from "../src/lib/jev";
import { applyPolicy } from "../src/lib/policy";

interface EvalItem {
  id: string;
  title: string;
  body: string;
  expectedCategory: string;
  expectedSeverityTier: number;
  expectedEscalation: boolean;
}

async function runEvaluation() {
  const filePath = path.resolve(__dirname, "../data/evaluation-benchmark.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const dataset: EvalItem[] = JSON.parse(raw);

  console.log(`\n========================================================`);
  console.log(`🚀 Running IssuePilot AI Model Evaluation Benchmark`);
  console.log(`Dataset: ${dataset.length} labeled test cases`);
  console.log(`========================================================\n`);

  let correctCategoryCount = 0;
  let escalationTruePositives = 0;
  let escalationFalsePositives = 0;
  let escalationFalseNegatives = 0;
  let escalationTrueNegatives = 0;
  let reviewFlaggedCount = 0;

  const startTime = Date.now();

  for (const item of dataset) {
    const result = await classifyIssue({
      title: item.title,
      body: item.body,
    });

    const policy = applyPolicy(result.answers);
    const predictedCat = policy.category;
    const isEscalation = policy.escalationProbability >= 0.85;

    if (predictedCat === item.expectedCategory) {
      correctCategoryCount++;
    }

    if (item.expectedEscalation && isEscalation) {
      escalationTruePositives++;
    } else if (!item.expectedEscalation && isEscalation) {
      escalationFalsePositives++;
    } else if (item.expectedEscalation && !isEscalation) {
      escalationFalseNegatives++;
    } else {
      escalationTrueNegatives++;
    }

    if (policy.needsReview) {
      reviewFlaggedCount++;
    }
  }

  const durationMs = Date.now() - startTime;
  const avgLatency = (durationMs / dataset.length).toFixed(1);

  const categoryAccuracy = ((correctCategoryCount / dataset.length) * 100).toFixed(1);
  const reviewRate = ((reviewFlaggedCount / dataset.length) * 100).toFixed(1);

  const precision = escalationTruePositives + escalationFalsePositives > 0
    ? ((escalationTruePositives / (escalationTruePositives + escalationFalsePositives)) * 100).toFixed(1)
    : "100.0";

  const recall = escalationTruePositives + escalationFalseNegatives > 0
    ? ((escalationTruePositives / (escalationTruePositives + escalationFalseNegatives)) * 100).toFixed(1)
    : "100.0";

  console.log(`📊 Benchmark Results:`);
  console.log(`--------------------------------------------------------`);
  console.log(`Category Classification Accuracy: ${categoryAccuracy}% (${correctCategoryCount}/${dataset.length})`);
  console.log(`Escalation Detection Precision:    ${precision}%`);
  console.log(`Escalation Detection Recall:       ${recall}%`);
  console.log(`Escalation False Positives:        ${escalationFalsePositives}`);
  console.log(`Escalation True Negatives:         ${escalationTrueNegatives}`);
  console.log(`Human Review Gate Trigger Rate:    ${reviewRate}% (${reviewFlaggedCount}/${dataset.length})`);
  console.log(`Average Decision Latency:          ${avgLatency} ms/issue`);
  console.log(`--------------------------------------------------------`);
  console.log(`✅ Evaluation Completed Successfully.\n`);
}

runEvaluation().catch((err) => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
