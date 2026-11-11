import pc from "picocolors";
import {
  getLearningCard,
  listLearningConcepts,
  formatLearningCard,
  ExplanationMode,
} from "@archbench/core";

export interface ExplainCliOptions {
  mode?: ExplanationMode;
}

// Map known rule IDs to concept query keywords
const RULE_ID_TO_CONCEPT: Record<string, string> = {
  "REQ-COV-001": "traceability",
  "REQ-COV-002": "slo",
  "STRUC-001": "sync-chains",
  "STRUC-002": "data-ownership",
  "SCAL-001": "backpressure",
  "REL-001": "bounded-retries",
  "REL-002": "idempotency",
  "REL-003": "dlq",
  "REL-004": "spof",
  "DATA-001": "outbox",
};

export async function explainCommand(topic?: string, options: ExplainCliOptions = {}) {
  const mode = options.mode || "guided";

  if (!topic) {
    console.log(pc.bold(`\nArchBench Academy & Learning Mode: Architectural Concepts Catalog\n`));
    const catalog = listLearningConcepts();
    for (const card of catalog) {
      console.log(`  • ${pc.bold(card.concept)}: ${pc.dim(card.title)}`);
      console.log(`    ${pc.dim(card.summary)}`);
      console.log(`    ${pc.cyan(`archbench explain ${card.id}`)}\n`);
    }
    console.log(pc.dim(`Tip: Try --mode interview for Staff+ interview hooks & trade-off matrices.\n`));
    return;
  }

  // Check if topic is a fitness test rule ID (e.g. REL-002) or resolve directly
  const lookupQuery = RULE_ID_TO_CONCEPT[topic.toUpperCase()] || topic;
  const card = getLearningCard(lookupQuery) || getLearningCard(topic);

  if (!card) {
    console.error(pc.red(`✖ No architectural concept found matching "${topic}".`));
    console.log(`Run ${pc.bold("archbench explain")} without arguments to list all available topics.`);
    process.exitCode = 1;
    return;
  }

  const formatted = formatLearningCard(card, mode);
  console.log(`\n${formatted}\n`);
}

