import * as fs from "node:fs/promises";
import * as path from "node:path";
import pc from "picocolors";
import { loadArchSpecFile } from "@archbench/core";

export interface DiagramOptions {
  alternative?: string;
  format?: string;
  direction?: "TD" | "LR";
  output?: string;
}

export async function diagramCommand(filePath: string, options: DiagramOptions = {}) {
  const baseDir = process.env.INIT_CWD || process.cwd();
  const resolvedPath = path.resolve(baseDir, filePath);

  try {
    const loaded = await loadArchSpecFile(resolvedPath);
    const { graphs, validation, spec } = loaded;

    if (!validation.valid) {
      console.error(pc.red(`✖ Cannot generate diagram. Specification has validation errors:`));
      for (const err of validation.errors) {
        console.error(pc.red(`  • ${err.message}`));
      }
      process.exitCode = 1;
      return;
    }

    const availableAlts = Array.from(graphs.keys());
    if (availableAlts.length === 0) {
      console.error(pc.red(`✖ No architecture alternatives defined in specification.`));
      process.exitCode = 1;
      return;
    }

    const targetAltId = options.alternative || availableAlts[0];
    const graph = graphs.get(targetAltId);

    if (!graph) {
      console.error(
        pc.red(`✖ Alternative "${targetAltId}" not found. Available: ${availableAlts.join(", ")}`)
      );
      process.exitCode = 1;
      return;
    }

    const format = (options.format || "mermaid").toLowerCase();
    if (format !== "mermaid") {
      console.error(pc.red(`✖ Unsupported diagram format "${format}". Only "mermaid" is currently supported.`));
      process.exitCode = 1;
      return;
    }

    const mermaid = graph.toMermaid({ direction: options.direction ?? "TD" });

    if (options.output) {
      const outputPath = path.resolve(process.cwd(), options.output);
      await fs.writeFile(outputPath, mermaid, "utf-8");
      console.log(pc.green(`✔ Exported Mermaid diagram to ${outputPath}`));
    } else {
      console.log(pc.dim(`\n%% ArchBench Diagram: ${spec.archbench.project} [${targetAltId}] %%`));
      console.log(mermaid);
      console.log("");
    }
  } catch (error: any) {
    console.error(pc.red(`✖ Error generating diagram: ${error.message}`));
    process.exitCode = 1;
  }
}
