import { AlternativeComparisonResult } from "./types.js";

export function generateComparisonJson(comparison: AlternativeComparisonResult): string {
  return JSON.stringify(comparison, null, 2);
}

