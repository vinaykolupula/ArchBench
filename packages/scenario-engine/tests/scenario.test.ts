import { describe, it, expect } from "vitest";
import { evaluateSafeExpression, runScenario, ScenarioDefinition } from "../src/index.js";
import { ArchSpec, ArchitectureAlternative } from "@archbench/archspec";
import { ArchitectureGraph } from "@archbench/graph-engine";

describe("Scenario Engine & Safe Expression Evaluator", () => {
  it("should evaluate mathematical expressions with operator precedence", () => {
    const ctx = { inputs: { a: 10, b: 5, c: 2 } };
    expect(evaluateSafeExpression("inputs.a + inputs.b * inputs.c", ctx)).toBe(20);
    expect(evaluateSafeExpression("(inputs.a + inputs.b) * inputs.c", ctx)).toBe(30);
    expect(evaluateSafeExpression("inputs.a > inputs.b && inputs.c < 5", ctx)).toBe(true);
    expect(evaluateSafeExpression("inputs.a == 10", ctx)).toBe(true);
  });

  const testScenario: ScenarioDefinition = {
    id: "queue.backlog.surge",
    version: 1,
    name: "Queue Consumer Lag & Backlog Recovery",
    category: "queue",
    level: "analytical",
    preconditions: {
      required_components: ["message_queue", "background_worker"],
    },
    inputs: {
      arrival_rate: { type: "number", default: 5000 },
      degraded_worker_rate: { type: "number", default: 2000 },
      surge_duration_seconds: { type: "integer", default: 600 },
      normal_worker_rate: { type: "number", default: 6000 },
    },
    simulation: {
      backlog_accumulated: "(inputs.arrival_rate - inputs.degraded_worker_rate) * inputs.surge_duration_seconds",
      recovery_time_seconds: "simulation.backlog_accumulated / (inputs.normal_worker_rate - inputs.arrival_rate)",
    },
    assertions: [
      {
        id: "backlog-limit",
        description: "Backlog accumulated must not exceed 2.5 million messages",
        condition: "simulation.backlog_accumulated < 2500000",
        severity: "critical",
      },
      {
        id: "recovery-rto",
        description: "Recovery duration must be under 3600 seconds",
        condition: "simulation.recovery_time_seconds <= 3600",
        severity: "warning",
      },
    ],
    learning: {
      concept: "Backpressure & Queue Sizing",
      explanation: "Sustained queue buildup requires explicit backlog limits and worker autoscaling.",
    },
  };

  const sampleAlt: ArchitectureAlternative = {
    id: "alt-queue",
    name: "Queue Architecture",
    components: [
      { id: "q", type: "message_queue", responsibility: "Queue" },
      { id: "w", type: "background_worker", responsibility: "Worker" },
    ],
    connections: [],
  };

  const mockSpec: ArchSpec = {
    archbench: { spec_version: "0.1", project: "test" },
    system: { requirements: [] },
    architecture: { alternatives: [sampleAlt] },
  };

  const graph = new ArchitectureGraph(sampleAlt);

  it("should execute analytical queue simulation correctly", () => {
    const result = runScenario(testScenario, mockSpec, sampleAlt, graph);
    expect(result.status).toBe("pass");
    expect(result.computedMetrics["backlog_accumulated"]).toBe(1800000); // (5000 - 2000) * 600
    expect(result.computedMetrics["recovery_time_seconds"]).toBe(1800); // 1800000 / (6000 - 5000)
    expect(result.assertions).toHaveLength(2);
    expect(result.assertions[0].passed).toBe(true);
    expect(result.assertions[1].passed).toBe(true);
  });

  it("should return not_applicable when preconditions are not met", () => {
    const altWithoutQueue: ArchitectureAlternative = {
      id: "no-queue",
      name: "No Queue",
      components: [{ id: "app", type: "application", responsibility: "App" }],
      connections: [],
    };
    const emptyGraph = new ArchitectureGraph(altWithoutQueue);
    const result = runScenario(testScenario, mockSpec, altWithoutQueue, emptyGraph);
    expect(result.status).toBe("not_applicable");
    expect(result.notApplicableReason).toContain('required component type "message_queue"');
  });

  it("should reject unterminated strings, trailing tokens, and prototype property access", () => {
    const ctx = { inputs: { a: 10 } };
    expect(() => evaluateSafeExpression('inputs.a == "unterminated', ctx)).toThrow(
      /Unterminated string literal/
    );
    expect(() => evaluateSafeExpression("inputs.a + 2 )", ctx)).toThrow(
      /Unexpected trailing token/
    );
    expect(() => evaluateSafeExpression("inputs.constructor", ctx)).toThrow(
      /Forbidden property access/
    );
    expect(() => evaluateSafeExpression("inputs.__proto__", ctx)).toThrow(
      /Forbidden property access/
    );
  });
});

