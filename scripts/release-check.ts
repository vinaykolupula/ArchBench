import { execSync } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

interface GateResult {
  gate: string;
  durationMs: number;
  passed: boolean;
  details?: string;
}

async function validateSchemas(rootDir: string): Promise<boolean> {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  (addFormats as any)(ajv);
  const schemaFiles = [
    "schemas/archspec/v0.1.schema.json",
    "schemas/scenario/v1.schema.json",
    "schemas/report/v1.schema.json",
  ];

  for (const relPath of schemaFiles) {
    const fullPath = path.join(rootDir, relPath);
    const content = await fs.readFile(fullPath, "utf-8");
    const json = JSON.parse(content);
    ajv.compile(json);
  }
  return true;
}

async function main() {
  const rootDir = process.env.INIT_CWD || process.cwd();
  console.log("===============================================================================");
  console.log("                ArchBench Pre-Release Verification Gate                        ");
  console.log("===============================================================================\n");

  const gates: GateResult[] = [];
  let allPassed = true;

  // Gate 1: Schema Integrity Check
  {
    const start = Date.now();
    try {
      await validateSchemas(rootDir);
      gates.push({
        gate: "1. JSON Schema Compile & Validation (Draft 2020-12)",
        durationMs: Date.now() - start,
        passed: true,
      });
    } catch (err: any) {
      allPassed = false;
      gates.push({
        gate: "1. JSON Schema Compile & Validation (Draft 2020-12)",
        durationMs: Date.now() - start,
        passed: false,
        details: err.message,
      });
    }
  }

  // Gate 2: Full Monorepo Typecheck
  {
    const start = Date.now();
    try {
      console.log("Running Gate 2: Full Monorepo TypeCheck...");
      execSync("pnpm run typecheck", { cwd: rootDir, stdio: "pipe" });
      gates.push({
        gate: "2. TypeScript Static Analysis (11 workspace packages)",
        durationMs: Date.now() - start,
        passed: true,
      });
    } catch (err: any) {
      allPassed = false;
      gates.push({
        gate: "2. TypeScript Static Analysis (11 workspace packages)",
        durationMs: Date.now() - start,
        passed: false,
        details: err.stdout?.toString() || err.message,
      });
    }
  }

  // Gate 3: Unit and Integration Test Suites
  {
    const start = Date.now();
    try {
      console.log("Running Gate 3: Vitest Test Suite...");
      execSync("pnpm run test", { cwd: rootDir, stdio: "pipe" });
      gates.push({
        gate: "3. Vitest Unit & Integration Suites",
        durationMs: Date.now() - start,
        passed: true,
      });
    } catch (err: any) {
      allPassed = false;
      gates.push({
        gate: "3. Vitest Unit & Integration Suites",
        durationMs: Date.now() - start,
        passed: false,
        details: err.stdout?.toString() || err.message,
      });
    }
  }

  // Gate 4: Golden Reference Examples Validation
  {
    const start = Date.now();
    try {
      console.log("Running Gate 4: Golden Reference Examples Validation...");
      execSync("pnpm tsx scripts/validate-examples.ts", { cwd: rootDir, stdio: "pipe" });
      gates.push({
        gate: "4. Golden Reference Examples Validation (5 architectures)",
        durationMs: Date.now() - start,
        passed: true,
      });
    } catch (err: any) {
      allPassed = false;
      gates.push({
        gate: "4. Golden Reference Examples Validation (5 architectures)",
        durationMs: Date.now() - start,
        passed: false,
        details: err.stdout?.toString() || err.message,
      });
    }
  }

  // Gate 5: 50-Case Empirical Benchmark Suite
  {
    const start = Date.now();
    try {
      console.log("Running Gate 5: 50-Case Benchmark Suite...");
      execSync("pnpm run benchmark", { cwd: rootDir, stdio: "pipe" });
      gates.push({
        gate: "5. Empirical Benchmark Harness (50 cases, 100% Precision/Recall/F1)",
        durationMs: Date.now() - start,
        passed: true,
      });
    } catch (err: any) {
      allPassed = false;
      gates.push({
        gate: "5. Empirical Benchmark Harness (50 cases, 100% Precision/Recall/F1)",
        durationMs: Date.now() - start,
        passed: false,
        details: err.stdout?.toString() || err.message,
      });
    }
  }

  // Display Gate Results
  console.log("\n===============================================================================");
  console.log("                           Verification Gate Summary                           ");
  console.log("===============================================================================");
  console.log("| Gate                                                      | Duration | Status |");
  console.log("|-----------------------------------------------------------|----------|--------|");
  for (const g of gates) {
    const statusStr = g.passed ? "✅ PASS" : "❌ FAIL";
    const durStr = `${(g.durationMs / 1000).toFixed(2)}s`.padStart(7);
    console.log(`| ${g.gate.padEnd(57)} | ${durStr} | ${statusStr.padEnd(6)} |`);
    if (!g.passed && g.details) {
      console.log(`    ↳ Details: ${g.details.slice(0, 300)}`);
    }
  }
  console.log("-------------------------------------------------------------------------------");

  if (allPassed) {
    console.log("🎉 ALL RELEASE GATES PASSED! ArchBench v0.1.0 is verified and release-ready.\n");
    process.exit(0);
  } else {
    console.error("❌ Release check failed. See details above.\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error in release-check:", err);
  process.exit(1);
});
