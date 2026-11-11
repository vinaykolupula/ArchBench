import * as fs from "node:fs/promises";
import * as path from "node:path";
import pc from "picocolors";
import {
  loadArchSpecFile,
  evaluateArchitecture,
  compareAlternatives,
  generateComparisonMarkdown,
  generateComparisonJson,
} from "@archbench/core";

export interface CompareCliOptions {
  format?: string;
  output?: string;
}

export async function compareCommand(filePath: string, options: CompareCliOptions = {}) {
  const baseDir = process.env.INIT_CWD || process.cwd();
  const resolvedPath = path.resolve(baseDir, filePath);

  try {
    await fs.access(resolvedPath);
  } catch {
    console.error(pc.red(`Error: Specification file not found: ${filePath}`));
    process.exitCode = 1;
    return;
  }

  try {
    const loaded = await loadArchSpecFile(resolvedPath);
    const { spec, normalizedSpec, graphs, validation } = loaded;

    if (!validation.valid) {
      console.error(pc.red(`✖ Cannot compare invalid specification:`));
      for (const err of validation.errors) {
        console.error(pc.red(`  • ${err.message}`));
      }
      process.exitCode = 1;
      return;
    }

    if (spec.architecture.alternatives.length < 2) {
      console.log(pc.yellow(`ℹ Specification contains only 1 alternative ("${spec.architecture.alternatives[0]?.id}").`));
      console.log(pc.yellow(`  Add a second alternative to ${filePath} to compare architecture trade-offs.\n`));
    }

    const evaluation = evaluateArchitecture(spec, normalizedSpec, graphs);
    const comparison = compareAlternatives(evaluation);

    const format = (options.format || "markdown").toLowerCase();
    if (format !== "markdown" && format !== "json") {
      console.error(pc.red(`✖ Unsupported format "${format}". Supported formats: markdown, json.`));
      process.exitCode = 1;
      return;
    }
    const content = format === "json" ? generateComparisonJson(comparison) : generateComparisonMarkdown(comparison);

    if (options.output) {
      const outputPath = path.resolve(baseDir, options.output);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, content, "utf-8");
      console.log(pc.green(`✔ Wrote comparison report to ${outputPath}`));
    } else {
      console.log(content);
    }
  } catch (error: any) {
    console.error(pc.red(`✖ Comparison error: ${error.message}`));
    process.exitCode = 1;
  }
}

