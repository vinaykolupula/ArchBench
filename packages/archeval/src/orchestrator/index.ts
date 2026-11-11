import { ArchSpec, ArchitectureAlternative } from "@archbench/archspec";
import { ArchitectureGraph } from "@archbench/graph-engine";
import { runFitnessTests, RunFitnessOptions } from "@archbench/fitness-tests";
import { analyzeJustEnough } from "../just-enough/index.js";
import {
  EvaluationResult,
  AlternativeEvaluation,
  EvaluationSummary,
  RequirementCoverageSummary,
} from "../types.js";

export interface OrchestratorOptions extends RunFitnessOptions {
  profile?: string;
  alternativeId?: string;
}

export function evaluateArchitecture(
  spec: ArchSpec,
  normalizedSpec: ArchSpec,
  graphs: Map<string, ArchitectureGraph>,
  options: OrchestratorOptions = {}
): EvaluationResult {
  const profile = options.profile || "core-hld-v1";
  const alternativesMap: Record<string, AlternativeEvaluation> = {};
  let overallPassed = true;

  const altsToEvaluate = normalizedSpec.architecture.alternatives.filter((alt) => {
    if (options.alternativeId) {
      return alt.id === options.alternativeId;
    }
    return true;
  });

  for (const alt of altsToEvaluate) {
    const graph = graphs.get(alt.id);
    if (!graph) continue;

    const context = {
      spec,
      normalizedSpec,
      alternative: alt,
      graph,
    };

    // 1. Run Fitness Tests
    const findings = runFitnessTests(context, options);

    // 2. Run JustEnough Architecture Analysis
    const justEnough = analyzeJustEnough(spec, alt, graph);

    // 3. Compute Requirement Coverage
    const reqCoverage = calculateRequirementCoverage(spec, alt);

    // 4. Compute Finding Severities
    let criticalCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let unknownCount = 0;

    for (const f of findings) {
      if (f.status === "unknown") unknownCount++;
      if (f.severity === "critical") criticalCount++;
      else if (f.severity === "error") errorCount++;
      else if (f.severity === "warning") warningCount++;
      else if (f.severity === "info") infoCount++;
    }

    const passed = criticalCount === 0 && errorCount === 0;
    if (!passed) overallPassed = false;

    // 5. Compute Deterministic Health Score (0-100)
    const rawScore =
      100 -
      criticalCount * 25 -
      errorCount * 15 -
      warningCount * 5 -
      Math.round((100 - reqCoverage.percentage) * 0.25);
    const score = Math.max(0, Math.min(100, rawScore));

    const summary: EvaluationSummary = {
      score,
      totalFindings: findings.length,
      criticalCount,
      errorCount,
      warningCount,
      infoCount,
      unknownCount,
      requirementCoverage: reqCoverage,
    };

    alternativesMap[alt.id] = {
      alternativeId: alt.id,
      alternativeName: alt.name,
      passed,
      score,
      summary,
      findings,
      justEnough,
    };
  }

  return {
    metadata: {
      project: spec.archbench.project,
      specVersion: spec.archbench.spec_version,
      evaluatedAt: new Date().toISOString(),
      profile,
    },
    passed: overallPassed,
    alternatives: alternativesMap,
  };
}

function calculateRequirementCoverage(
  spec: ArchSpec,
  alt: ArchitectureAlternative
): RequirementCoverageSummary {
  const allReqs = spec.system.requirements || [];
  const total = allReqs.length;

  const mappedReqIds = new Set<string>();
  for (const comp of alt.components) {
    for (const rId of comp.requirements || []) {
      mappedReqIds.add(rId);
    }
  }
  for (const dec of alt.decisions || []) {
    for (const rId of dec.requirements || []) {
      mappedReqIds.add(rId);
    }
  }

  let unmappedMust = 0;
  let unmappedShould = 0;

  for (const r of allReqs) {
    if (!mappedReqIds.has(r.id)) {
      if (r.priority === "must") unmappedMust++;
      else if (r.priority === "should") unmappedShould++;
    }
  }

  const mapped = allReqs.filter((r) => mappedReqIds.has(r.id)).length;
  const percentage = total > 0 ? Math.round((mapped / total) * 100) : 100;

  return {
    total,
    mapped,
    unmappedMust,
    unmappedShould,
    percentage,
  };
}
