import { SystemDesignBrief } from "../types.js";
import { Requirement, Constraint, Assumption } from "@archbench/archspec";

export type NormalizedRequirement = Requirement;
export type NormalizedConstraint = Constraint;
export type NormalizedAssumption = Assumption;

export function normalizeBrief(brief: SystemDesignBrief) {
  const requirements: Requirement[] = [];
  const constraints: Constraint[] = [];
  const assumptions: Assumption[] = [];

  // 1. Functional Requirements
  brief.functionalRequirements.forEach((statement, idx) => {
    requirements.push({
      id: `REQ-FUNC-${String(idx + 1).padStart(3, "0")}`,
      category: "functional",
      priority: "must",
      statement,
      verification: "architecture_check",
    });
  });

  // 2. Non-Functional Requirements (SLAs)
  requirements.push({
    id: "NFR-AVAIL-001",
    category: "availability",
    priority: "must",
    statement: `System must guarantee at least ${brief.scaleTargets.availabilityPercent}% availability across 30-day rolling windows.`,
    target: { availability_percent: brief.scaleTargets.availabilityPercent },
    verification: "scenario_and_slo_review",
  });

  requirements.push({
    id: "NFR-LATENCY-001",
    category: "latency",
    priority: "must",
    statement: `Ingress API and read requests must satisfy P99 latency SLA under ${brief.scaleTargets.p99LatencyMs}ms.`,
    target: { p99_latency_ms: brief.scaleTargets.p99LatencyMs },
    verification: "scenario_simulation",
  });

  requirements.push({
    id: "NFR-THROUGHPUT-001",
    category: "throughput",
    priority: "must",
    statement: `Architecture must absorb peak traffic bursts of ${brief.scaleTargets.peakRps.toLocaleString()} requests per second without cascading outages.`,
    target: { peak_rps: brief.scaleTargets.peakRps },
    verification: "scenario_simulation",
  });

  // 3. Constraints
  if (brief.constraints.budgetMonthlyUsd) {
    constraints.push({
      id: "CONST-BUDGET-001",
      category: "budget",
      statement: `Total operational infrastructure and cloud spend must not exceed $${brief.constraints.budgetMonthlyUsd.toLocaleString()} / month.`,
    });
  }

  if (brief.constraints.teamSize) {
    constraints.push({
      id: "CONST-TEAM-001",
      category: "team",
      statement: `Design must be maintainable and operable by an engineering team of ${brief.constraints.teamSize} engineers.`,
    });
  }

  if (brief.constraints.cloudProvider) {
    constraints.push({
      id: "CONST-CLOUD-001",
      category: "technology",
      statement: `Target infrastructure must deploy cleanly to ${brief.constraints.cloudProvider.toUpperCase()}.`,
    });
  }

  // 4. Assumptions
  assumptions.push({
    id: "ASSUMP-SCALE-001",
    statement: `Traffic read/write distribution follows expected ${brief.scaleTargets.readWriteRatio || "80:20"} ratio.`,
    status: "assumed",
    confidence: "high",
    impact_if_false: "high",
    validation: "Monitor production HTTP verb telemetry during pilot rollout.",
  });

  assumptions.push({
    id: "ASSUMP-RESILIENCE-001",
    statement: "Underlying cloud availability zones provide independent power, networking, and flood boundaries.",
    status: "confirmed",
    confidence: "high",
    impact_if_false: "high",
    validation: "Review cloud SLA documentation and regional compliance certificates.",
  });

  return {
    requirements,
    constraints,
    assumptions,
  };
}
