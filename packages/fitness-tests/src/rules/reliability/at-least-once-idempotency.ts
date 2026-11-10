import { FitnessTest, ArchitectureFinding } from "../../types.js";

export const atLeastOnceIdempotencyTest: FitnessTest = {
  id: "REL-002",
  version: "1.0",
  title: "At-Least-Once Delivery Consumer Idempotency",
  category: "reliability",
  description: "Ensures consumers handling at-least-once message queues enforce idempotency to prevent duplicate side effects.",
  evaluate(context): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];
    const { alternative, graph } = context;

    for (const comp of alternative.components) {
      if (comp.type === "message_queue" || comp.type === "event_stream") {
        const semantics = comp.messaging?.delivery_semantics ?? "at_least_once";

        if (semantics === "at_least_once") {
          // Find consumer workers
          const outgoingEdges = graph.getAllEdges().filter((e) => e.from === comp.id);
          for (const edge of outgoingEdges) {
            const consumerNode = graph.getNode(edge.to);
            const consumerComp = consumerNode?.rawComponent;

            if (consumerComp && (consumerComp.type === "background_worker" || consumerComp.type === "service")) {
              const isIdempotent = consumerComp.behavior?.idempotent === true;
              const hasKey = Boolean(consumerComp.behavior?.idempotency_key);

              if (!isIdempotent) {
                findings.push({
                  id: `finding-${consumerComp.id}-not-idempotent`,
                  testId: "REL-002",
                  category: "reliability",
                  status: "fail",
                  severity: "critical",
                  title: `Consumer "${consumerComp.id}" is not idempotent under at-least-once delivery`,
                  summary: `Queue "${comp.id}" provides at-least-once delivery semantics, which guarantees message delivery but permits duplicate redeliveries during worker timeouts or network retries. Consumer "${consumerComp.id}" does not declare 'behavior.idempotent: true'. Duplicate deliveries will cause duplicate writes, double charges, or inconsistent state.`,
                  evidence: [
                    {
                      type: "component",
                      id: consumerComp.id,
                      details: `Consumer of queue "${comp.id}"`,
                    },
                  ],
                  affectedComponents: [consumerComp.id, comp.id],
                  suggestedActions: [
                    `Declare 'behavior.idempotent: true' and configure a deduplication or idempotency key in the consumer.`,
                    `Implement idempotency using a unique business transaction identifier (e.g., notification_id, order_id) checked against an atomic state store.`,
                  ],
                  learningConcept: "At-Least-Once Delivery & Idempotency",
                });
              } else if (!hasKey) {
                findings.push({
                  id: `finding-${consumerComp.id}-missing-idempotency-key`,
                  testId: "REL-002",
                  category: "reliability",
                  status: "warning",
                  severity: "warning",
                  title: `Consumer "${consumerComp.id}" declares idempotency but omits idempotency_key`,
                  summary: `Consumer "${consumerComp.id}" is marked idempotent, but does not declare 'behavior.idempotency_key'. Specifying the deduplication scope prevents ambiguity during implementation.`,
                  evidence: [
                    {
                      type: "component",
                      id: consumerComp.id,
                      details: "Missing behavior.idempotency_key field",
                    },
                  ],
                  affectedComponents: [consumerComp.id],
                  suggestedActions: [
                    `Add 'behavior.idempotency_key: "message_id"' or business domain key to component "${consumerComp.id}".`,
                  ],
                  learningConcept: "Idempotency Key Scope",
                });
              }
            }
          }
        }
      }
    }

    return findings;
  },
};

