import { EvaluationResult, AlternativeEvaluation } from "@archbench/archeval";
import { ArchitectureGraph } from "@archbench/graph-engine";

export interface MarkdownReportOptions {
  graphs?: Map<string, ArchitectureGraph>;
}

export function generateMarkdownReport(
  result: EvaluationResult,
  options: MarkdownReportOptions = {}
): string {
  const lines: string[] = [];
  const statusBadge = result.passed ? "🟢 PASS" : "🔴 FAIL (Policy Violations Detected)";

  lines.push(`# ArchBench Architecture Evaluation Report`);
  lines.push(`**Project:** \`${result.metadata.project}\` | **Spec Version:** \`${result.metadata.specVersion}\` | **Profile:** \`${result.metadata.profile}\``);
  lines.push(`**Evaluated At:** ${result.metadata.evaluatedAt} | **Status:** ${statusBadge}\n`);

  for (const altId of Object.keys(result.alternatives)) {
    const alt = result.alternatives[altId];
    renderAlternativeSection(lines, alt, options.graphs?.get(altId));
  }

  lines.push(`---\n*Report generated deterministically by ArchBench.*`);
  return lines.join("\n");
}

function renderAlternativeSection(
  lines: string[],
  alt: AlternativeEvaluation,
  graph?: ArchitectureGraph
): void {
  lines.push(`## Alternative: ${alt.alternativeName} (\`${alt.alternativeId}\`)`);
  lines.push(`**Outcome:** ${alt.passed ? "🟢 PASSED" : "🔴 ACTION REQUIRED"}\n`);

  // Summary Metrics Table
  lines.push(`### 1. Executive Summary`);
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| **Architecture Health Score** | **${alt.summary.score} / 100** |`);
  lines.push(`| **Total Findings** | ${alt.summary.totalFindings} |`);
  lines.push(`| **Critical Risks** | ${alt.summary.criticalCount} |`);
  lines.push(`| **Errors** | ${alt.summary.errorCount} |`);
  lines.push(`| **Warnings** | ${alt.summary.warningCount} |`);
  lines.push(`| **Unknowns** | ${alt.summary.unknownCount} |`);
  lines.push(`| **Requirement Coverage** | ${alt.summary.requirementCoverage.mapped} / ${alt.summary.requirementCoverage.total} mapped (${alt.summary.requirementCoverage.percentage}%) |`);
  lines.push(``);

  // Complexity Vector Table
  lines.push(`### 2. JustEnough Architecture: Complexity Dimensions`);
  const cv = alt.justEnough.complexityVector;
  lines.push(`| Dimension | Value | Notes |`);
  lines.push(`|---|---|---|`);
  lines.push(`| Components Count | ${cv.componentCount} | Total discrete building blocks |`);
  lines.push(`| Deployable Units | ${cv.deployableCount} | Independently deployed applications/services/workers |`);
  lines.push(`| Network Boundaries | ${cv.networkBoundaryCount} | Inter-component remote communication edges |`);
  lines.push(`| Stateful Stores | ${cv.statefulStoreCount} | Databases, caches, queues, object stores |`);
  lines.push(`| External Dependencies | ${cv.externalDependencyCount} | External third-party APIs/providers |`);
  lines.push(``);

  // Component Justification Table
  lines.push(`#### Component Justification Review`);
  lines.push(`| Component | Type | Justification Status | Rationale |`);
  lines.push(`|---|---|---|---|`);
  for (const c of alt.justEnough.componentJustifications) {
    const statusIcon =
      c.status === "justified"
        ? "✅ Justified"
        : c.status === "conditionally_justified"
        ? "⚠️ Conditional"
        : c.status === "premature"
        ? "🛑 Premature"
        : "❓ Unclear";
    lines.push(`| \`${c.componentId}\` | \`${c.componentType}\` | ${statusIcon} | ${c.reason} |`);
  }
  lines.push(``);

  // Evolution Triggers Table
  if (alt.justEnough.evolutionTriggers.length > 0) {
    lines.push(`#### Evolution Triggers`);
    lines.push(`| Trigger ID | Monitored Metric | Scaling Threshold | Architecture Evolution Action |`);
    lines.push(`|---|---|---|---|`);
    for (const t of alt.justEnough.evolutionTriggers) {
      lines.push(`| \`${t.id}\` | \`${t.metric}\` | \`${t.threshold}\` | ${t.action} |`);
    }
    lines.push(``);
  }

  // Findings Details
  lines.push(`### 3. Architecture Findings & Evidence`);
  if (alt.findings.length === 0) {
    lines.push(`*No architectural risks, defects, or missing justifications detected.*\n`);
  } else {
    for (const f of alt.findings) {
      const severityBadge =
        f.severity === "critical"
          ? "🔴 **CRITICAL**"
          : f.severity === "error"
          ? "🛑 **ERROR**"
          : f.severity === "warning"
          ? "⚠️ **WARNING**"
          : "ℹ️ **INFO**";

      lines.push(`#### ${severityBadge} ${f.title}`);
      lines.push(`- **Rule ID:** \`${f.testId}\` | **Category:** \`${f.category}\``);
      lines.push(`- **Summary:** ${f.summary}`);
      if (f.learningConcept) {
        lines.push(`- **Core Concept:** *${f.learningConcept}*`);
      }
      if (f.evidence && f.evidence.length > 0) {
        lines.push(`- **Supporting Evidence:**`);
        for (const ev of f.evidence) {
          lines.push(`  - \`${ev.type}\` (\`${ev.id}\`): ${ev.details || "Observed in model"}`);
        }
      }
      if (f.suggestedActions && f.suggestedActions.length > 0) {
        lines.push(`- **Recommended Action:**`);
        for (const act of f.suggestedActions) {
          lines.push(`  - ${act}`);
        }
      }
      lines.push(``);
    }
  }

  // Optional Mermaid Diagram
  if (graph) {
    lines.push(`### 4. Architecture Diagram`);
    lines.push("```mermaid");
    lines.push(graph.toMermaid({ direction: "TD" }));
    lines.push("```\n");
  }
}

