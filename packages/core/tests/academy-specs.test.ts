import { describe, expect, it } from "vitest";
import {
  BREAK_AND_FIX_LABS,
  INTERVIEW_CASE_STUDIES,
  evaluateLoadedSpecification,
  loadArchSpecText,
} from "../src/index.js";

describe("ArchBench Academy Embedded ArchSpecs & Break-and-Fix Labs", () => {
  it("validates every Break & Fix Lab broken/solution YAML and confirms target rule triggers & fixes", () => {
    for (const lab of Object.values(BREAK_AND_FIX_LABS)) {
      const brokenLoaded = loadArchSpecText(lab.brokenArchSpecYaml);
      expect(
        brokenLoaded.validation.valid,
        `${lab.id} broken YAML invalid: ${JSON.stringify(brokenLoaded.validation.errors)}`
      ).toBe(true);

      const brokenEval = evaluateLoadedSpecification(brokenLoaded);
      const brokenAlt = Object.values(brokenEval.evaluation.alternatives)[0];
      expect(brokenAlt).toBeDefined();
      const brokenRuleIds = new Set(brokenAlt.findings.map((f) => f.testId));

      for (const expectedRule of lab.targetRuleIds) {
        expect(
          brokenRuleIds.has(expectedRule),
          `${lab.id} broken YAML should trigger ${expectedRule} (triggered: ${Array.from(brokenRuleIds).join(", ")})`
        ).toBe(true);
      }

      const solutionLoaded = loadArchSpecText(lab.solutionArchSpecYaml);
      expect(
        solutionLoaded.validation.valid,
        `${lab.id} solution YAML invalid: ${JSON.stringify(solutionLoaded.validation.errors)}`
      ).toBe(true);

      const solEval = evaluateLoadedSpecification(solutionLoaded);
      const solAlt = Object.values(solEval.evaluation.alternatives)[0];
      expect(solAlt).toBeDefined();
      const solFailedRuleIds = new Set(solAlt.findings.map((f) => f.testId));

      for (const expectedRule of lab.targetRuleIds) {
        expect(
          solFailedRuleIds.has(expectedRule),
          `${lab.id} solution YAML still fails ${expectedRule}`
        ).toBe(false);
      }

      expect(solAlt.score).toBeGreaterThanOrEqual(brokenAlt.score);
    }
  });

  it("validates all 15 Interview Case Study ArchSpec blueprints against Draft 2020-12 schema", () => {
    for (const study of INTERVIEW_CASE_STUDIES) {
      const loaded = loadArchSpecText(study.archSpecYaml);
      expect(
        loaded.validation.valid,
        `${study.id} YAML schema invalid: ${JSON.stringify(loaded.validation.errors)}`
      ).toBe(true);

      const evaluated = evaluateLoadedSpecification(loaded);
      const alt = Object.values(evaluated.evaluation.alternatives)[0];
      expect(alt).toBeDefined();
      expect(alt.score).toBeGreaterThanOrEqual(80);
    }
  });
});
