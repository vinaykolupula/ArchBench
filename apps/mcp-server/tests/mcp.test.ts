import { describe, it, expect } from "vitest";
import * as path from "node:path";
import {
  loadArchSpecFile,
  evaluateArchitecture,
  compareAlternatives,
  getLearningCard,
  formatLearningCard,
} from "@archbench/core";

describe("MCP Server Core Functions", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const notificationPath = path.join(rootDir, "examples/notification-platform/archspec.yaml");

  it("loads and validates spec for MCP consumption", async () => {
    const loaded = await loadArchSpecFile(notificationPath);
    expect(loaded.validation.valid).toBe(true);
    expect(loaded.graphs.size).toBe(2);
  });

  it("evaluates architecture and exposes findings", async () => {
    const loaded = await loadArchSpecFile(notificationPath);
    const evaluation = evaluateArchitecture(loaded.spec, loaded.normalizedSpec, loaded.graphs);
    expect(evaluation.alternatives["modular-monolith"]).toBeDefined();
    expect(evaluation.alternatives["distributed-microservices"]).toBeDefined();
  });

  it("compares alternatives for MCP output", async () => {
    const loaded = await loadArchSpecFile(notificationPath);
    const evaluation = evaluateArchitecture(loaded.spec, loaded.normalizedSpec, loaded.graphs);
    const comp = compareAlternatives(evaluation);
    expect(comp.alternativesCompared.map((a) => a.id)).toEqual(["modular-monolith", "distributed-microservices"]);
    expect(comp.conditionalRecommendation).toBeDefined();
  });

  it("explains concepts using learning mode", () => {
    const card = getLearningCard("REL-002");
    expect(card).toBeDefined();
    expect(card?.id).toBe("concept-idempotency");
    expect(card?.concept).toContain("Idempotency");
    const formatted = formatLearningCard(card!, "quick");
    expect(formatted).toContain("Idempotency");
  });

  it("exposes registered fitness tests and spec details", async () => {
    const loaded = await loadArchSpecFile(notificationPath);
    expect(loaded.spec.system.requirements).toBeDefined();
    expect(loaded.spec.architecture.alternatives.length).toBe(2);
  });
});
