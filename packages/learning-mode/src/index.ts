import { LEARNING_CATALOG } from "./catalog.js";
import {
  ALL_LESSONS,
  getLessonById,
  lessonToLearningCard,
} from "./curriculum/index.js";
import { ExplanationMode, LearningCard } from "./types.js";

export * from "./types.js";
export { LEARNING_CATALOG } from "./catalog.js";
export * from "./simulators/index.js";
export * from "./curriculum/index.js";

/**
 * List all available learning concepts across core remediation cards and the
 * full System Design Academy curriculum.
 */
export function listLearningConcepts(): LearningCard[] {
  const catalogIds = new Set(LEARNING_CATALOG.map((c) => c.id.toLowerCase()));
  const lessonCards = ALL_LESSONS.map(lessonToLearningCard).filter((card) => {
    const normalizedId = card.id.replace(/^(lesson|concept)-/, "").toLowerCase();
    return !catalogIds.has(normalizedId) && !catalogIds.has(card.id.toLowerCase());
  });
  return [...LEARNING_CATALOG, ...lessonCards];
}

/**
 * Resolve a concept, lesson ID, ArchEval Rule ID (e.g. DATA-001), or topic
 * keyword into a normalized LearningCard for CLI, MCP, and UI consumers.
 */
export function getLearningCard(query: string): LearningCard | undefined {
  const q = query.toLowerCase().trim();
  if (!q) return undefined;

  // 1. Exact ID match in canonical catalog
  const byId = LEARNING_CATALOG.find((c) => c.id.toLowerCase() === q);
  if (byId) return byId;

  // 2. Exact rule ID match in canonical catalog
  const byRule = LEARNING_CATALOG.find((c) =>
    c.ruleIds?.some((r) => r.toLowerCase() === q)
  );
  if (byRule) return byRule;

  // 3. Substring match on concept, title, or id in canonical catalog
  const bySubstring = LEARNING_CATALOG.find(
    (c) =>
      c.concept.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
  );
  if (bySubstring) return bySubstring;

  // 4. Expanded System Design Academy curriculum lookup
  const lesson = getLessonById(query);
  if (lesson) {
    return lessonToLearningCard(lesson);
  }

  return undefined;
}

/**
 * Render a LearningCard in guided, quick, or Staff+ interview mode.
 */
export function formatLearningCard(
  card: LearningCard,
  mode: ExplanationMode = "guided"
): string {
  if (mode === "quick") {
    const analogyLine = card.plainEnglishAnalogy
      ? `\n\n**Everyday Analogy:** ${card.plainEnglishAnalogy}`
      : "";
    return `### ${card.concept}: ${card.title}${analogyLine}\n${card.summary}\n\n**Actionable Advice:** ${card.mitigationOptions[0] || "Review architecture model."}`;
  }

  if (mode === "interview") {
    const lesson = getLessonById(card.id) || getLessonById(card.concept);
    const lines: string[] = [];
    lines.push(`# [Interview Mode] ${card.title}`);
    lines.push(`**Concept:** ${card.concept}\n`);
    if (card.plainEnglishAnalogy) {
      lines.push(`## Plain-English Mental Model`);
      lines.push(`${card.plainEnglishAnalogy}\n`);
    }
    lines.push(`## Summary`);
    lines.push(`${card.summary}\n`);
    lines.push(`## Why Interviewers Test This`);
    lines.push(`${card.whyItMatters}\n`);
    lines.push(`## Classic Failure Trap`);
    lines.push(`> ${card.concreteFailureExample}\n`);
    if (lesson?.seniorInterviewHooks?.length) {
      lines.push(`## Senior / Staff Interview Hooks`);
      for (const h of lesson.seniorInterviewHooks) {
        lines.push(`- **Signal:** ${h.hook}`);
        lines.push(`  - *Failure Prevented:* ${h.failurePrevented}`);
        lines.push(`  - *Red Flag to Avoid:* ${h.redFlagToAvoid}`);
      }
      lines.push(``);
    }
    if (lesson?.tradeOffs?.length) {
      lines.push(`## Trade-Offs`);
      for (const t of lesson.tradeOffs) {
        lines.push(`- **${t.approach}** (Best for ${t.bestFor}): + ${t.pros[0] ?? ""} | - ${t.cons[0] ?? ""}`);
      }
      lines.push(``);
    }
    if (card.ruleIds?.length) {
      lines.push(`Triggered Rules: ${card.ruleIds.join(", ")}`);
    }
    return lines.join("\n");
  }

  const lines: string[] = [];
  lines.push(`# Architecture Learning Card: ${card.concept}`);
  lines.push(`**Topic:** ${card.title}\n`);
  if (card.plainEnglishAnalogy) {
    lines.push(`## Everyday Analogy (Start Simple)`);
    lines.push(`${card.plainEnglishAnalogy}\n`);
  }
  lines.push(`## 1. What It Is`);
  lines.push(`${card.summary}\n`);
  lines.push(`## 2. Why It Matters in System Design`);
  lines.push(`${card.whyItMatters}\n`);
  lines.push(`## 3. Real-World Production Failure Scenario`);
  lines.push(`> ${card.concreteFailureExample}\n`);
  lines.push(`## 4. Architectural Mitigation Strategies`);
  for (const opt of card.mitigationOptions) {
    lines.push(`- ${opt}`);
  }
  lines.push(``);
  lines.push(`## 5. Verification & Testing`);
  lines.push(`${card.verificationApproach}\n`);

  if (card.furtherReading && card.furtherReading.length > 0) {
    lines.push(`## 6. Curated References`);
    for (const ref of card.furtherReading) {
      lines.push(`- ${ref}`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}
