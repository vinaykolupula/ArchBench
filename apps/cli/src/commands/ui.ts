import { startServer } from "@archbench/web";
import pc from "picocolors";

export interface UiOptions {
  port?: string;
  open?: boolean;
}

export async function uiCommand(file?: string, options: UiOptions = {}): Promise<void> {
  const port = parseInt(options.port || "3000", 10);
  const openBrowser = options.open !== false;

  console.log(pc.bold(pc.cyan("\n=======================================================")));
  console.log(pc.bold(pc.cyan("           ArchBench Interactive Web Studio            ")));
  console.log(pc.bold(pc.cyan("=======================================================\n")));

  try {
    const { url } = await startServer({
      port,
      openBrowser,
      initialSpec: file,
    });
    console.log(pc.green(`✔ Studio launched successfully at ${pc.bold(url)}`));
    console.log(pc.dim("Press Ctrl+C to stop the local studio server.\n"));
  } catch (err: any) {
    console.error(pc.red(`Failed to start ArchBench Studio: ${err.message}`));
    process.exit(1);
  }
}

