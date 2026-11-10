import { describe, it, expect } from "vitest";
import { runFitnessTests } from "../src/index.js";
import { ArchSpec, ArchitectureAlternative } from "@archbench/archspec";
import { ArchitectureGraph } from "@archbench/graph-engine";

describe("Deterministic Fitness Tests", () => {
  const baseSpec: ArchSpec = {
    archbench: {
      spec_version: "0.1",
      project: "test-eval",
    },
    system: {
      context: {
        users: [{ id: "client" }],
      },
      requirements: [
        {
          id: "REQ-01",
          category: "functional",
          priority: "must",
          statement: "Process notifications.",
        },
        {
          id: "REQ-02",
          category: "functional",
          priority: "must",
          statement: "Unmapped must-have requirement.",
        },
        {
          id: "NFR-01",
          category: "availability",
          priority: "must",
          statement: "99.9% uptime target.",
          target: { availability_percent: 99.9 },
          verification: "slo_review",
        },
      ],
    },
    architecture: {
      alternatives: [],
    },
  };

  const sampleAlt: ArchitectureAlternative = {
    id: "alt-1",
    name: "Sample Alternative",
    components: [
      {
        id: "api",
        type: "application",
        responsibility: "API Gateway",
        requirements: ["REQ-01"],
        deployment: { replicas: 1 }, // Articulation point with 1 replica
      },
      {
        id: "queue",
        type: "message_queue",
        responsibility: "Queue",
        messaging: {
          delivery_semantics: "at_least_once",
          // overload_policy missing
        },
      },
      {
        id: "worker",
        type: "background_worker",
        responsibility: "Worker",
        behavior: {
          idempotent: false, // violates REL-002 under at_least_once queue
          retry_policy: {
            max_attempts: 15, // violates REL-001 excessive retries
            backoff: "exponential",
            // dead_letter_target missing -> violates REL-003
          },
        },
      },
    ],
    connections: [
      {
        id: "c0",
        from: "client",
        to: "api",
        protocol: "synchronous",
      },
      {
        id: "c1",
        from: "api",
        to: "queue",
        protocol: "asynchronous",
      },
      {
        id: "c2",
        from: "queue",
        to: "worker",
        protocol: "asynchronous",
      },
    ],
  };

  const graph = new ArchitectureGraph(sampleAlt, baseSpec.system.context);
  const context = {
    spec: baseSpec,
    normalizedSpec: baseSpec,
    alternative: sampleAlt,
    graph,
  };

  it("should flag unmapped must-have requirement REQ-02", () => {
    const findings = runFitnessTests(context, { categories: ["requirement_coverage"] });
    const unmapped = findings.find((f) => f.testId === "REQ-COV-001" && f.relatedRequirements?.includes("REQ-02"));
    expect(unmapped).toBeDefined();
    expect(unmapped?.severity).toBe("error");
  });

  it("should flag queue missing overload policy SCAL-001", () => {
    const findings = runFitnessTests(context, { categories: ["scalability"] });
    const queuePolicy = findings.find((f) => f.testId === "SCAL-001");
    expect(queuePolicy).toBeDefined();
    expect(queuePolicy?.affectedComponents).toContain("queue");
  });

  it("should flag worker with excessive retries REL-001", () => {
    const findings = runFitnessTests(context, { categories: ["reliability"] });
    const retryFinding = findings.find((f) => f.testId === "REL-001" && f.affectedComponents?.includes("worker"));
    expect(retryFinding).toBeDefined();
    expect(retryFinding?.title).toContain("high retry attempts");
  });

  it("should flag non-idempotent worker under at-least-once queue REL-002", () => {
    const findings = runFitnessTests(context, { categories: ["reliability"] });
    const idempotencyFinding = findings.find((f) => f.testId === "REL-002");
    expect(idempotencyFinding).toBeDefined();
    expect(idempotencyFinding?.severity).toBe("critical");
  });

  it("should flag worker missing dead-letter target REL-003", () => {
    const findings = runFitnessTests(context, { categories: ["reliability"] });
    const dlqFinding = findings.find((f) => f.testId === "REL-003");
    expect(dlqFinding).toBeDefined();
    expect(dlqFinding?.title).toContain("lacks a dead-letter target");
  });

  it("should flag articulation point with single replica as SPOF REL-004", () => {
    const findings = runFitnessTests(context, { categories: ["reliability"] });
    const spofFinding = findings.find((f) => f.testId === "REL-004" && f.affectedComponents?.includes("api"));
    expect(spofFinding).toBeDefined();
    expect(spofFinding?.title).toContain("single point of failure with 1 replica");
  });
});

