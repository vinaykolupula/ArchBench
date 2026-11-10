export type ScenarioCategory =
  | "queue"
  | "dependency"
  | "traffic"
  | "database"
  | "network"
  | "security";

export type ScenarioLevel = "static" | "analytical" | "simulation";

export interface ScenarioPreconditions {
  required_components?: string[];
  required_connections?: string[];
}

export interface ScenarioInputDef {
  type: "number" | "integer" | "string" | "boolean";
  required?: boolean;
  default?: unknown;
}

export interface ScenarioAssertion {
  id: string;
  description: string;
  condition: string;
  severity?: "critical" | "error" | "warning" | "info";
}

export interface ScenarioLearning {
  concept: string;
  explanation: string;
}

export interface ScenarioDefinition {
  id: string;
  version: number;
  name: string;
  category: ScenarioCategory;
  level: ScenarioLevel;
  preconditions?: ScenarioPreconditions;
  inputs?: Record<string, ScenarioInputDef>;
  simulation?: Record<string, string>;
  assertions: ScenarioAssertion[];
  learning?: ScenarioLearning;
}

export interface AssertionResult {
  id: string;
  description: string;
  passed: boolean;
  severity: "critical" | "error" | "warning" | "info";
  message: string;
}

export interface ScenarioRunResult {
  scenarioId: string;
  scenarioName: string;
  category: ScenarioCategory;
  level: ScenarioLevel;
  status: "pass" | "fail" | "warning" | "not_applicable";
  notApplicableReason?: string;
  computedMetrics: Record<string, number | boolean | string>;
  assertions: AssertionResult[];
  learning?: ScenarioLearning;
}

export interface ScenarioPackResult {
  packName: string;
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  skippedCount: number;
  results: ScenarioRunResult[];
}

