import { describe, it, expect } from "vitest";
import { validateArchSpec } from "../src/validator/index.js";

describe("validateArchSpec", () => {
  const minimalValidSpec = {
    archbench: {
      spec_version: "0.1",
      project: "minimal-system",
    },
    system: {
      requirements: [
        {
          id: "REQ-01",
          category: "functional",
          priority: "must",
          statement: "Process orders.",
        },
      ],
    },
    architecture: {
      alternatives: [
        {
          id: "alt-1",
          name: "Default Alternative",
          components: [
            {
              id: "comp-a",
              type: "application",
              responsibility: "Handles order processing",
              requirements: ["REQ-01"],
            },
          ],
          connections: [],
        },
      ],
    },
  };

  it("should validate a valid minimal specification", () => {
    const result = validateArchSpec(minimalValidSpec);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject specification with missing required fields", () => {
    const invalid = { archbench: { spec_version: "0.1" } };
    const result = validateArchSpec(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should detect duplicate requirement IDs", () => {
    const duplicateReq = JSON.parse(JSON.stringify(minimalValidSpec));
    duplicateReq.system.requirements.push({
      id: "REQ-01",
      category: "functional",
      priority: "should",
      statement: "Duplicate requirement id.",
    });

    const result = validateArchSpec(duplicateReq);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.rule === "semantic.unique_requirement_id")).toBe(true);
  });

  it("should detect duplicate component IDs in the same alternative", () => {
    const duplicateComp = JSON.parse(JSON.stringify(minimalValidSpec));
    duplicateComp.architecture.alternatives[0].components.push({
      id: "comp-a",
      type: "service",
      responsibility: "Duplicate component",
    });

    const result = validateArchSpec(duplicateComp);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.rule === "semantic.unique_component_id")).toBe(true);
  });

  it("should detect invalid connection endpoints", () => {
    const invalidConn = JSON.parse(JSON.stringify(minimalValidSpec));
    invalidConn.architecture.alternatives[0].connections.push({
      id: "conn-1",
      from: "comp-a",
      to: "non-existent-comp",
      protocol: "synchronous",
    });

    const result = validateArchSpec(invalidConn);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.rule === "semantic.connection_endpoint")).toBe(true);
  });

  it("should detect component referencing undeclared requirement", () => {
    const unknownReq = JSON.parse(JSON.stringify(minimalValidSpec));
    unknownReq.architecture.alternatives[0].components[0].requirements = ["UNKNOWN-REQ-999"];

    const result = validateArchSpec(unknownReq);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.rule === "semantic.requirement_reference")).toBe(true);
  });
});

