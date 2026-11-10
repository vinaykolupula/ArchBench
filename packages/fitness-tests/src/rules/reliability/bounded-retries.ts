import { FitnessTest, ArchitectureFinding } from "../../types.js";

export const boundedRetriesTest: FitnessTest = {
  id: "REL-001",
  version: "1.0",
  title: "Bounded Retries and Retry Storm Prevention",
  category: "reliability",
  description: "Ensures all retry policies specify bounded maximum attempts and backoff to prevent cascading retry storms.",
  evaluate(context): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];
    const { alternative } = context;

    // 1. Check Component-level retry policies
    for (const comp of alternative.components) {
      const retry = comp.behavior?.retry_policy;
      if (retry) {
        if (!retry.max_attempts || retry.max_attempts < 1) {
          findings.push({
            id: `finding-${comp.id}-unbounded-retries`,
            testId: "REL-001",
            category: "reliability",
            status: "fail",
            severity: "critical",
            title: `Component "${comp.id}" has unbounded retry policy`,
            summary: `Component "${comp.id}" has a retry policy without a positive 'max_attempts' limit. Unbounded retries against failing dependencies amplify traffic into catastrophic retry storms.`,
            evidence: [
              {
                type: "component",
                id: comp.id,
                details: `max_attempts: ${retry.max_attempts}`,
              },
            ],
            affectedComponents: [comp.id],
            suggestedActions: [
              `Set a bounded max_attempts (recommended: 3 to 5).`,
              `Ensure exponential backoff with jitter is configured.`,
            ],
            learningConcept: "Retry Storms & Cascading Failures",
          });
        } else if (retry.max_attempts > 10) {
          findings.push({
            id: `finding-${comp.id}-excessive-retries`,
            testId: "REL-001",
            category: "reliability",
            status: "warning",
            severity: "warning",
            title: `Component "${comp.id}" specifies high retry attempts (${retry.max_attempts})`,
            summary: `Retrying up to ${retry.max_attempts} times can severely increase message processing latency and downstream load during partial outages.`,
            evidence: [
              {
                type: "component",
                id: comp.id,
                details: `max_attempts: ${retry.max_attempts}`,
              },
            ],
            affectedComponents: [comp.id],
            suggestedActions: [
              `Reduce max_attempts to <= 5 and route persistently failing messages to a dead-letter queue.`,
            ],
            learningConcept: "Graceful Degradation",
          });
        }
      }
    }

    // 2. Check Connection-level retry policies
    for (const conn of alternative.connections) {
      const retry = conn.retry_policy;
      if (retry) {
        if (!retry.max_attempts || retry.max_attempts < 1) {
          findings.push({
            id: `finding-${conn.id}-unbounded-connection-retries`,
            testId: "REL-001",
            category: "reliability",
            status: "fail",
            severity: "critical",
            title: `Connection "${conn.id}" has unbounded retry policy`,
            summary: `Connection "${conn.id}" (${conn.from} -> ${conn.to}) specifies retries without a bounded 'max_attempts' limit.`,
            evidence: [
              {
                type: "connection",
                id: conn.id,
                details: `from: ${conn.from}, to: ${conn.to}`,
              },
            ],
            suggestedActions: [
              `Specify max_attempts: 3 with exponential backoff on connection "${conn.id}".`,
            ],
            learningConcept: "Retry Storms & Cascading Failures",
          });
        }
      }
    }

    return findings;
  },
};

