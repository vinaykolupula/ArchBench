import { ArchSpec, ArchitectureAlternative } from "@archbench/archspec";
import { ComponentJustification, JustificationStatus } from "../types.js";

export function evaluateComponentJustifications(
  spec: ArchSpec,
  alternative: ArchitectureAlternative
): ComponentJustification[] {
  const justifications: ComponentJustification[] = [];

  // Map decisions referencing components
  const decisionsByComponent = new Map<string, string[]>();
  for (const dec of alternative.decisions || []) {
    // If decision mentions component ID in context or choice
    for (const comp of alternative.components) {
      if (
        dec.choice.toLowerCase().includes(comp.id.toLowerCase()) ||
        dec.context.toLowerCase().includes(comp.id.toLowerCase()) ||
        dec.title.toLowerCase().includes(comp.id.toLowerCase())
      ) {
        if (!decisionsByComponent.has(comp.id)) {
          decisionsByComponent.set(comp.id, []);
        }
        decisionsByComponent.get(comp.id)!.push(dec.id);
      }
    }
  }

  // Check team constraint if small team
  const hasSmallTeamConstraint = spec.system.constraints?.some(
    (c) => c.category === "team" && (c.statement.toLowerCase().includes("small") || c.statement.includes("1-") || c.statement.includes("2-"))
  );

  for (const comp of alternative.components) {
    const mappedReqs = comp.requirements || [];
    const mappedDecs = decisionsByComponent.get(comp.id) || [];

    let status: JustificationStatus = "unclear";
    let reason = "";

    const isSophisticated =
      comp.type === "event_stream" ||
      comp.type === "cache" ||
      comp.type === "search_engine";

    if (mappedReqs.length > 0 && mappedDecs.length > 0) {
      status = "justified";
      reason = `Explicitly mapped to ${mappedReqs.length} requirement(s) and documented in decision(s) ${mappedDecs.join(", ")}.`;
    } else if (mappedReqs.length > 0) {
      status = "justified";
      reason = `Directly serves requirement(s): ${mappedReqs.join(", ")}.`;
    } else if (mappedDecs.length > 0) {
      status = "conditionally_justified";
      reason = `Supported by architectural decision ${mappedDecs.join(", ")}, but lacks direct requirement mapping.`;
    } else if (isSophisticated && hasSmallTeamConstraint) {
      status = "premature";
      reason = `High operational complexity infrastructure (${comp.type}) without direct requirement mapping under a small-team constraint.`;
    } else {
      status = "unclear";
      reason = `Component has no direct requirement mappings or architectural decision records justifying its existence.`;
    }

    justifications.push({
      componentId: comp.id,
      componentType: comp.type,
      status,
      reason,
      mappedRequirements: mappedReqs,
      mappedDecisions: mappedDecs,
    });
  }

  return justifications;
}
