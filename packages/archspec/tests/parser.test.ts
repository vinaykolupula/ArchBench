import { describe, it, expect } from "vitest";
import { parseArchSpecText } from "../src/parser/index.js";

describe("parseArchSpecText", () => {
  it("should successfully parse valid YAML and resolve source locations", () => {
    const yaml = `archbench:
  spec_version: "0.1"
  project: test-project
system:
  requirements: []
architecture:
  alternatives: []
`;
    const parsed = parseArchSpecText<any>(yaml);
    expect(parsed.data).toBeDefined();
    expect(parsed.data.archbench.project).toBe("test-project");

    const loc = parsed.getLocationForPath("archbench.project");
    expect(loc).toBeDefined();
    expect(loc?.line).toBe(3);
  });

  it("should throw SyntaxError on malformed YAML", () => {
    const malformed = `archbench:
  spec_version: "0.1"
    invalid_indentation: true
`;
    expect(() => parseArchSpecText(malformed)).toThrow(SyntaxError);
  });
});

