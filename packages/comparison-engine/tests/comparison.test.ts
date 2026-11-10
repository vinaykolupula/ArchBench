import { describe, it, expect } from "vitest";
import { compareAlternatives, generateComparisonMarkdown } from "../src/index.js";
import { EvaluationResult } from "@archbench/archeval";

describe("Alternative Comparison Engine", () => {
  const sampleEvaluation: EvaluationResult = {
    metadata: {
      project: "notification-platform",
      specVersion: "0.1",
      evaluatedAt: "2026-11-10T12:00:00Z",
      profile: "core-hld-v1",
    },
    passed: true,
    alternatives: {
      "modular-monolith": {
        alternativeId: "modular-monolith",
        alternativeName: "Modular Monolith",
        passed: true,
        summary: {
          totalFindings: 0,
          criticalCount: 0,
          errorCount: 0,
          warningCount: 0,
          infoCount: 0,
          unknownCount: 0,
          requirementCoverage: {
            total: 5,
            mapped: 5,
            unmappedMust: 0,
            unmappedShould: 0,
            percentage: 100,
          },
        },
        findings: [],
        justEnough: {
          complexityVector: {
            componentCount: 5,
            deployableCount: 2,
            networkBoundaryCount: 5,
            statefulStoreCount: 2,
            externalDependencyCount: 3,
          },
          componentJustifications: [],
          evolutionTriggers: [],
          summary: {
            justifiedCount: 5,
            conditionalCount: 0,
            prematureCount: 0,
            duplicativeCount: 0,
            unclearCount: 0,
          },
        },
      },
      "distributed-services": {
        alternativeId: "distributed-services",
        alternativeName: "Distributed Microservices with Event Streaming",
        passed: true,
        summary: {
          totalFindings: 0,
          criticalCount: 0,
          errorCount: 0,
          warningCount: 0,
          infoCount: 0,
          unknownCount: 0,
          requirementCoverage: {
            total: 5,
            mapped: 5,
            unmappedMust: 0,
            unmappedShould: 0,
            percentage: 100,
          },
        },
        findings: [],
        justEnough: {
          complexityVector: {
            componentCount: 9,
            deployableCount: 6,
            networkBoundaryCount: 14,
            statefulStoreCount: 4,
            externalDependencyCount: 3,
          },
          componentJustifications: [],
          evolutionTriggers: [],
          summary: {
            justifiedCount: 7,
            conditionalCount: 2,
            prematureCount: 0,
            duplicativeCount: 0,
            unclearCount: 0,
          },
        },
      },
    },
  };

  it("should compare alternatives across dimensions and produce conditional recommendation", () => {
    const comparison = compareAlternatives(sampleEvaluation);
    expect(comparison.project).toBe("notification-platform");
    expect(comparison.alternativesCompared).toHaveLength(2);
    expect(comparison.dimensions.length).toBeGreaterThanOrEqual(4);

    const deployDim = comparison.dimensions.find((d) => d.name === "Deployable Units");
    expect(deployDim).toBeDefined();
    expect(deployDim?.values["modular-monolith"]).toBe(2);
    expect(deployDim?.values["distributed-services"]).toBe(6);
    expect(deployDim?.advantageAlternativeId).toBe("modular-monolith");

    expect(comparison.conditionalRecommendation).toContain("Modular Monolith");
  });

  it("should render comparison markdown table", () => {
    const comparison = compareAlternatives(sampleEvaluation);
    const md = generateComparisonMarkdown(comparison);
    expect(md).toContain("# Architecture Alternative Comparison");
    expect(md).toContain("Modular Monolith");
    expect(md).toContain("Distributed Microservices with Event Streaming");
    expect(md).toContain("Trade-Off Comparison Matrix");
    expect(md).toContain("Conditional Recommendation");
  });
});

