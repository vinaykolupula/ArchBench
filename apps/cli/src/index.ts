#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { validateCommand } from "./commands/validate.js";
import { diagramCommand } from "./commands/diagram.js";
import { evaluateCommand } from "./commands/evaluate.js";
import { scenarioCommand } from "./commands/scenario.js";
import { compareCommand } from "./commands/compare.js";
import { explainCommand } from "./commands/explain.js";
import { reportCommand } from "./commands/report.js";
import { listTestsCommand } from "./commands/tests.js";
import { listScenariosCommand } from "./commands/scenarios.js";
import { uiCommand } from "./commands/ui.js";

const program = new Command();

program
  .name("archbench")
  .description("ArchBench: System Design Reasoning, Architecture Evaluation, and Failure-Driven Validation")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a starter ArchSpec architecture specification file")
  .argument("[project-name]", "Name of the project")
  .option("-o, --output <file>", "Output file path", "archspec.yaml")
  .action(initCommand);

program
  .command("validate")
  .description("Validate an ArchSpec architecture specification against schema and structural integrity")
  .argument("<file>", "Path to ArchSpec YAML or JSON file")
  .option("--json", "Emit results in JSON format for CI/CD")
  .action(validateCommand);

program
  .command("evaluate")
  .description("Evaluate an ArchSpec architecture specification against fitness tests and JustEnough principles")
  .argument("<file>", "Path to ArchSpec YAML or JSON file")
  .option("-a, --alternative <id>", "Specific architecture alternative ID to evaluate")
  .option("-c, --category <categories>", "Comma-separated list of fitness test categories to run")
  .option("-f, --format <format>", "Output format: markdown, json, or summary", "markdown")
  .option("-o, --output <file>", "Write report to file instead of stdout")
  .option("--fail-on <severity>", "Severity threshold to fail CI exit code: critical or warning", "critical")
  .action(evaluateCommand);

program
  .command("compare")
  .description("Compare multiple candidate architecture alternatives and evaluate trade-offs")
  .argument("<file>", "Path to ArchSpec YAML or JSON file")
  .option("-f, --format <format>", "Output format: markdown or json", "markdown")
  .option("-o, --output <file>", "Write report to file instead of stdout")
  .action(compareCommand);

program
  .command("explain")
  .description("Explain an architectural concept or finding rule ID in Learning Mode")
  .argument("[concept-or-id]", "Architectural concept or rule ID (e.g. outbox, REL-002, backpressure)")
  .option("-m, --mode <mode>", "Explanation mode: guided (deep) or quick (concise)", "guided")
  .action(explainCommand);

const scenarioCmd = program
  .command("scenario")
  .description("Challenge architecture specifications with declarative failure scenarios");

scenarioCmd
  .command("run")
  .description("Run failure scenarios against an architecture specification")
  .argument("<file>", "Path to ArchSpec YAML or JSON file")
  .option("-p, --pack <pack>", "Scenario pack to execute (e.g. core-failures)", "core-failures")
  .option("-s, --scenario <file>", "Specific scenario YAML file to execute")
  .option("-a, --alternative <id>", "Specific architecture alternative ID")
  .option("--json", "Emit results in JSON format")
  .action((file, opts) => scenarioCommand(file, opts));

program
  .command("diagram")
  .description("Generate an architecture diagram (Mermaid) from an ArchSpec specification")
  .argument("<file>", "Path to ArchSpec YAML or JSON file")
  .option("-a, --alternative <id>", "Specific architecture alternative ID to diagram")
  .option("-f, --format <format>", "Diagram format (mermaid)", "mermaid")
  .option("-d, --direction <direction>", "Graph direction: TD (top-down) or LR (left-to-right)", "TD")
  .option("-o, --output <file>", "Write diagram to file instead of stdout")
  .action(diagramCommand);

program
  .command("report")
  .description("Generate an architecture evaluation report in Markdown or JSON")
  .argument("<file>", "Path to ArchSpec YAML or JSON file")
  .option("-a, --alternative <id>", "Specific architecture alternative ID")
  .option("-c, --category <categories>", "Comma-separated list of fitness test categories to run")
  .option("-f, --format <format>", "Output format: markdown or json", "markdown")
  .option("-o, --output <file>", "Write report to file instead of stdout")
  .action(reportCommand);

program
  .command("ui")
  .description("Launch the interactive ArchBench Web Studio in your browser")
  .argument("[file]", "Optional initial ArchSpec file to view")
  .option("-p, --port <port>", "Port number to listen on", "3000")
  .option("--no-open", "Do not automatically open the browser")
  .action(uiCommand);

const testsCmd = program
  .command("tests")
  .description("Inspect registered architecture fitness tests");

testsCmd
  .command("list")
  .description("List all available architecture fitness tests")
  .option("-c, --category <category>", "Filter by category")
  .action(listTestsCommand);

const scenariosCmd = program
  .command("scenarios")
  .description("Discover and inspect failure scenario packs");

scenariosCmd
  .command("list")
  .description("List all available failure and workload scenario packs")
  .action(listScenariosCommand);

program.parse();

