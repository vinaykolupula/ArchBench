import * as fs from "node:fs/promises";
import * as path from "node:path";
import pc from "picocolors";
import YAML from "yaml";
import { loadArchSpecFile } from "@archbench/core";
import {
  ScenarioDefinition,
  runScenarioPack,
} from "@archbench/scenario-engine";

export interface ScenarioCliOptions {
  pack?: string;
  scenario?: string;
  alternative?: string;
  json?: boolean;
}

export async function scenarioCommand(filePath: string, options: ScenarioCliOptions = {}) {
  const baseDir = process.env.INIT_CWD || process.cwd();
  const resolvedSpecPath = path.resolve(baseDir, filePath);

  try {
    await fs.access(resolvedSpecPath);
  } catch {
    console.error(pc.red(`Error: Specification file not found: ${filePath}`));
    process.exitCode = 1;
    return;
  }

  try {
    const loaded = await loadArchSpecFile(resolvedSpecPath);
    const { spec, graphs } = loaded;

    const availableAlts = Array.from(graphs.keys());
    if (availableAlts.length === 0) {
      console.error(pc.red(`✖ No architecture alternatives defined in specification.`));
      process.exitCode = 1;
      return;
    }

    const targetAltId = options.alternative || availableAlts[0];
    const graph = graphs.get(targetAltId);
    const alt = spec.architecture.alternatives.find((a) => a.id === targetAltId);

    if (!graph || !alt) {
      console.error(pc.red(`✖ Alternative "${targetAltId}" not found.`));
      process.exitCode = 1;
      return;
    }

    // Load scenarios
    const packName = options.pack || "core-failures";
    const scenarios = await loadScenarios(packName, options.scenario, baseDir);

    if (scenarios.length === 0) {
      console.error(pc.red(`✖ No scenarios found to run.`));
      process.exitCode = 1;
      return;
    }

    const packResult = runScenarioPack(packName, scenarios, spec, alt, graph);

    if (options.json) {
      console.log(JSON.stringify(packResult, null, 2));
      if (packResult.failedCount > 0) process.exitCode = 1;
      return;
    }

    // Console output
    console.log(pc.bold(`\nArchBench Failure-Driven Scenario Runner`));
    console.log(pc.dim(`Spec: ${filePath} [${targetAltId}] | Pack: ${packName}\n`));

    for (const res of packResult.results) {
      let badge = pc.green("✔ PASS");
      if (res.status === "fail") badge = pc.red("✖ FAIL");
      else if (res.status === "warning") badge = pc.yellow("⚠ WARNING");
      else if (res.status === "not_applicable") badge = pc.dim("⊘ NOT APPLICABLE");

      console.log(`${badge} ${pc.bold(res.scenarioName)} ${pc.dim(`(${res.scenarioId})`)}`);

      if (res.status === "not_applicable") {
        console.log(pc.dim(`    Reason: ${res.notApplicableReason}\n`));
        continue;
      }

      // Print computed simulation metrics
      const metricEntries = Object.entries(res.computedMetrics);
      if (metricEntries.length > 0) {
        console.log(pc.dim(`    Simulation Metrics:`));
        for (const [k, v] of metricEntries) {
          console.log(pc.dim(`      • ${k}: ${typeof v === "number" ? v.toLocaleString() : v}`));
        }
      }

      // Print assertions
      for (const a of res.assertions) {
        const icon = a.passed ? pc.green("✔") : a.severity === "critical" ? pc.red("✖") : pc.yellow("⚠");
        console.log(`    ${icon} ${a.description}`);
      }

      // Print learning takeaway
      if (res.learning) {
        console.log(pc.cyan(`    💡 Concept: ${res.learning.concept}`));
      }
      console.log("");
    }

    console.log(
      pc.bold(
        `Scenario Results: ${pc.green(`${packResult.passedCount} passed`)}, ${pc.red(
          `${packResult.failedCount} failed`
        )}, ${pc.yellow(`${packResult.warningCount} warnings`)}, ${pc.dim(
          `${packResult.skippedCount} skipped`
        )}\n`
      )
    );

    if (packResult.failedCount > 0) {
      process.exitCode = 1;
    }
  } catch (error: any) {
    console.error(pc.red(`✖ Scenario run error: ${error.message}`));
    process.exitCode = 1;
  }
}

async function loadScenarios(
  packName: string,
  scenarioFile: string | undefined,
  baseDir: string
): Promise<ScenarioDefinition[]> {
  const scenarios: ScenarioDefinition[] = [];

  if (scenarioFile) {
    const filePath = path.resolve(baseDir, scenarioFile);
    const content = await fs.readFile(filePath, "utf-8");
    scenarios.push(YAML.parse(content));
    return scenarios;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(packName)) {
    throw new Error(
      `Invalid scenario pack name "${packName}". Pack names may contain only letters, digits, hyphens, and underscores.`
    );
  }

  const currentDir = import.meta.dirname || path.resolve(".");
  const candidateDirs = [
    path.resolve(baseDir, "packs/scenarios", packName),
    path.resolve(currentDir, "../../../../packs/scenarios", packName),
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
    return scenarios;
  }

  const files = await fs.readdir(targetDir);
  for (const file of files) {
    if (file.endsWith(".yaml") || file.endsWith(".yml")) {
      const fullPath = path.join(targetDir, file);
      const content = await fs.readFile(fullPath, "utf-8");
      try {
        const parsed = YAML.parse(content) as ScenarioDefinition;
        if (parsed.id && parsed.name) {
          scenarios.push(parsed);
        }
      } catch {
        // ignore malformed scenario files
      }
    }
  }

  return scenarios;
}
