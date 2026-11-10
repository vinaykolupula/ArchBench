import * as fs from "node:fs/promises";
import * as path from "node:path";
import { loadArchSpecFile, evaluateLoadedSpecification } from "@archbench/core";

async function main() {
  const rootDir = process.env.INIT_CWD || process.cwd();
  const examplesDir = path.join(rootDir, "examples");

  console.log("===============================================================================");
  console.log("                ArchBench Golden Reference Examples Validator                  ");
  console.log("===============================================================================\n");

  const entries = await fs.readdir(examplesDir, { withFileTypes: true });
  const exampleDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

  let allPassed = true;
  const results: Array<{
    name: string;
    valid: boolean;
    errors: string[];
    alternatives: number;
    score: number;
    criticalFindings: number;
  }> = [];

  for (const dirName of exampleDirs) {
    const specPath = path.join(examplesDir, dirName, "archspec.yaml");
    try {
      await fs.access(specPath);
    } catch {
      continue;
    }

    try {
      const loaded = await loadArchSpecFile(specPath);

      if (!loaded.validation.valid) {
        allPassed = false;
        results.push({
          name: dirName,
          valid: false,
          errors: loaded.validation.errors.map((e) => `${e.path}: ${e.message}`),
          alternatives: 0,
          score: 0,
          criticalFindings: 0,
        });
        continue;
      }

      const evaluated = evaluateLoadedSpecification(loaded);
      const alts = Object.values(evaluated.evaluation.alternatives);
      const defaultAlt = alts[0];
      const score = defaultAlt?.summary.score ?? 0;
      const criticalCount = defaultAlt?.findings.filter((f) => f.severity === "critical").length ?? 0;

      results.push({
        name: dirName,
        valid: true,
        errors: [],
        alternatives: alts.length,
        score,
        criticalFindings: criticalCount,
      });
    } catch (err: any) {
      allPassed = false;
      results.push({
        name: dirName,
        valid: false,
        errors: [err.message || String(err)],
        alternatives: 0,
        score: 0,
        criticalFindings: 0,
      });
    }
  }

  // Print summary table
  console.log(
    "| Example Directory            | Valid Schema | Alts | Health Score | Criticals | Status |"
  );
  console.log(
    "|------------------------------|--------------|------|--------------|-----------|--------|"
  );

  for (const r of results) {
    const validStr = r.valid ? "✅ YES" : "❌ NO";
    const statusStr = r.valid && r.criticalFindings === 0 ? "✅ PASS" : "❌ FAIL";
    const scoreStr = `${r.score} / 100`.padStart(8);
    console.log(
      `| ${r.name.padEnd(28)} | ${validStr.padEnd(12)} | ${String(r.alternatives).padEnd(4)} | ${scoreStr}     | ${String(r.criticalFindings).padEnd(9)} | ${statusStr.padEnd(6)} |`
    );
    if (r.errors.length > 0) {
      for (const err of r.errors) {
        console.log(`    ↳ Error: ${err}`);
      }
    }
  }

  console.log("\n-------------------------------------------------------------------------------");
  if (allPassed) {
    console.log("✅ All golden reference examples successfully validated and evaluated!\n");
    process.exit(0);
  } else {
    console.error("❌ Some examples failed schema validation or evaluation.\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled exception validating examples:", err);
  process.exit(1);
});
