import { FitnessTest, ArchitectureFinding } from "../../types.js";

export const dualWriteCheckTest: FitnessTest = {
  id: "DATA-001",
  version: "1.0",
  title: "Dual-Write Distributed State Inconsistency Hazard",
  category: "data_consistency",
  description: "Detects components that write synchronously to a database and simultaneously publish to an asynchronous queue without Outbox or 2PC patterns.",
  evaluate(context): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];
    const { alternative, graph } = context;

    for (const comp of alternative.components) {
      if (comp.type === "application" || comp.type === "service") {
        const outgoingEdges = graph.getAllEdges().filter((e) => e.from === comp.id);

        let writesToDb = false;
        let publishesToQueue = false;
        let dbId = "";
        let queueId = "";

        for (const edge of outgoingEdges) {
          const targetNode = graph.getNode(edge.to);
          if (targetNode?.componentType?.includes("database")) {
            writesToDb = true;
            dbId = targetNode.id;
          }
          if (targetNode?.componentType === "message_queue" || targetNode?.componentType === "event_stream") {
            publishesToQueue = true;
            queueId = targetNode.id;
          }
        }

        // If service directly interacts with both a DB and a Queue
        if (writesToDb && publishesToQueue) {
          // Check if any decision addresses Outbox Pattern or dual write
          const hasOutboxDecision = alternative.decisions?.some(
            (d) =>
              d.choice.toLowerCase().includes("outbox") ||
              d.context.toLowerCase().includes("dual write") ||
              d.context.toLowerCase().includes("dual-write") ||
              d.title.toLowerCase().includes("outbox")
          );

          if (!hasOutboxDecision) {
            findings.push({
              id: `finding-${comp.id}-dual-write`,
              testId: "DATA-001",
              category: "data_consistency",
              status: "warning",
              severity: "warning",
              title: `Potential dual-write inconsistency in "${comp.id}"`,
              summary: `Component "${comp.id}" connects directly to both database "${dbId}" and message channel "${queueId}". If the service crashes between database commit and message publishing, database state updates while message delivery is lost (or vice versa). No Outbox Pattern or transactional dual-write coordination is declared.`,
              evidence: [
                {
                  type: "component",
                  id: comp.id,
                  details: `Direct connections to DB "${dbId}" and Queue "${queueId}"`,
                },
              ],
              affectedComponents: [comp.id, dbId, queueId],
              suggestedActions: [
                `Adopt the Transactional Outbox Pattern: persist events to an 'outbox' table within the database transaction and relay to "${queueId}" via Change Data Capture (CDC) or a relay worker.`,
                `Or record an ADR explaining how partial failure between "${dbId}" and "${queueId}" is handled or why at-least-once reconciliation is acceptable.`,
              ],
              learningConcept: "Transactional Outbox Pattern & Dual Writes",
            });
          }
        }
      }
    }

    return findings;
  },
};

