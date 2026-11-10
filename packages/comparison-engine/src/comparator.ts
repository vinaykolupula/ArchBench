import { EvaluationResult } from "@archbench/archeval";
import { AlternativeComparisonResult, ComparisonDimension } from "./types.js";

export function compareAlternatives(result: EvaluationResult): AlternativeComparisonResult {
  const alts = Object.values(result.alternatives);

  const alternativesCompared = alts.map((a) => ({
    id: a.alternativeId,
    name: a.alternativeName,
    passed: a.passed,
  }));

  const dimensions: ComparisonDimension[] = [];

  // Dimension 1: Requirement Coverage
  const covValues: Record<string, string> = {};
  let bestCovAlt = "";
  let highestCov = -1;
  for (const a of alts) {
    const pct = a.summary.requirementCoverage.percentage;
    covValues[a.alternativeId] = `${a.summary.requirementCoverage.mapped}/${a.summary.requirementCoverage.total} (${pct}%)`;
    if (pct > highestCov) {
      highestCov = pct;
      bestCovAlt = a.alternativeId;
    }
  }
  dimensions.push({
    name: "Requirement Coverage",
    category: "coverage",
    description: "Percentage of declared must/should requirements mapped to architecture elements.",
    values: covValues,
    advantageAlternativeId: bestCovAlt,
    tradeOffNote: "Designs leaving must-have requirements unmapped incur functional delivery risk.",
  });

  // Dimension 2: Operational Complexity (Deployables)
  const deployValues: Record<string, number> = {};
  let lowestDeployAlt = "";
  let lowestDeployCount = Infinity;
  for (const a of alts) {
    const count = a.justEnough.complexityVector.deployableCount;
    deployValues[a.alternativeId] = count;
    if (count < lowestDeployCount) {
      lowestDeployCount = count;
      lowestDeployAlt = a.alternativeId;
    }
  }
  dimensions.push({
    name: "Deployable Units",
    category: "operational",
    description: "Number of independently deployed services, applications, and background workers.",
    values: deployValues,
    advantageAlternativeId: lowestDeployAlt,
    tradeOffNote: "More deployables provide independent scaling at the expense of CI/CD, deployment coordination, and observability burden.",
  });

  // Dimension 3: Network Boundaries
  const netValues: Record<string, number> = {};
  let lowestNetAlt = "";
  let lowestNetCount = Infinity;
  for (const a of alts) {
    const count = a.justEnough.complexityVector.networkBoundaryCount;
    netValues[a.alternativeId] = count;
    if (count < lowestNetCount) {
      lowestNetCount = count;
      lowestNetAlt = a.alternativeId;
    }
  }
  dimensions.push({
    name: "Network Boundaries",
    category: "complexity",
    description: "Total remote connections across service and infrastructure boundaries.",
    values: netValues,
    advantageAlternativeId: lowestNetAlt,
    tradeOffNote: "Fewer network boundaries reduce distributed latency, network partition hazards, and serialization overhead.",
  });

  // Dimension 4: Stateful Stores
  const storeValues: Record<string, number> = {};
  for (const a of alts) {
    storeValues[a.alternativeId] = a.justEnough.complexityVector.statefulStoreCount;
  }
  dimensions.push({
    name: "Stateful Stores",
    category: "data",
    description: "Databases, caches, message queues, and object storage systems.",
    values: storeValues,
    tradeOffNote: "Each stateful system introduces backup, restore, replication, and migration responsibilities.",
  });

  // Dimension 5: Architecture Findings
  const findingValues: Record<string, string> = {};
  let cleanestAlt = "";
  let fewestRisks = Infinity;
  for (const a of alts) {
    const riskScore = a.summary.criticalCount * 3 + a.summary.errorCount * 2 + a.summary.warningCount;
    findingValues[a.alternativeId] = `${a.summary.criticalCount} crit, ${a.summary.errorCount} err, ${a.summary.warningCount} warn`;
    if (riskScore < fewestRisks) {
      fewestRisks = riskScore;
      cleanestAlt = a.alternativeId;
    }
  }
  dimensions.push({
    name: "Architectural Risk Findings",
    category: "reliability",
    description: "Violations of fitness functions across reliability, data consistency, and structural integrity.",
    values: findingValues,
    advantageAlternativeId: cleanestAlt,
    tradeOffNote: "Designs with unaddressed critical or error findings fail repository policy checks.",
  });

  // Formulate Conditional Recommendation
  let conditionalRecommendation = "";
  const uncertaintyNotes: string[] = [];

  if (alts.length <= 1) {
    conditionalRecommendation = `Only one alternative (${alts[0]?.alternativeName || "default"}) was provided. Author additional candidates to compare trade-offs.`;
  } else {
    // Find candidate that passed with least complexity
    const passingAlts = alts.filter((a) => a.passed);
    if (passingAlts.length > 0) {
      const simplest = passingAlts.sort(
        (a, b) => a.justEnough.complexityVector.deployableCount - b.justEnough.complexityVector.deployableCount
      )[0];
      const otherAlts = passingAlts.filter((a) => a.alternativeId !== simplest.alternativeId);

      if (otherAlts.length > 0) {
        conditionalRecommendation = `Candidate "${simplest.alternativeName}" is currently recommended as the least complex viable design satisfying all requirements. Candidate "${otherAlts[0].alternativeName}" may become justified if independent team ownership or scaling triggers are reached.`;
      } else {
        conditionalRecommendation = `Candidate "${simplest.alternativeName}" is the only candidate that passed all fitness tests.`;
      }
    } else {
      conditionalRecommendation = `None of the candidate architectures passed all fitness tests. Resolve critical findings before proceeding.`;
    }
  }

  return {
    project: result.metadata.project,
    alternativesCompared,
    dimensions,
    conditionalRecommendation,
    uncertaintyNotes,
  };
}

