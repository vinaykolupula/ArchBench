#!/usr/bin/env node
import * as fs from "node:fs/promises";
import * as path from "node:path";
import YAML from "yaml";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  loadArchSpecFile,
  loadArchSpecText,
  evaluateArchitecture,
  compareAlternatives,
  getLearningCard,
  formatLearningCard,
  runScenarioPack,
  ScenarioDefinition,
  BUILTIN_FITNESS_TESTS,
} from "@archbench/core";

const server = new McpServer({
  name: "archbench",
  version: "0.1.0",
});

// Helper to load loaded specification from either filePath or raw YAML string
async function resolveSpecification(filePath?: string, specYaml?: string) {
  if (filePath) {
    const resolved = path.resolve(process.cwd(), filePath);
    return loadArchSpecFile(resolved);
  }
  if (specYaml) {
    return loadArchSpecText(specYaml);
  }
  throw new Error("Either 'filePath' or 'specYaml' must be provided.");
}

// 1. Tool: archbench_validate_spec
server.tool(
  "archbench_validate_spec",
  "Validate an ArchSpec architecture specification against JSON Schema Draft 2020-12 and graph structural rules.",
  {
    filePath: z.string().optional().describe("Relative or absolute path to the archspec.yaml file on disk."),
    specYaml: z.string().optional().describe("Raw YAML string of the ArchSpec specification."),
  },
  async ({ filePath, specYaml }) => {
    try {
      const loaded = await resolveSpecification(filePath, specYaml);
      const { validation, graphs, spec } = loaded;

      const graphErrors: Array<{ alternativeId: string; message: string }> = [];
      for (const [altId, graph] of graphs.entries()) {
        const syncCycles = graph.findSynchronousCycles();
        for (const cycle of syncCycles) {
          graphErrors.push({
            alternativeId: altId,
            message: `Synchronous cycle detected: ${cycle.join(" -> ")}`,
          });
        }
      }

      const isValid = validation.valid && graphErrors.length === 0;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                valid: isValid,
                project: spec.archbench?.project,
                specVersion: spec.archbench?.spec_version,
                schemaErrors: validation.errors,
                schemaWarnings: validation.warnings,
                graphErrors,
                alternativesCount: graphs.size,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ valid: false, error: err.message }, null, 2) }],
      };
    }
  }
);

// 2. Tool: archbench_evaluate
server.tool(
  "archbench_evaluate",
  "Run the full ArchEval evaluation pipeline, checking deterministic fitness tests, requirement coverage, and JustEnough complexity.",
  {
    filePath: z.string().optional().describe("Path to archspec.yaml file on disk."),
    specYaml: z.string().optional().describe("Raw YAML string of the ArchSpec specification."),
    alternativeId: z.string().optional().describe("Specific architecture alternative ID to evaluate."),
  },
  async ({ filePath, specYaml, alternativeId }) => {
    try {
      const loaded = await resolveSpecification(filePath, specYaml);
      const evaluation = evaluateArchitecture(loaded.spec, loaded.normalizedSpec, loaded.graphs, {
        alternativeId,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(evaluation, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }, null, 2) }],
      };
    }
  }
);

// 3. Tool: archbench_get_findings
server.tool(
  "archbench_get_findings",
  "Query detailed architectural findings and risks filtered by severity or quality category.",
  {
    filePath: z.string().optional().describe("Path to archspec.yaml file on disk."),
    specYaml: z.string().optional().describe("Raw YAML string of the ArchSpec specification."),
    severity: z.enum(["critical", "error", "warning", "info"]).optional().describe("Filter findings by severity."),
    category: z.string().optional().describe("Filter findings by category (e.g. reliability, data_consistency, scalability)."),
  },
  async ({ filePath, specYaml, severity, category }) => {
    try {
      const loaded = await resolveSpecification(filePath, specYaml);
      const evaluation = evaluateArchitecture(loaded.spec, loaded.normalizedSpec, loaded.graphs);

      const allFindings: any[] = [];
      for (const alt of Object.values(evaluation.alternatives)) {
        for (const f of alt.findings) {
          if (severity && f.severity !== severity) continue;
          if (category && f.category !== category) continue;
          allFindings.push({
            alternativeId: alt.alternativeId,
            ...f,
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ findingsCount: allFindings.length, findings: allFindings }, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }, null, 2) }],
      };
    }
  }
);

