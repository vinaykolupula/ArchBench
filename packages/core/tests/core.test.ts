import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { loadArchSpecFile } from "../src/index.js";

describe("Core Facade & Golden Examples Integration", () => {
  const rootDir = path.resolve(__dirname, "../../../");

  it("should successfully load, validate, and construct graph for notification-platform example", async () => {
    const filePath = path.join(rootDir, "examples/notification-platform/archspec.yaml");
    const loaded = await loadArchSpecFile(filePath);

    expect(loaded.validation.valid).toBe(true);
    expect(loaded.validation.errors).toHaveLength(0);
    expect(loaded.spec.archbench.project).toBe("notification-platform");
    expect(loaded.graphs.has("modular-monolith")).toBe(true);

    const graph = loaded.graphs.get("modular-monolith")!;
    expect(graph.getAllNodes().length).toBeGreaterThan(5);
    expect(graph.findSynchronousCycles()).toHaveLength(0);
  });

  it("should successfully load, validate, and construct graph for url-shortener example", async () => {
    const filePath = path.join(rootDir, "examples/url-shortener/archspec.yaml");
    const loaded = await loadArchSpecFile(filePath);

    expect(loaded.validation.valid).toBe(true);
    expect(loaded.validation.errors).toHaveLength(0);
    expect(loaded.spec.archbench.project).toBe("url-shortener");
    expect(loaded.graphs.has("cached-nosql-architecture")).toBe(true);

    const graph = loaded.graphs.get("cached-nosql-architecture")!;
    expect(graph.getAllNodes().length).toBeGreaterThan(4);
    expect(graph.findSynchronousCycles()).toHaveLength(0);
  });

  it("should successfully load, validate, and construct graph for rag-document-pipeline example", async () => {
    const filePath = path.join(rootDir, "examples/rag-document-pipeline/archspec.yaml");
    const loaded = await loadArchSpecFile(filePath);

    expect(loaded.validation.valid).toBe(true);
    expect(loaded.validation.errors).toHaveLength(0);
    expect(loaded.spec.archbench.project).toBe("rag-document-pipeline");
    expect(loaded.graphs.has("asynchronous-rag-pipeline")).toBe(true);

    const graph = loaded.graphs.get("asynchronous-rag-pipeline")!;
    expect(graph.getAllNodes().length).toBeGreaterThan(5);
    expect(graph.findSynchronousCycles()).toHaveLength(0);
  });
});

