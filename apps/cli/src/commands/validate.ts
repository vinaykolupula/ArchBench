import * as fs from "node:fs/promises";
import * as path from "node:path";
import pc from "picocolors";
import { loadArchSpecFile } from "@archbench/core";

export interface ValidateOptions {
  json?: boolean;
}

export async function validateCommand(filePath: string, options: ValidateOptions = {}) {
  const baseDir = process.env.INIT_CWD || process.cwd();
  const resolvedPath = path.resolve(baseDir, filePath);

  try {
    await fs.access(resolvedPath);
  } catch {
    if (options.json) {
      console.log(JSON.stringify({ valid: false, error: `File not found: ${filePath}` }, null, 2));
    } else {
      console.error(pc.red(`Error: File not found: ${filePath}`));
    }
    process.exitCode = 1;
    return;
  }

  try {
    const loaded = await loadArchSpecFile(resolvedPath);
    const { validation, graphs, spec } = loaded;

    // Additional Graph-level Structural Integrity Checks
    const graphErrors: Array<{ alternativeId: string; message: string; rule: string }> = [];
    const graphWarnings: Array<{ alternativeId: string; message: string; rule: string }> = [];

    for (const [altId, graph] of graphs.entries()) {
      // 1. Synchronous cycle detection (Critical)
      const syncCycles = graph.findSynchronousCycles();
      if (syncCycles.length > 0) {
        for (const cycle of syncCycles) {
          graphErrors.push({
            alternativeId: altId,
            message: `Synchronous cycle detected: ${cycle.join(" -> ")} (temporal coupling deadlock risk)`,
            rule: "graph.no_synchronous_cycles",
          });
        }
      }

      // 2. Orphaned component detection (Warning)
      const orphaned = graph.findOrphanedNodes();
      if (orphaned.length > 0) {
        for (const node of orphaned) {
          graphWarnings.push({
            alternativeId: altId,
            message: `Orphaned component "${node.id}" has no incoming or outgoing connections`,
            rule: "graph.no_orphaned_components",
          });
        }
      }
    }

    const isValid = validation.valid && graphErrors.length === 0;

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            valid: isValid,
            project: spec.archbench?.project,
            specVersion: spec.archbench?.spec_version,
            schemaErrors: validation.errors,
            schemaWarnings: validation.warnings,
            graphErrors,
            graphWarnings,
            alternativesEvaluated: Array.from(graphs.keys()),
          },
          null,
          2
        )
      );
      if (!isValid) process.exitCode = 1;
      return;
    }

    // Human-readable colored console output
    console.log(pc.bold(`\nArchBench Architecture Specification Validator`));
    console.log(pc.dim(`File: ${filePath}`));
    console.log(pc.dim(`Project: ${spec.archbench?.project ?? "Unknown"} (v${spec.archbench?.spec_version ?? "?"})\n`));

    if (isValid) {
      console.log(pc.green(`✔ Specification is structurally valid!`));
      console.log(pc.dim(`  Alternatives analyzed: ${Array.from(graphs.keys()).join(", ")}`));
      console.log(pc.dim(`  Requirements checked: ${spec.system?.requirements?.length ?? 0}`));

      if (validation.warnings.length > 0 || graphWarnings.length > 0) {
        console.log(pc.yellow(`\nWarnings (${validation.warnings.length + graphWarnings.length}):`));
        for (const w of validation.warnings) {
          const loc = w.location ? pc.dim(` [line ${w.location.line}, col ${w.location.column}]`) : "";
          console.log(pc.yellow(`  ⚠ ${w.message}${loc}`));
        }
        for (const gw of graphWarnings) {
          console.log(pc.yellow(`  ⚠ [${gw.alternativeId}] ${gw.message}`));
        }
      }
      console.log("");
    } else {
      console.log(pc.red(`✖ Specification validation failed with ${validation.errors.length + graphErrors.length} errors:`));

      for (const err of validation.errors) {
        const loc = err.location ? pc.dim(` (line ${err.location.line}, col ${err.location.column})`) : "";
        console.log(pc.red(`  • ${err.message}${loc}`));
      }

      for (const ge of graphErrors) {
        console.log(pc.red(`  • [${ge.alternativeId}] ${ge.message}`));
      }

      console.log("");
      process.exitCode = 1;
    }
  } catch (error: any) {
    if (options.json) {
      console.log(JSON.stringify({ valid: false, error: error.message }, null, 2));
    } else {
      console.error(pc.red(`✖ Validation error: ${error.message}`));
    }
    process.exitCode = 1;
  }
}
