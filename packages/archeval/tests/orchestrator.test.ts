import { describe, it, expect } from "vitest";
import { evaluateArchitecture } from "../src/orchestrator/index.js";
import { ArchSpec } from "@archbench/archspec";
import { ArchitectureGraph } from "@archbench/graph-engine";

describe("ArchEval Orchestrator & JustEnough Architecture", () => {
  const spec: ArchSpec = {
    archbench: {
      spec_version: "0.1",
      project: "order-management",
    },
    system: {
      requirements: [
        {
          id: "REQ-01",
          category: "functional",
          priority: "must",
          statement: "Create orders.",
        },
      ],
      constraints: [
        {
          id: "CON-01",
          category: "team",
          statement: "Small team of 2 engineers.",
        },
      ],
    },
    architecture: {
      alternatives: [
        {
          id: "monolith",
          name: "Monolith Alternative",
          components: [
            {
              id: "app",
              type: "application",
              responsibility: "API and business logic",
              requirements: ["REQ-01"],
            },
            {
              id: "db",
              type: "relational_database",
              responsibility: "Persistent state",
              requirements: ["REQ-01"],
              data: { ownership: "order-domain" },
            },
          ],
          connections: [
            {
              id: "c1",
              from: "app",
              to: "db",
              protocol: "synchronous",
            },
          ],
          decisions: [
            {
              id: "ADR-01",
              title: "Use PostgreSQL",
              status: "accepted",
              context: "Store order records in PostgreSQL db",
              choice: "PostgreSQL",
              requirements: ["REQ-01"],
              evolution_triggers: [
                {
                  id: "TRIG-01",
                  metric: "write_iops",
                  threshold: "> 5000",
                  action: "Sharding",
                },
              ],
            },
          ],
        },
      ],
    },
  };

  const graph = new ArchitectureGraph(spec.architecture.alternatives[0]);
  const graphs = new Map([["monolith", graph]]);

  it("should evaluate architecture and compute complexity vector", () => {
    const result = evaluateArchitecture(spec, spec, graphs);
    expect(result.metadata.project).toBe("order-management");
    expect(result.alternatives["monolith"]).toBeDefined();

    const altEval = result.alternatives["monolith"];
    expect(altEval.summary.requirementCoverage.percentage).toBe(100);
    expect(altEval.justEnough.complexityVector.componentCount).toBe(2);
    expect(altEval.justEnough.complexityVector.deployableCount).toBe(1);
    expect(altEval.justEnough.complexityVector.statefulStoreCount).toBe(1);
    expect(altEval.justEnough.evolutionTriggers).toHaveLength(1);
    expect(altEval.justEnough.evolutionTriggers[0].id).toBe("TRIG-01");
  });
});

