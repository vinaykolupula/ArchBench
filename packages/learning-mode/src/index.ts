import { LearningCard, ExplanationMode } from "./types.js";
import { LEARNING_CATALOG } from "./catalog.js";

export * from "./types.js";
export * from "./catalog.js";

export function listLearningConcepts(): LearningCard[] {
  return [...LEARNING_CATALOG];
}

export function getLearningCard(query: string): LearningCard | undefined {
  const q = query.toLowerCase().trim();

  // Try exact ID match
  const byId = LEARNING_CATALOG.find((c) => c.id.toLowerCase() === q);
  if (byId) return byId;

  // Try rule ID match
  const byRule = LEARNING_CATALOG.find((c) =>
    c.ruleIds?.some((r) => r.toLowerCase() === q)
  );
  if (byRule) return byRule;

  // Try substring match on concept or title
  return LEARNING_CATALOG.find(
    (c) =>
      c.concept.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
  );
}

export function formatLearningCard(
  card: LearningCard,
  mode: ExplanationMode = "guided"
): string {
  if (mode === "quick") {
    return `### ${card.concept}: ${card.title}\n${card.summary}\n\n**Actionable Advice:** ${card.mitigationOptions[0] || "Review architecture model."}`;
  }

  const lines: string[] = [];
  lines.push(`# Architecture Learning Card: ${card.concept}`);
  lines.push(`**Topic:** ${card.title}\n`);
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

