import { describe, it, expect } from "vitest";
import { generateMarkdownReport, generateJsonReport } from "../src/index.js";
import { EvaluationResult } from "@archbench/archeval";

describe("Report Engine", () => {
  const sampleResult: EvaluationResult = {
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
          totalFindings: 1,
          criticalCount: 0,
          errorCount: 0,
          warningCount: 1,
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
        findings: [
          {
            id: "f1",
            testId: "DATA-001",
            category: "data_consistency",
            status: "warning",
            severity: "warning",
            title: "Potential dual-write hazard",
            summary: "Direct write to DB and Queue without Outbox",
            evidence: [{ type: "component", id: "api-service" }],
            suggestedActions: ["Use Transactional Outbox Pattern"],
          },
        ],
        justEnough: {
          complexityVector: {
            componentCount: 4,
            deployableCount: 2,
            networkBoundaryCount: 3,
            statefulStoreCount: 2,
            externalDependencyCount: 2,
          },
          componentJustifications: [
            {
              componentId: "api-service",
              componentType: "application",
              status: "justified",
              reason: "Mapped to REQ-001",
              mappedRequirements: ["REQ-001"],
              mappedDecisions: [],
            },
          ],
          evolutionTriggers: [],
          summary: {
            justifiedCount: 1,
            conditionalCount: 0,
            prematureCount: 0,
            duplicativeCount: 0,
            unclearCount: 0,
          },
        },
      },
    },
  };

  it("should generate a structured Markdown report", () => {
    const md = generateMarkdownReport(sampleResult);
    expect(md).toContain("# ArchBench Architecture Evaluation Report");
    expect(md).toContain("`notification-platform`");
    expect(md).toContain("🟢 PASS");
    expect(md).toContain("Modular Monolith");
    expect(md).toContain("DATA-001");
    expect(md).toContain("Transactional Outbox Pattern");
  });

  it("should generate a valid JSON report", () => {
    const jsonStr = generateJsonReport(sampleResult);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.metadata.project).toBe("notification-platform");
    expect(parsed.passed).toBe(true);
    expect(parsed.alternatives["modular-monolith"]).toBeDefined();
  });
});

