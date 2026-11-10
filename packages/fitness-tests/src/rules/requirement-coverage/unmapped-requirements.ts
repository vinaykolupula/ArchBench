import { FitnessTest, ArchitectureFinding } from "../../types.js";

export const unmappedRequirementsTest: FitnessTest = {
  id: "REQ-COV-001",
  version: "1.0",
  title: "Unmapped Architecture Requirements",
  category: "requirement_coverage",
  description: "Ensures every requirement is explicitly mapped to at least one architecture component or decision.",
  evaluate(context): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];
    const { spec, alternative } = context;

    // Collect all mapped requirements from components and decisions
    const mappedRequirementIds = new Set<string>();
    for (const comp of alternative.components) {
      if (comp.requirements) {
        for (const reqId of comp.requirements) {
          mappedRequirementIds.add(reqId);
        }
      }
    }
    if (alternative.decisions) {
      for (const dec of alternative.decisions) {
        if (dec.requirements) {
          for (const reqId of dec.requirements) {
            mappedRequirementIds.add(reqId);
          }
        }
      }
    }

    const allRequirements = spec.system.requirements || [];
    for (const req of allRequirements) {
      if (!mappedRequirementIds.has(req.id)) {
        const isMust = req.priority === "must";
        findings.push({
          id: `finding-${req.id}-unmapped`,
          testId: "REQ-COV-001",
          category: "requirement_coverage",
          status: isMust ? "fail" : "warning",
          severity: isMust ? "error" : "warning",
          title: `Requirement "${req.id}" is not mapped to any component or decision`,
          summary: `Requirement "${req.id}" (${req.priority.toUpperCase()}: "${req.statement}") has no owning component or explicit architectural decision in alternative "${alternative.id}".`,
          evidence: [
            {
              type: "requirement",
              id: req.id,
              details: `Category: ${req.category}, Priority: ${req.priority}`,
            },
          ],
          relatedRequirements: [req.id],
          suggestedActions: [
            `Add "${req.id}" to the 'requirements' list of the component responsible for implementing it.`,
            `Or document an architectural decision record (ADR) explaining how this requirement is satisfied.`,
          ],
          learningConcept: "Requirement Traceability",
        });
      }
    }

    return findings;
  },
};

