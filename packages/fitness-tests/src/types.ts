import { ArchSpec, ArchitectureAlternative } from "@archbench/archspec";
import { ArchitectureGraph } from "@archbench/graph-engine";

export type FindingStatus =
  | "pass"
  | "fail"
  | "warning"
  | "not_applicable"
  | "unknown"
  | "error";

export type FindingSeverity = "critical" | "error" | "warning" | "info";

export interface EvidenceReference {
  type: "component" | "connection" | "requirement" | "decision" | "calculation" | "graph_path";
  id: string;
  details?: string;
}

export interface ArchitectureFinding {
  id: string;
  testId: string;
  category: string;
  status: FindingStatus;
  severity: FindingSeverity;
  title: string;
  summary: string;
  evidence: EvidenceReference[];
  affectedComponents?: string[];
  relatedRequirements?: string[];
  suggestedActions?: string[];
  learningConcept?: string;
}

export interface EvaluationContext {
  spec: ArchSpec;
  normalizedSpec: ArchSpec;
  alternative: ArchitectureAlternative;
  graph: ArchitectureGraph;
}

export interface FitnessTest {
  id: string;
  version: string;
  title: string;
  category: string;
  description: string;
  evaluate(context: EvaluationContext): ArchitectureFinding[];
}

