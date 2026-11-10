export interface DiscoveredSpec {
  path: string;
  name: string;
  type: "root" | "example";
}

export interface GraphNodeData {
  id: string;
  name: string;
  kind: "user" | "external_system" | "component";
  componentType?: string;
  technology?: string;
  responsibility?: string;
  metrics?: {
    inDegree: number;
    outDegree: number;
    syncInDegree: number;
    syncOutDegree: number;
    asyncInDegree: number;
    asyncOutDegree: number;
  };
  isSpof?: boolean;
  x?: number;
  y?: number;
  tier?: number;
  tierName?: string;
  rawComponent?: any;
}

export interface GraphEdgeData {
  id: string;
  from: string;
  to: string;
  protocol: "synchronous" | "asynchronous";
  transport?: string;
  purpose?: string;
  timeout_ms?: number;
}

export interface GraphTopology {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  cycles: string[][];
  mermaid: string;
  spofs: string[];
}

export interface ArchitectureFinding {
  ruleId: string;
  title: string;
  severity: "critical" | "error" | "warning" | "info";
  category: string;
  message: string;
  affectedComponents?: string[];
  remediation?: string;
  location?: { line?: number; column?: number };
}

export interface ComplexityVector {
  componentCount: number;
  deployableCount: number;
  networkBoundaryCount: number;
  statefulStoreCount: number;
  externalDependencyCount: number;
}

export interface ComponentJustification {
  componentId: string;
  componentType: string;
  status: "justified" | "conditional" | "premature" | "duplicative" | "unclear";
  reason: string;
  mappedRequirements?: string[];
  mappedDecisions?: string[];
}

export interface JustEnoughAssessment {
  complexityVector: ComplexityVector;
  componentJustifications: ComponentJustification[];
  evolutionTriggers: any[];
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

export interface EvaluationPayload {
  valid: boolean;
  errors: any[];
  evaluation: {
    metadata: {
      project: string;
      specVersion: string;
      evaluatedAt: string;
      profile: string;
    };
    passed: boolean;
    alternatives: Record<string, AlternativeEvaluation>;
  };
  markdownReport: string;
  jsonReport: string;
  graphs: Record<string, GraphTopology>;
  spec: any;
}

export interface ScenarioPack {
  path: string;
  name: string;
  category: string;
}

export interface SimulationResult {
  projectedRps: number;
  projectedLatencyMs: number;
  queueDrainTimeSeconds: number;
  blastRadiusNodes: string[];
  healthImpact: "nominal" | "warning" | "critical";
}

export type ActiveTab =
  | "canvas"
  | "dashboard"
  | "complexity"
  | "simulator"
  | "comparison"
  | "matrix"
  | "editor";
