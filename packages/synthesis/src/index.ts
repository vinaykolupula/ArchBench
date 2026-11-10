import { SystemDesignBrief, SynthesisResult } from "./types.js";
import { synthesizeWithAIOrFallback, AIProviderConfig } from "./synthesizers/ai-provider-adapter.js";
import { benchmarkSynthesizedAlternatives } from "./benchmarking/harness.js";

export * from "./types.js";
export * from "./intake/presets.js";
export * from "./intake/normalizer.js";
export * from "./synthesizers/heuristic-synthesizer.js";
export * from "./synthesizers/ai-provider-adapter.js";
export * from "./benchmarking/harness.js";
export { validateArchSpec } from "@archbench/archspec";

/**
 * End-to-end Dynamic Architectural Synthesis & Benchmarking Pipeline:
 * 1. Takes user system design brief
 * 2. Normalizes requirements, assumptions, and constraints
 * 3. Synthesizes 3 contrasting candidate architectures (AI or intelligent heuristics)
 * 4. Benchmarks candidates side-by-side using ArchEval & Graph Engine
 * 5. Synthesizes an architectural verdict with evolution triggers
 * 6. Emits valid ArchSpec v0.1 YAML ready for simulation and visualization
 */
export async function synthesizeAndBenchmarkArchitecture(
  brief: SystemDesignBrief,
  aiConfig?: AIProviderConfig
): Promise<SynthesisResult> {
  const synthesis = await synthesizeWithAIOrFallback(brief, aiConfig);
  return benchmarkSynthesizedAlternatives(brief, synthesis.normalized, synthesis.alternatives);
}
