import { SystemDesignBrief } from "../types.js";
import { synthesizeHeuristicAlternatives } from "./heuristic-synthesizer.js";
import { parseArchSpecText, validateArchSpec } from "@archbench/archspec";

export interface AIProviderConfig {
  provider?: "gemini" | "openai" | "anthropic" | "ollama" | "auto";
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export function detectAvailableAIProvider(): AIProviderConfig | null {
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: "gemini",
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-1.5-pro-latest",
    };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o",
    };
  }
  if (process.env.OLLAMA_HOST) {
    return {
      provider: "ollama",
      baseUrl: process.env.OLLAMA_HOST,
      model: process.env.OLLAMA_MODEL || "llama3.1",
    };
  }
  return null;
}

const SYSTEM_PROMPT = `You are a Principal Cloud & Systems Architect generating formal ArchSpec v0.1 YAML architectures.
Given a system design brief, you must synthesize 3 contrasting architectural alternatives:
1. Lean Minimal / Modular Monolith
2. Event-Driven Sagas / Decoupled Microservices
3. High-Throughput Distributed / Partitioned Streaming

Each alternative must declare:
- id, name, description
- components (id, name, type, technology, responsibility, requirements, deployment)
- connections (id, from, to, protocol, transport, purpose)
- decisions (ADRs)

Output ONLY pure, valid YAML matching the ArchSpec v0.1 schema. Do not enclose in markdown backticks or conversational filler.`;

export async function synthesizeWithAIOrFallback(
  brief: SystemDesignBrief,
  customConfig?: AIProviderConfig
): Promise<{
  source: "ai" | "heuristic";
  provider?: string;
  normalized: any;
  alternatives: any[];
  rawYaml?: string;
}> {
  const config = customConfig || detectAvailableAIProvider();

  if (!config || !config.provider) {
    // Zero-network fallback (ADR-010)
    const heuristic = synthesizeHeuristicAlternatives(brief);
    return {
      source: "heuristic",
      normalized: heuristic.normalized,
      alternatives: heuristic.alternatives,
    };
  }

  try {
    const userPrompt = `System Design Brief:
Name: ${brief.name}
Description: ${brief.description}
Domain: ${brief.domain}
Scale Targets:
  Peak RPS: ${brief.scaleTargets.peakRps}
  P99 Latency: ${brief.scaleTargets.p99LatencyMs}ms
  Availability: ${brief.scaleTargets.availabilityPercent}%
Functional Requirements:
${brief.functionalRequirements.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}
Constraints:
  Budget: \$${brief.constraints.budgetMonthlyUsd || 1500}/mo
  Team Size: ${brief.constraints.teamSize || 6} engineers
  Preferred Languages: ${brief.constraints.preferredLanguages?.join(", ") || "Go, TypeScript"}
  Cloud: ${brief.constraints.cloudProvider || "agnostic"}

Synthesize 3 contrasting alternatives formatted in ArchSpec v0.1 YAML.`;

    let generatedText = "";

    if (config.provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || "gemini-1.5-pro-latest"}:generateContent?key=${config.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
          generationConfig: { temperature: 0.2 },
        }),
      });
      if (res.ok) {
        const json: any = await res.json();
        generatedText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    } else if (config.provider === "openai") {
      const url = "https://api.openai.com/v1/chat/completions";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
      });
      if (res.ok) {
        const json: any = await res.json();
        generatedText = json.choices?.[0]?.message?.content || "";
      }
    }

    // Strip markdown code fences if present
    const cleanedYaml = generatedText
      .replace(/^```yaml\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    if (cleanedYaml) {
      const parsed = parseArchSpecText<any>(cleanedYaml);
      const validation = validateArchSpec(parsed.data);
      if (validation.valid && parsed.data.architecture?.alternatives?.length) {
        return {
          source: "ai",
          provider: config.provider,
          normalized: {
            requirements: parsed.data.system?.requirements || [],
            assumptions: parsed.data.system?.assumptions || [],
            constraints: parsed.data.system?.constraints || [],
          },
          alternatives: parsed.data.architecture.alternatives,
          rawYaml: cleanedYaml,
        };
      }
    }
  } catch (err) {
    // Log softly and gracefully fall back to heuristic synthesis
    console.warn("AI synthesis encountered error, falling back to deterministic heuristic:", err);
  }

  const heuristic = synthesizeHeuristicAlternatives(brief);
  return {
    source: "heuristic",
    normalized: heuristic.normalized,
    alternatives: heuristic.alternatives,
  };
}
