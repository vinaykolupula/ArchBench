import { AlternativeComparisonResult } from "./types.js";

export function generateComparisonMarkdown(comparison: AlternativeComparisonResult): string {
  const lines: string[] = [];

  lines.push(`# Architecture Alternative Comparison: \`${comparison.project}\``);
  lines.push(`**Evaluated Alternatives:** ${comparison.alternativesCompared.map((a) => `\`${a.id}\``).join(", ")}\n`);

  // Comparison Matrix Table
  const altIds = comparison.alternativesCompared.map((a) => a.id);
  const altNames = comparison.alternativesCompared.map((a) => `${a.name} (\`${a.id}\`)`);

  lines.push(`## 1. Trade-Off Comparison Matrix`);
  lines.push(`| Evaluation Dimension | ${altNames.join(" | ")} | Trade-off / Decision Impact |`);
  lines.push(`|---|${altNames.map(() => "---").join("|")}|---|`);

  for (const dim of comparison.dimensions) {
    const valCells = altIds.map((id) => {
      const val = dim.values[id] !== undefined ? String(dim.values[id]) : "Unknown";
      const isAdvantage = dim.advantageAlternativeId === id;
      return isAdvantage ? `**${val}** 🏆` : val;
    });

    lines.push(`| **${dim.name}** | ${valCells.join(" | ")} | ${dim.tradeOffNote} |`);
  }
  lines.push(``);

  // Conditional Recommendation Section
  lines.push(`## 2. Conditional Recommendation`);
  lines.push(`> ${comparison.conditionalRecommendation}\n`);

  if (comparison.uncertaintyNotes.length > 0) {
    lines.push(`## 3. Important Uncertainty & Unknowns`);
    for (const note of comparison.uncertaintyNotes) {
      lines.push(`- ⚠️ ${note}`);
    }
    lines.push(``);
  }

  lines.push(`---\n*Comparison generated deterministically by ArchBench.*`);
  return lines.join("\n");
}

