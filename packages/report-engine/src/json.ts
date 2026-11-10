import { EvaluationResult } from "@archbench/archeval";

export function generateJsonReport(result: EvaluationResult): string {
  return JSON.stringify(result, null, 2);
}

