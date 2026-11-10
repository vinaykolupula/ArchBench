import { describe, it, expect } from "vitest";
import { ArchitectureGraph } from "../src/graph.js";
import { ArchitectureAlternative } from "@archbench/archspec";

describe("ArchitectureGraph", () => {
  const sampleAlternative: ArchitectureAlternative = {
    id: "test-alt",
    name: "Test Architecture",
    components: [
      {
        id: "gateway",
        type: "api_gateway",
        responsibility: "API ingress",
      },
      {
        id: "auth-service",
        type: "service",
        responsibility: "Authentication",
      },
      {
        id: "order-service",
        type: "service",
        responsibility: "Order processing",
      },
      {
        id: "database",
        type: "relational_database",
        responsibility: "Database store",
      },
      {
        id: "isolated-component",
        type: "service",
        responsibility: "Unconnected orphaned service",
      },
    ],
    connections: [
      {
        id: "c1",
        from: "gateway",
        to: "order-service",
        protocol: "synchronous",
        timeout_ms: 1000,
      },
      {
        id: "c2",
        from: "order-service",
        to: "auth-service",
        protocol: "synchronous",
        timeout_ms: 500,
      },
      {
        id: "c3",
        from: "order-service",
        to: "database",
        protocol: "synchronous",
        timeout_ms: 200,
      },
    ],
  };

  it("should initialize nodes and edges correctly", () => {
    const graph = new ArchitectureGraph(sampleAlternative);
    expect(graph.getAllNodes()).toHaveLength(5);
    expect(graph.getAllEdges()).toHaveLength(3);
  });

  it("should detect orphaned unconnected nodes", () => {
    const graph = new ArchitectureGraph(sampleAlternative);
    const orphaned = graph.findOrphanedNodes();
    expect(orphaned).toHaveLength(1);
    expect(orphaned[0].id).toBe("isolated-component");
  });

  it("should identify reachability via BFS", () => {
    const graph = new ArchitectureGraph(sampleAlternative);
    const reachable = graph.getReachableNodes("gateway");
    expect(reachable.has("gateway")).toBe(true);
    expect(reachable.has("order-service")).toBe(true);
    expect(reachable.has("auth-service")).toBe(true);
    expect(reachable.has("database")).toBe(true);
    expect(reachable.has("isolated-component")).toBe(false);
  });

  it("should detect synchronous cycles when present", () => {
    const cyclicAlt: ArchitectureAlternative = JSON.parse(JSON.stringify(sampleAlternative));
    cyclicAlt.connections.push({
      id: "cycle-edge",
      from: "auth-service",
      to: "order-service",
      protocol: "synchronous",
    });

    const graph = new ArchitectureGraph(cyclicAlt);
    const cycles = graph.findSynchronousCycles();
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]).toContain("order-service");
    expect(cycles[0]).toContain("auth-service");
  });

  it("should not detect synchronous cycles if edge is asynchronous", () => {
    const asyncAlt: ArchitectureAlternative = JSON.parse(JSON.stringify(sampleAlternative));
    asyncAlt.connections.push({
      id: "async-return",
      from: "auth-service",
      to: "order-service",
      protocol: "asynchronous",
    });

    const graph = new ArchitectureGraph(asyncAlt);
    const cycles = graph.findSynchronousCycles();
    expect(cycles).toHaveLength(0);
  });

  it("should calculate critical path and total timeout summation", () => {
    const graph = new ArchitectureGraph(sampleAlternative);
    const paths = graph.findPaths("gateway", "database", true);
    expect(paths).toHaveLength(1);
    expect(paths[0].nodes).toEqual(["gateway", "order-service", "database"]);
    expect(paths[0].totalEstimatedTimeoutMs).toBe(1200);
    expect(paths[0].synchronousHops).toBe(2);
  });

  it("should detect single point of failure (articulation point)", () => {
    const graph = new ArchitectureGraph(sampleAlternative);
    const spofs = graph.findSinglePointsOfFailure();
    expect(spofs).toContain("order-service");
  });

  it("should export clean Mermaid flowchart syntax", () => {
    const graph = new ArchitectureGraph(sampleAlternative);
    const mermaid = graph.toMermaid();
    expect(mermaid).toContain("flowchart TD");
    expect(mermaid).toContain("gateway");
    expect(mermaid).toContain("order_service");
    expect(mermaid).toContain("database");
  });
});

