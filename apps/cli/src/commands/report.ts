import { evaluateCommand } from "./evaluate.js";

export interface ReportCliOptions {
  alternative?: string;
  category?: string;
  format?: string;
  output?: string;
}

export async function reportCommand(filePath: string, options: ReportCliOptions = {}) {
  await evaluateCommand(filePath, {
    alternative: options.alternative,
    category: options.category,
    format: options.format || "markdown",
    output: options.output,
  });
}

