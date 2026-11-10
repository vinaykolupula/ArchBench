import pc from "picocolors";
import { BUILTIN_FITNESS_TESTS, FitnessTest } from "@archbench/core";

export function listTestsCommand(options: { category?: string } = {}) {
  console.log(pc.bold("\nArchBench Registered Architecture Fitness Tests\n"));

  let tests: FitnessTest[] = BUILTIN_FITNESS_TESTS;
  if (options.category) {
    const filterCat = options.category.toLowerCase().trim();
    tests = tests.filter((t: FitnessTest) => t.category.toLowerCase() === filterCat);
  }

  console.log(
    "| " +
      pc.bold("Rule ID".padEnd(14)) +
      " | " +
      pc.bold("Category".padEnd(22)) +
      " | " +
      pc.bold("Title".padEnd(45)) +
      " |"
  );
  console.log(
    "|:" +
      "-".repeat(14) +
      ":|:" +
      "-".repeat(22) +
      ":|:" +
      "-".repeat(45) +
      ":|"
  );

  for (const t of tests) {
    console.log(
      `| ${pc.cyan(t.id.padEnd(14))} | ${pc.yellow(t.category.padEnd(22))} | ${t.title.padEnd(45)} |`
    );
  }

  console.log(pc.dim(`\nTotal registered fitness tests: ${tests.length}\n`));
}
