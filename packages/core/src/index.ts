import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  ArchSpec,
  parseArchSpecText,
  validateArchSpec,
  normalizeArchSpec,
  ValidationResult,
  ParsedDocument,
} from "@archbench/archspec";
import { ArchitectureGraph } from "@archbench/graph-engine";
import {
  evaluateArchitecture,
  EvaluationResult,
  OrchestratorOptions,
} from "@archbench/archeval";
import {
  generateMarkdownReport,
  generateJsonReport,
  MarkdownReportOptions,
} from "@archbench/report-engine";

export interface LoadedSpecification {
  spec: ArchSpec;
  normalizedSpec: ArchSpec;
  validation: ValidationResult;
  graphs: Map<string, ArchitectureGraph>;
  parsedDoc: ParsedDocument<ArchSpec>;
}

export interface EvaluatedSpecification extends LoadedSpecification {
  evaluation: EvaluationResult;
  markdownReport: string;
  jsonReport: string;
}

/**
 * Loads, parses, validates, and builds graph models from raw ArchSpec YAML/JSON text.
 */
export function loadArchSpecText(rawText: string): LoadedSpecification {
  const parsedDoc = parseArchSpecText<ArchSpec>(rawText);
  const validation = validateArchSpec(parsedDoc.data, {
    getLocationForPath: parsedDoc.getLocationForPath,
  });

  const graphs = new Map<string, ArchitectureGraph>();

  let normalizedSpec = parsedDoc.data;
  if (validation.valid && parsedDoc.data.architecture?.alternatives) {
    normalizedSpec = normalizeArchSpec(parsedDoc.data);
    for (const alt of normalizedSpec.architecture.alternatives) {
      const graph = new ArchitectureGraph(alt, normalizedSpec.system?.context);
      graphs.set(alt.id, graph);
    }
  }

  return {
    spec: parsedDoc.data,
    normalizedSpec,
    validation,
    graphs,
    parsedDoc,
  };
}

/**
 * Reads an ArchSpec YAML/JSON file from disk, parses, validates, and constructs graph models.
 */
export async function loadArchSpecFile(filePath: string): Promise<LoadedSpecification> {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  const content = await fs.readFile(resolvedPath, "utf-8");
  return loadArchSpecText(content);
}

/**
 * Runs end-to-end ArchEval architecture evaluation and generates reports.
 */
export function evaluateLoadedSpecification(
  loaded: LoadedSpecification,
  options: OrchestratorOptions = {},
  reportOptions: MarkdownReportOptions = {}
): EvaluatedSpecification {
  const evaluation = evaluateArchitecture(
    loaded.spec,
    loaded.normalizedSpec,
    loaded.graphs,
    options
  );

  const markdownReport = generateMarkdownReport(evaluation, {
    ...reportOptions,
    graphs: loaded.graphs,
  });
  const jsonReport = generateJsonReport(evaluation);

  return {
    ...loaded,
    evaluation,
    markdownReport,
    jsonReport,
  };
}

export async function evaluateArchSpecFile(
  filePath: string,
  options: OrchestratorOptions = {}
): Promise<EvaluatedSpecification> {
  const loaded = await loadArchSpecFile(filePath);
  return evaluateLoadedSpecification(loaded, options);
}

export * from "@archbench/archspec";
export * from "@archbench/graph-engine";
export * from "@archbench/fitness-tests";
export * from "@archbench/archeval";
export * from "@archbench/comparison-engine";
export * from "@archbench/learning-mode";
export * from "@archbench/scenario-engine";
export * from "@archbench/report-engine";
