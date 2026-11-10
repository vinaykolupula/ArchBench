import * as fs from "node:fs/promises";
import * as path from "node:path";
import pc from "picocolors";
import YAML from "yaml";

export async function listScenariosCommand() {
  console.log(pc.bold("\nArchBench Available Failure & Workload Scenario Packs\n"));

  const baseDir = process.env.INIT_CWD || process.cwd();
  const candidateBaseDirs = [
    path.resolve(baseDir, "packs/scenarios"),
    path.resolve(process.cwd(), "packs/scenarios"),
    path.resolve(import.meta.dirname || process.cwd(), "../../../packs/scenarios"),
  ];

  let scenariosBaseDir = "";
  for (const dir of candidateBaseDirs) {
    try {
      await fs.access(dir);
      scenariosBaseDir = dir;
      break;
    } catch {
      // continue
    }
  }

  if (!scenariosBaseDir) {
    console.error(pc.red("Error: Scenarios directory (packs/scenarios) not found."));
    return;
  }

  const packEntries = await fs.readdir(scenariosBaseDir, { withFileTypes: true });
  const packs = packEntries.filter((e) => e.isDirectory()).map((e) => e.name);

  for (const pack of packs) {
    console.log(pc.bold(pc.green(`Pack: ${pack}`)));
    const packDir = path.join(scenariosBaseDir, pack);
    const files = await fs.readdir(packDir);

    for (const file of files) {
      if (file.endsWith(".yaml") || file.endsWith(".yml")) {
        try {
          const content = await fs.readFile(path.join(packDir, file), "utf-8");
          const parsed = YAML.parse(content);
          if (parsed?.id) {
            console.log(
              `  • ${pc.cyan(parsed.id)} (${pc.yellow(parsed.level || "analytical")}): ${parsed.name || parsed.id}`
            );
            if (parsed.description) {
              console.log(pc.dim(`    ${parsed.description}`));
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    }
    console.log("");
  }
}
