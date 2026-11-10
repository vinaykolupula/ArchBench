import { ArchitectureFinding } from "@archbench/fitness-tests";

export type JustificationStatus =
  | "justified"
  | "conditionally_justified"
  | "premature"
  | "duplicative"
  | "unclear"
  | "potentially_insufficient";

export interface ComponentJustification {
  componentId: string;
  componentType: string;
  status: JustificationStatus;
  reason: string;
  mappedRequirements: string[];
  mappedDecisions: string[];
}

export interface ComplexityVector {
  componentCount: number;
  deployableCount: number;
  networkBoundaryCount: number;
  statefulStoreCount: number;
  externalDependencyCount: number;
}

export interface EvolutionTriggerAssessment {
  id: string;
  metric: string;
  threshold: string;
  action: string;
  status: "defined" | "triggered" | "unmonitored";
}

export interface JustEnoughAssessment {
  complexityVector: ComplexityVector;
  componentJustifications: ComponentJustification[];
  evolutionTriggers: EvolutionTriggerAssessment[];
  summary: {
    justifiedCount: number;
    conditionalCount: number;
    prematureCount: number;
    duplicativeCount: number;
    unclearCount: number;
  };
}

export interface RequirementCoverageSummary {
  total: number;
  mapped: number;
  unmappedMust: number;
  unmappedShould: number;
  percentage: number;
}

export interface EvaluationSummary {
  score: number;
  totalFindings: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  unknownCount: number;
  requirementCoverage: RequirementCoverageSummary;
}

export interface AlternativeEvaluation {
  alternativeId: string;
  alternativeName: string;
  passed: boolean;
  score: number;
  summary: EvaluationSummary;
  findings: ArchitectureFinding[];
  justEnough: JustEnoughAssessment;
}

export interface EvaluationResult {
  metadata: {
    project: string;
    specVersion: string;
    evaluatedAt: string;
    profile: string;
  };
  passed: boolean;
  alternatives: Record<string, AlternativeEvaluation>;
}
