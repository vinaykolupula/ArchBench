import { FitnessTest, ArchitectureFinding } from "../../types.js";

export const deadLetterQueueTest: FitnessTest = {
  id: "REL-003",
  version: "1.0",
  title: "Dead Letter Queue for Exhausted Failures",
  category: "reliability",
  description: "Ensures background workers processing retried workloads declare a dead-letter queue (DLQ) for poisoned or permanently failing messages.",
  evaluate(context): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];
    const { alternative } = context;

    for (const comp of alternative.components) {
      if (comp.type === "background_worker" || comp.type === "service") {
        const retry = comp.behavior?.retry_policy;
        if (retry && !retry.dead_letter_target) {
          findings.push({
            id: `finding-${comp.id}-missing-dlq`,
            testId: "REL-003",
            category: "reliability",
            status: "warning",
            severity: "warning",
            title: `Worker "${comp.id}" lacks a dead-letter target for exhausted retries`,
            summary: `Worker "${comp.id}" retries failed jobs up to ${retry.max_attempts} times, but specifies no 'dead_letter_target'. When a poison message permanently fails, it may either be silently dropped or block consumer processing.`,
            evidence: [
              {
                type: "component",
                id: comp.id,
                details: "retry_policy.dead_letter_target is omitted",
              },
            ],
            affectedComponents: [comp.id],
            suggestedActions: [
              `Configure a dead-letter queue (e.g., dead_letter_target: "${comp.id}-dlq") to quarantine exhausted messages for operator inspection.`,
            ],
            learningConcept: "Dead-Letter Queues & Poison Message Handling",
          });
        }
      }
    }

    return findings;
  },
};

