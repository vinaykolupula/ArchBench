import { FitnessTest, ArchitectureFinding } from "../../types.js";

export const unmeasurableNFRsTest: FitnessTest = {
  id: "REQ-COV-002",
  version: "1.0",
  title: "Unmeasurable Non-Functional Requirements",
  category: "requirement_coverage",
  description: "Detects non-functional requirements (NFRs) lacking quantifiable targets or verification criteria.",
  evaluate(context): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];
    const nfrCategories = new Set([
      "availability",
      "latency",
      "throughput",
      "durability",
      "consistency",
      "scalability",
    ]);

    const { spec } = context;
    for (const req of spec.system.requirements || []) {
      if (nfrCategories.has(req.category)) {
        const hasTarget = req.target && Object.keys(req.target).length > 0;
        const hasVerification = Boolean(req.verification);

        if (!hasTarget) {
          findings.push({
            id: `finding-${req.id}-no-target`,
            testId: "REQ-COV-002",
            category: "requirement_coverage",
            status: "unknown",
            severity: "warning",
            title: `NFR "${req.id}" has no quantifiable target metrics`,
            summary: `NFR "${req.id}" in category "${req.category}" states "${req.statement}" but does not specify a measurable target (e.g., availability_percent, p95_latency_ms).`,
            evidence: [
              {
                type: "requirement",
                id: req.id,
                details: "Missing 'target' field with quantifiable SLO metric.",
              },
            ],
            relatedRequirements: [req.id],
            suggestedActions: [
              `Define numeric target parameters in the requirement (e.g., target: { availability_percent: 99.9 }).`,
            ],
            learningConcept: "Service Level Objectives (SLOs)",
          });
        }

        if (!hasVerification) {
          findings.push({
            id: `finding-${req.id}-no-verification`,
            testId: "REQ-COV-002",
            category: "requirement_coverage",
            status: "warning",
            severity: "info",
            title: `NFR "${req.id}" lacks verification method`,
            summary: `NFR "${req.id}" does not declare how it will be validated (e.g., architecture_check, scenario_and_slo_review, benchmark).`,
            evidence: [
              {
                type: "requirement",
                id: req.id,
                details: "Missing 'verification' field.",
              },
            ],
            relatedRequirements: [req.id],
            suggestedActions: [
              `Specify an explicit verification approach (e.g., verification: scenario_and_slo_review).`,
            ],
            learningConcept: "Architecture Fitness Functions",
          });
        }
      }
    }

    return findings;
  },
};