// 4. Tool: archbench_run_scenario
server.tool(
  "archbench_run_scenario",
  "Challenge an architecture specification against declarative failure scenarios (queue lag, provider outages, traffic spikes).",
  {
    filePath: z.string().describe("Path to archspec.yaml file on disk."),
    pack: z.string().optional().default("core-failures").describe("Scenario pack name (default: core-failures)."),
    alternativeId: z.string().optional().describe("Target architecture alternative ID."),
  },
  async ({ filePath, pack, alternativeId }) => {
    try {
      const loaded = await resolveSpecification(filePath);
      const targetAltId = alternativeId || loaded.spec.architecture.alternatives[0]?.id;
      const graph = loaded.graphs.get(targetAltId);
      const alt = loaded.spec.architecture.alternatives.find((a) => a.id === targetAltId);

      if (!graph || !alt) {
        throw new Error(`Alternative "${targetAltId}" not found in specification.`);
      }

      const currentDir = import.meta.dirname || path.resolve(".");
      const candidateDirs = [
        path.resolve(process.cwd(), "packs/scenarios", pack),
        path.resolve(currentDir, "../../../packs/scenarios", pack),
      ];

      let targetDir = "";
      for (const dir of candidateDirs) {
        try {
          await fs.access(dir);
          targetDir = dir;
          break;
        } catch {
          // continue
        }
      }

      if (!targetDir) {
        throw new Error(`Scenario pack "${pack}" not found.`);
      }

      const files = await fs.readdir(targetDir);
      const scenarios: ScenarioDefinition[] = [];
      for (const file of files) {
        if (file.endsWith(".yaml") || file.endsWith(".yml")) {
          const content = await fs.readFile(path.join(targetDir, file), "utf-8");
          const parsed = YAML.parse(content) as ScenarioDefinition;
          if (parsed.id) scenarios.push(parsed);
        }
      }

      const packResult = runScenarioPack(pack, scenarios, loaded.spec, alt, graph);

      return {
        content: [{ type: "text", text: JSON.stringify(packResult, null, 2) }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }, null, 2) }],
      };
    }
  }
);

// 5. Tool: archbench_compare
server.tool(
  "archbench_compare",
  "Compare multiple architecture candidate alternatives side-by-side across coverage, complexity, and failure modes.",
  {
    filePath: z.string().describe("Path to archspec.yaml file containing multiple alternatives."),
  },
  async ({ filePath }) => {
    try {
      const loaded = await resolveSpecification(filePath);
      const evaluation = evaluateArchitecture(loaded.spec, loaded.normalizedSpec, loaded.graphs);
      const comparison = compareAlternatives(evaluation);

      return {
        content: [{ type: "text", text: JSON.stringify(comparison, null, 2) }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }, null, 2) }],
      };
    }
  }
);

// 6. Tool: archbench_explain_finding
server.tool(
  "archbench_explain_finding",
  "Retrieve Learning Mode architectural education, trade-off analysis, and remediation options for a concept or finding ID.",
  {
    conceptOrId: z.string().describe("Concept name or rule ID (e.g. outbox, REL-002, backpressure, spof)."),
    mode: z.enum(["guided", "quick"]).optional().default("guided").describe("Explanation mode: guided (deep) or quick (concise)."),
  },
  async ({ conceptOrId, mode }) => {
    const card = getLearningCard(conceptOrId);
    if (!card) {
      return {
        content: [
          {
            type: "text",
            text: `No architectural learning card found matching "${conceptOrId}". Try concepts like: backpressure, idempotency, outbox, sync-chains, spof, bounded-retries, dlq, just-enough.`,
          },
        ],
      };
    }

    const formatted = formatLearningCard(card, mode);
    return {
      content: [{ type: "text", text: formatted }],
    };
  }
);

