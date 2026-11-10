import { ArchSpec } from "@archbench/archspec";

export interface SystemDesignBrief {
  name: string;
  description: string;
  domain: string;
  scaleTargets: {
    peakRps: number;
    p99LatencyMs: number;
    availabilityPercent: number; // e.g. 99.99
    dailyActiveUsers?: number;
    readWriteRatio?: string; // e.g. "80:20"
  };
  functionalRequirements: string[];
  constraints: {
    budgetMonthlyUsd?: number;
    teamSize?: number;
    preferredLanguages?: string[];
    cloudProvider?: "aws" | "gcp" | "azure" | "agnostic";
    deploymentModel?: "kubernetes" | "serverless" | "monolith" | "hybrid";
  };
}

export interface SystemDesignPreset {
  id: string;
  title: string;
  category: string;
  badge: string;
  brief: SystemDesignBrief;
}

export interface CandidateBenchmarkMetrics {
  healthScore: number;
  status: "passed" | "risks" | "failed";
  maxThroughputRps: number;
  latencySurgeP99Ms: number;
  queueDrainSeconds: number;
  singlePointsOfFailureCount: number;
  componentCount: number;
  deployableCount: number;
  statefulStoreCount: number;
  estimatedMonthlyCostUsd: number;
  cognitiveComplexity: "Low" | "Moderate" | "High" | "Extreme";
}

export interface SynthesizedAlternative {
  id: string;
  name: string;
  archetype: "modular_monolith" | "event_driven_sagas" | "distributed_microservices" | "crdt_edge" | "serverless";
  description: string;
  keyDecisions: string[];
  specAlternative: any;
  metrics: CandidateBenchmarkMetrics;
}

export interface ArchitecturalVerdict {
  recommendedAlternativeId: string;
  recommendationTitle: string;
  justification: string;
  keyTradeOffs: string[];
  evolutionTriggers: Array<{
    metric: string;
    threshold: string;
    action: string;
  }>;
}

export interface SynthesisResult {
  brief: SystemDesignBrief;
  normalizedRequirements: any[];
  assumptions: any[];
  alternatives: SynthesizedAlternative[];
  verdict: ArchitecturalVerdict;
  fullArchSpecYaml: string;
  fullArchSpec: ArchSpec;
}
