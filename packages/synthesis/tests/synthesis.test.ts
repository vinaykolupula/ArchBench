import { describe, it, expect } from "vitest";
import {
  SYSTEM_DESIGN_PRESETS,
  normalizeBrief,
  synthesizeHeuristicAlternatives,
  benchmarkSynthesizedAlternatives,
  synthesizeAndBenchmarkArchitecture,
  validateArchSpec,
} from "../src/index.js";

describe("@archbench/synthesis", () => {
  it("provides 6 high-fidelity system design presets", () => {
    expect(SYSTEM_DESIGN_PRESETS.length).toBe(6);
    const ids = SYSTEM_DESIGN_PRESETS.map((p) => p.id);
    expect(ids).toContain("uber-ride-dispatch");
    expect(ids).toContain("figma-collaborative-canvas");
    expect(ids).toContain("robinhood-financial-ledger");
    expect(ids).toContain("netflix-video-pipeline");
    expect(ids).toContain("iot-telemetry-ingestion");
    expect(ids).toContain("enterprise-rag-search");
  });

  it("normalizes system design briefs into formal ArchSpec requirements", () => {
    const preset = SYSTEM_DESIGN_PRESETS[0];
    const normalized = normalizeBrief(preset.brief);

    expect(normalized.requirements.length).toBeGreaterThan(3);
    const availReq = normalized.requirements.find((r) => r.id === "NFR-AVAIL-001");
    expect(availReq).toBeDefined();
    expect(availReq?.category).toBe("availability");

    const latencyReq = normalized.requirements.find((r) => r.id === "NFR-LATENCY-001");
    expect(latencyReq).toBeDefined();
    expect(latencyReq?.category).toBe("latency");
  });

  it("synthesizes 3 contrasting candidate architectures with valid schemas", () => {
    const preset = SYSTEM_DESIGN_PRESETS[0];
    const { normalized, alternatives } = synthesizeHeuristicAlternatives(preset.brief);

    expect(alternatives.length).toBe(3);
    expect(alternatives[0].id).toBe("lean-modular-monolith");
    expect(alternatives[1].id).toBe("event-driven-sagas");
    expect(alternatives[2].id).toBe("distributed-partitioned-cluster");

    for (const alt of alternatives) {
      expect(alt.components.length).toBeGreaterThan(0);
      expect(alt.connections.length).toBeGreaterThan(0);
      expect(alt.decisions.length).toBeGreaterThan(0);
    }
  });

  it("benchmarks synthesized alternatives and produces an architectural verdict", async () => {
    const preset = SYSTEM_DESIGN_PRESETS[0]; // Uber Ride Dispatch
    const result = await synthesizeAndBenchmarkArchitecture(preset.brief);

    expect(result.alternatives.length).toBe(3);
    expect(result.verdict).toBeDefined();
    expect(result.verdict.recommendedAlternativeId).toBeTruthy();
    expect(result.verdict.evolutionTriggers.length).toBeGreaterThanOrEqual(3);

    // Verify metrics exist and synthesized alternatives pass fitness checks
    for (const alt of result.alternatives) {
      expect(alt.metrics.healthScore).toBeGreaterThanOrEqual(85);
      expect(alt.metrics.estimatedMonthlyCostUsd).toBeGreaterThan(0);
      expect(alt.metrics.maxThroughputRps).toBeGreaterThan(0);
      expect(alt.metrics.latencySurgeP99Ms).toBeGreaterThan(0);
    }

    // Verify full ArchSpec passes validation
    const validation = validateArchSpec(result.fullArchSpec);
    if (!validation.valid) {
      console.error("VALIDATION ERRORS:", JSON.stringify(validation.errors, null, 2));
    }
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("produces schema-valid passing architectures across all 6 system design presets", async () => {
    for (const preset of SYSTEM_DESIGN_PRESETS) {
      const result = await synthesizeAndBenchmarkArchitecture(preset.brief);
      const validation = validateArchSpec(result.fullArchSpec);
      expect(validation.valid).toBe(true);
      for (const alt of result.alternatives) {
        expect(alt.metrics.healthScore).toBeGreaterThanOrEqual(90);
      }
    }
  });
});
