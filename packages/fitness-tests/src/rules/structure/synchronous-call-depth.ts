import { FitnessTest, ArchitectureFinding } from "../../types.js";

export const synchronousCallDepthTest: FitnessTest = {
  id: "STRUC-001",
  version: "1.0",
  title: "Deep Synchronous Dependency Chain",
  category: "structure",
  description: "Detects synchronous request chains that exceed recommended depth, causing latency and availability coupling.",
  evaluate(context): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];
    const { graph } = context;

    // Find all external ingress nodes or user nodes
    const entryNodes = graph.getAllNodes().filter((n) => n.kind === "user" || n.componentType === "api_gateway");
    const sinkNodes = graph.getAllNodes().filter((n) => n.componentType?.includes("database") || n.kind === "external_system");

    const maxAllowedDepth = 3;

    for (const entry of entryNodes) {
      for (const sink of sinkNodes) {
        if (entry.id === sink.id) continue;
        const paths = graph.findPaths(entry.id, sink.id, true);

        for (const p of paths) {
          if (p.synchronousHops > maxAllowedDepth) {
            findings.push({
              id: `finding-sync-chain-${entry.id}-${sink.id}`,
              testId: "STRUC-001",
              category: "structure",
              status: "warning",
              severity: "warning",
              title: `Deep synchronous call chain (${p.synchronousHops} hops) between "${entry.id}" and "${sink.id}"`,
              summary: `A synchronous execution path traverses ${p.synchronousHops} hops: ${p.nodes.join(" -> ")}. Total declared timeout sum is ${p.totalEstimatedTimeoutMs}ms. Each synchronous hop compounds latency and availability risks.`,
              evidence: [
                {
                  type: "graph_path",
                  id: p.nodes.join(" -> "),
                  details: `Synchronous hops: ${p.synchronousHops}, Estimated timeout: ${p.totalEstimatedTimeoutMs}ms`,
                },
              ],
              affectedComponents: p.nodes,
              suggestedActions: [
                `Break synchronous dependencies by converting non-critical operations to asynchronous message queues or event streams.`,
                `Consolidate tightly coupled services into a cohesive module if independent deployment is unjustified.`,
                `Introduce caching or local read-model projections to remove deep synchronous lookups.`,
              ],
              learningConcept: "Distributed Latency & Availability Compounding",
            });
            break; // report at most one chain per entry/sink pair
          }
        }
      }
    }

    return findings;
  },
};

