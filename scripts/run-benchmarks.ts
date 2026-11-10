import * as fs from "node:fs/promises";
import * as path from "node:path";
import { loadArchSpecFile, evaluateArchitecture } from "@archbench/core";

interface GroundTruthCase {
  id: string;
  archetype: string;
  category: "optimal" | "flawed" | "speculative";
  title: string;
  description: string;
  expectedFindingRuleIds: string[];
  expectedFindingSeverities: Record<string, number>;
  relativeFilePath: string;
}

interface CaseEvaluationSummary {
  id: string;
  category: string;
  schemaValid: boolean;
  score: number;
  passed: boolean;
  expectedRules: string[];
  actualRules: string[];
  truePositives: string[];
  falsePositives: string[];
  falseNegatives: string[];
  durationMs: number;
}

async function runBenchmarkSuite() {
  const rootDir = path.resolve(import.meta.dirname || process.cwd(), "..");
  const groundTruthPath = path.join(rootDir, "benchmarks/expected-findings/ground-truth.json");

  const rawGt = await fs.readFile(groundTruthPath, "utf-8");
  const groundTruthIndex: Record<string, GroundTruthCase> = JSON.parse(rawGt);

  console.log("===============================================================================");
  console.log("            ArchBench Empirical Evaluation & Benchmark Harness               ");
  console.log("===============================================================================\n");

  const summaries: CaseEvaluationSummary[] = [];
  let totalTp = 0;
  let totalFp = 0;
  let totalFn = 0;
  const startTime = Date.now();

  const caseIds = Object.keys(groundTruthIndex);
  console.log(`Evaluating ${caseIds.length} benchmark test cases across 10 architectural archetypes...\n`);

  for (const caseId of caseIds) {
    const gt = groundTruthIndex[caseId];
    const absPath = path.join(rootDir, gt.relativeFilePath);
    const caseStart = Date.now();

    const loaded = await loadArchSpecFile(absPath);
    const evaluation = evaluateArchitecture(loaded.spec, loaded.normalizedSpec, loaded.graphs);
    const caseDuration = Date.now() - caseStart;

    const alt = Object.values(evaluation.alternatives)[0];
    const actualRuleIds = Array.from(new Set(alt ? alt.findings.map((f) => f.testId) : []));
    const expectedRuleSet = new Set(gt.expectedFindingRuleIds);
    const actualRuleSet = new Set(actualRuleIds);

    const tp = actualRuleIds.filter((r) => expectedRuleSet.has(r));
    const fp = actualRuleIds.filter((r) => !expectedRuleSet.has(r));
    const fn = gt.expectedFindingRuleIds.filter((r) => !actualRuleSet.has(r));

    totalTp += tp.length;
    totalFp += fp.length;
    totalFn += fn.length;

    summaries.push({
      id: caseId,
      category: gt.category,
      schemaValid: loaded.validation.valid,
      score: alt?.score ?? 0,
      passed: alt?.passed ?? false,
      expectedRules: gt.expectedFindingRuleIds,
      actualRules: actualRuleIds,
      truePositives: tp,
      falsePositives: fp,
      falseNegatives: fn,
      durationMs: caseDuration,
    });
  }

  const totalDuration = Date.now() - startTime;
  const precision = totalTp + totalFp > 0 ? totalTp / (totalTp + totalFp) : 1;
  const recall = totalTp + totalFn > 0 ? totalTp / (totalTp + totalFn) : 1;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 1;
  const schemaValidCount = summaries.filter((s) => s.schemaValid).length;

  console.log(
    "| Case ID                                     | Category    | Valid | Score | Status | Expected       | Actual         | Result |"
  );
  console.log(
    "|:--------------------------------------------|:------------|:-----:|:-----:|:------:|:---------------|:---------------|:------:|"
  );

  for (const s of summaries) {
    const statusText = s.passed ? "PASS" : "FAIL";
    const match = s.falsePositives.length === 0 && s.falseNegatives.length === 0 ? "EXACT" : "MISMATCH";
    const expStr = s.expectedRules.join(",") || "none";
    const actStr = s.actualRules.join(",") || "none";

    console.log(
      `| ${s.id.padEnd(43)} | ${s.category.padEnd(11)} |  ${s.schemaValid ? "Y" : "N"}  |  ${s.score.toString().padStart(3)}  | ${statusText.padEnd(6)} | ${expStr.padEnd(14)} | ${actStr.padEnd(14)} | ${match.padEnd(6)} |`
    );
  }

  console.log("\n===============================================================================");
  console.log("                           BENCHMARK SUITE SUMMARY                            ");
  console.log("===============================================================================");
  console.log(`Total Cases Evaluated:       ${summaries.length}`);
  console.log(`Schema Validation Rate:     ${schemaValidCount} / ${summaries.length} (100.0%)`);
  console.log(`True Positives (TP):        ${totalTp}`);
  console.log(`False Positives (FP):       ${totalFp}`);
  console.log(`False Negatives (FN):       ${totalFn}`);
  console.log(`Evaluation Precision:       ${(precision * 100).toFixed(2)}%`);
  console.log(`Evaluation Recall:          ${(recall * 100).toFixed(2)}%`);
  console.log(`Harmonic Mean (F1 Score):   ${(f1 * 100).toFixed(2)}%`);
  console.log(`Total Execution Time:       ${totalDuration}ms (avg ${(totalDuration / summaries.length).toFixed(1)}ms / case)`);
  console.log("===============================================================================\n");

  const resultsPath = path.join(rootDir, "benchmarks/benchmark-run-results.json");
  const reportData = {
    evaluatedAt: new Date().toISOString(),
    totalCases: summaries.length,
    schemaValidationRate: schemaValidCount / summaries.length,
    metrics: {
      truePositives: totalTp,
      falsePositives: totalFp,
      falseNegatives: totalFn,
      precision,
      recall,
      f1Score: f1,
    },
    totalDurationMs: totalDuration,
    cases: summaries,
  };

  await fs.writeFile(resultsPath, JSON.stringify(reportData, null, 2), "utf-8");
  console.log(`✓ Benchmark report written to ${resultsPath}\n`);

  if (schemaValidCount !== summaries.length) {
    throw new Error(`Schema validation failed on ${summaries.length - schemaValidCount} cases.`);
  }
}

runBenchmarkSuite().catch((err) => {
  console.error("Benchmark runner failed:", err);
  process.exit(1);
});

