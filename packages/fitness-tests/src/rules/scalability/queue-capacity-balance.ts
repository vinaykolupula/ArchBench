import { FitnessTest, ArchitectureFinding } from "../../types.js";

export const queueCapacityBalanceTest: FitnessTest = {
  id: "SCAL-001",
  version: "1.0",
  title: "Queue Overload & Capacity Balance",
  category: "scalability",
  description: "Validates that message queues and event streams declare explicit overload and backpressure policies.",
  evaluate(context): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];
    const { alternative, graph } = context;

    for (const comp of alternative.components) {
      if (comp.type === "message_queue" || comp.type === "event_stream") {
        const overloadPolicy = comp.messaging?.overload_policy;

        // Check if overload policy is declared
        if (!overloadPolicy) {
          findings.push({
            id: `finding-${comp.id}-missing-overload-policy`,
            testId: "SCAL-001",
            category: "scalability",
            status: "warning",
            severity: "warning",
            title: `Queue "${comp.id}" has no declared overload policy`,
            summary: `Component "${comp.id}" (${comp.type}) buffers asynchronous traffic but specifies no 'messaging.overload_policy'. Under sustained producer spikes or worker degradation, unconstrained backlog growth leads to memory exhaustion or cascading recovery delays.`,
            evidence: [
              {
                type: "component",
                id: comp.id,
                details: "Missing messaging.overload_policy",
              },
            ],
            affectedComponents: [comp.id],
            suggestedActions: [
              `Declare an explicit overload policy (e.g., messaging: { overload_policy: "bounded_backlog_with_cloudwatch_alarm" }).`,
              `Define rate limiting or load shedding upstream if queue capacity is reached.`,
            ],
            learningConcept: "Backpressure & Queue Management",
          });
        }

        // Check consumer worker connection (unless it is explicitly a dead-letter quarantine queue)
        const isDlq =
          comp.id.toLowerCase().includes("dlq") ||
          comp.id.toLowerCase().includes("dead-letter") ||
          comp.id.toLowerCase().includes("dead_letter") ||
          comp.responsibility.toLowerCase().includes("dead letter");

        const outgoingEdges = graph.getAllEdges().filter((e) => e.from === comp.id);
        const consumers = outgoingEdges.map((e) => graph.getNode(e.to)).filter(Boolean);

        if (consumers.length === 0 && !isDlq) {
          findings.push({
            id: `finding-${comp.id}-no-consumers`,
            testId: "SCAL-001",
            category: "scalability",
            status: "fail",
            severity: "error",
            title: `Queue "${comp.id}" has no downstream consumers`,
            summary: `Queue "${comp.id}" receives or buffers messages but has no outgoing connection to any worker or processor. Messages will accumulate indefinitely.`,
            evidence: [
              {
                type: "component",
                id: comp.id,
                details: "No outgoing edges detected from queue.",
              },
            ],
            affectedComponents: [comp.id],
            suggestedActions: [
              `Connect a background worker or consumer service to "${comp.id}".`,
            ],
            learningConcept: "Producer-Consumer Asymmetry",
          });
        }
      }
    }

    return findings;
  },
};

