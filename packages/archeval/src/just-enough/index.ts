import { ArchSpec, ArchitectureAlternative } from "@archbench/archspec";
import { ArchitectureGraph } from "@archbench/graph-engine";
import { JustEnoughAssessment } from "../types.js";
import { calculateComplexityVector } from "./complexity.js";
import { evaluateComponentJustifications } from "./traceability.js";
import { evaluateEvolutionTriggers } from "./triggers.js";

export * from "./complexity.js";
export * from "./traceability.js";
export * from "./triggers.js";

export function analyzeJustEnough(
  spec: ArchSpec,
  alternative: ArchitectureAlternative,
  graph: ArchitectureGraph
): JustEnoughAssessment {
  const complexityVector = calculateComplexityVector(alternative, graph);
  const componentJustifications = evaluateComponentJustifications(spec, alternative);
  const evolutionTriggers = evaluateEvolutionTriggers(alternative);

  let justifiedCount = 0;
  let conditionalCount = 0;
  let prematureCount = 0;
  let duplicativeCount = 0;
  let unclearCount = 0;

  for (const j of componentJustifications) {
    if (j.status === "justified") justifiedCount++;
    else if (j.status === "conditionally_justified") conditionalCount++;
    else if (j.status === "premature") prematureCount++;
    else if (j.status === "duplicative") duplicativeCount++;
    else if (j.status === "unclear") unclearCount++;
  }

  return {
    complexityVector,
    componentJustifications,
    evolutionTriggers,
    summary: {
      justifiedCount,
      conditionalCount,
      prematureCount,
      duplicativeCount,
      unclearCount,
    },
  };
}

