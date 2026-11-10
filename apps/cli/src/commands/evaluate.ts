import * as fs from "node:fs/promises";
import * as path from "node:path";
import pc from "picocolors";
import { evaluateArchSpecFile } from "@archbench/core";

export interface EvaluateCliOptions {
  alternative?: string;
  category?: string;
  format?: string;
  output?: string;
  failOn?: "critical" | "warning";
}

export async function evaluateCommand(filePath: string, options: EvaluateCliOptions = {}) {
  const baseDir = process.env.INIT_CWD || process.cwd();
  const resolvedPath = path.resolve(baseDir, filePath);

  try {
    await fs.access(resolvedPath);
  } catch {
    console.error(pc.red(`Error: File not found: ${filePath}`));
    process.exitCode = 1;
    return;
  }

  try {
    const categories = options.category
      ? options.category.split(",").map((c) => c.trim())
      : undefined;

    const evaluated = await evaluateArchSpecFile(resolvedPath, {
      alternativeId: options.alternative,
      categories,
    });

    const { validation, evaluation, markdownReport, jsonReport } = evaluated;

    if (!validation.valid) {
      console.error(pc.red(`✖ Cannot evaluate invalid specification. Schema errors:`));
      for (const err of validation.errors) {
        console.error(pc.red(`  • ${err.message}`));
      }
      process.exitCode = 1;
      return;
    }

    const format = (options.format || "markdown").toLowerCase();

    if (options.output) {
      const outputPath = path.resolve(baseDir, options.output);
      const content = format === "json" ? jsonReport : markdownReport;
      await fs.writeFile(outputPath, content, "utf-8");
      console.log(pc.green(`✔ Wrote evaluation report to ${outputPath}`));
    } else {
      if (format === "json") {
        console.log(jsonReport);
      } else if (format === "summary") {
        printConsoleSummary(evaluation);
      } else {
        console.log(markdownReport);
      }
    }

    // Determine exit code
    const failOn = options.failOn || "critical";
    let shouldFail = false;

    for (const alt of Object.values(evaluation.alternatives)) {
      if (failOn === "warning" && (alt.summary.criticalCount > 0 || alt.summary.errorCount > 0 || alt.summary.warningCount > 0)) {
        shouldFail = true;
      } else if (alt.summary.criticalCount > 0 || alt.summary.errorCount > 0) {
        shouldFail = true;
      }
    }

    if (shouldFail) {
      process.exitCode = 1;
    }
  } catch (error: any) {
    console.error(pc.red(`✖ Evaluation error: ${error.message}`));
    process.exitCode = 1;
  }
}

function printConsoleSummary(evaluation: any): void {
  console.log(pc.bold(`\nArchBench Evaluation Summary: ${evaluation.metadata.project}`));
  console.log(pc.dim(`Profile: ${evaluation.metadata.profile} | Date: ${evaluation.metadata.evaluatedAt}\n`));

  for (const altId of Object.keys(evaluation.alternatives)) {
    const alt = evaluation.alternatives[altId];
    const statusText = alt.passed ? pc.green("PASSED") : pc.red("ACTION REQUIRED");
    console.log(pc.bold(`Alternative [${altId}]: ${statusText} | Health Score: ${alt.score}/100`));
    console.log(`  Requirements: ${alt.summary.requirementCoverage.mapped}/${alt.summary.requirementCoverage.total} (${alt.summary.requirementCoverage.percentage}%)`);
    console.log(`  Findings: ${alt.summary.totalFindings} total (` +
      pc.red(`${alt.summary.criticalCount} critical, ${alt.summary.errorCount} error`) + `, ` +
      pc.yellow(`${alt.summary.warningCount} warning`) + `, ` +
      pc.cyan(`${alt.summary.unknownCount} unknown`) + `)`
    );
    console.log(`  Complexity Vector: ${alt.justEnough.complexityVector.componentCount} comps, ${alt.justEnough.complexityVector.deployableCount} deployables, ${alt.justEnough.complexityVector.statefulStoreCount} stateful stores\n`);
  }
}

