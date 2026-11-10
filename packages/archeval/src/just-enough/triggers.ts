import { ArchitectureAlternative } from "@archbench/archspec";
import { EvolutionTriggerAssessment } from "../types.js";

export function evaluateEvolutionTriggers(
  alternative: ArchitectureAlternative
): EvolutionTriggerAssessment[] {
  const triggers: EvolutionTriggerAssessment[] = [];

  for (const dec of alternative.decisions || []) {
    for (const trig of dec.evolution_triggers || []) {
      triggers.push({
        id: trig.id,
        metric: trig.metric,
        threshold: trig.threshold,
        action: trig.action,
        status: "defined",
      });
    }
  }

  return triggers;
}