// 7. Tool: archbench_get_spec
server.tool(
  "archbench_get_spec",
  "Retrieve the full parsed ArchSpec specification including requirements, components, connections, and decisions.",
  {
    filePath: z.string().optional().describe("Path to archspec.yaml file on disk."),
    specYaml: z.string().optional().describe("Raw YAML string of the ArchSpec specification."),
  },
  async ({ filePath, specYaml }) => {
    try {
      const loaded = await resolveSpecification(filePath, specYaml);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                project: loaded.spec.archbench.project,
                specVersion: loaded.spec.archbench.spec_version,
                description: loaded.spec.archbench.description,
                context: loaded.spec.system.context,
                requirementsCount: loaded.spec.system.requirements?.length || 0,
                requirements: loaded.spec.system.requirements,
                constraints: loaded.spec.system.constraints,
                assumptions: loaded.spec.system.assumptions,
                alternativesCount: loaded.spec.architecture.alternatives.length,
                alternatives: loaded.spec.architecture.alternatives,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }, null, 2) }],
      };
    }
  }
);

// 8. Tool: archbench_list_scenarios
server.tool(
  "archbench_list_scenarios",
  "Discover and list all available declarative failure and workload scenario packs.",
  {},
  async () => {
    try {
      const baseDir = process.env.INIT_CWD || process.cwd();
      const candidateDirs = [
        path.resolve(baseDir, "packs/scenarios"),
        path.resolve(process.cwd(), "packs/scenarios"),
        path.resolve(import.meta.dirname || process.cwd(), "../../../packs/scenarios"),
      ];

      let scenariosDir = "";
      for (const dir of candidateDirs) {
        try {
          await fs.access(dir);
          scenariosDir = dir;
          break;
        } catch {
          // continue
        }
      }

      if (!scenariosDir) {
        return {
          content: [{ type: "text", text: JSON.stringify({ packs: [] }, null, 2) }],
        };
      }

      const packEntries = await fs.readdir(scenariosDir, { withFileTypes: true });
      const packs: Array<{ pack: string; scenarios: any[] }> = [];

      for (const entry of packEntries) {
        if (entry.isDirectory()) {
          const packName = entry.name;
          const packDir = path.join(scenariosDir, packName);
          const files = await fs.readdir(packDir);
          const packScenarios: any[] = [];

          for (const file of files) {
            if (file.endsWith(".yaml") || file.endsWith(".yml")) {
              try {
                const content = await fs.readFile(path.join(packDir, file), "utf-8");
                const parsed = YAML.parse(content);
                if (parsed?.id) {
                  packScenarios.push({
                    id: parsed.id,
                    name: parsed.name,
                    category: parsed.category,
                    level: parsed.level,
                    description: parsed.description,
                  });
                }
              } catch {
                // ignore
              }
            }
          }

          packs.push({ pack: packName, scenarios: packScenarios });
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ packs }, null, 2) }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }, null, 2) }],
      };
    }
  }
);

// 9. Tool: archbench_list_tests
server.tool(
  "archbench_list_tests",
  "List all registered deterministic architecture fitness tests with their rule IDs and categories.",
  {
    category: z.string().optional().describe("Filter tests by category."),
  },
  async ({ category }) => {
    let tests = BUILTIN_FITNESS_TESTS;
    if (category) {
      const cat = category.toLowerCase().trim();
      tests = tests.filter((t) => t.category.toLowerCase() === cat);
    }

    const testSummaries = tests.map((t) => ({
      id: t.id,
      category: t.category,
      title: t.title,
      description: t.description,
      version: t.version,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ total: testSummaries.length, tests: testSummaries }, null, 2),
        },
      ],
    };
  }
);

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  console.error("Fatal error starting ArchBench MCP server:", err);
  process.exit(1);
});

