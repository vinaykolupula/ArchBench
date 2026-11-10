import { FitnessTest, ArchitectureFinding } from "../../types.js";

export const singlePointOfFailureTest: FitnessTest = {
  id: "REL-004",
  version: "1.0",
  title: "Single Point of Failure (SPOF) on Critical Path",
  category: "reliability",
  description: "Identifies structural articulation points that lack redundancy or high-availability replication.",
  evaluate(context): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];
    const { graph } = context;

    const articulationPoints = graph.findSinglePointsOfFailure();

    for (const compId of articulationPoints) {
      const node = graph.getNode(compId);
      const comp = node?.rawComponent;

      if (comp) {
        const replicas = comp.deployment?.replicas ?? 1;

        // Compute/routing components that have only 1 replica and are articulation points
        if (
          (comp.type === "application" ||
            comp.type === "service" ||
            comp.type === "api_gateway" ||
            comp.type === "background_worker") &&
          replicas <= 1
        ) {
          findings.push({
            id: `finding-${comp.id}-spof`,
            testId: "REL-004",
            category: "reliability",
            status: "warning",
            severity: "warning",
            title: `Component "${comp.id}" is a single point of failure with 1 replica`,
            summary: `Component "${comp.id}" is topologically an articulation point whose failure disconnects system communication paths, and its declared deployment has only ${replicas} replica. An instance crash or host failure will cause total system downtime.`,
            evidence: [
              {
                type: "component",
                id: comp.id,
                details: `Articulation point with deployment.replicas: ${replicas}`,
              },
            ],
            affectedComponents: [comp.id],
            suggestedActions: [
              `Increase deployment.replicas to at least 2 across multiple availability zones.`,
              `Ensure stateless compute nodes run behind an active load balancer or gateway.`,
            ],
            learningConcept: "High Availability & Articulation Points",
          });
        }
      }
    }

    return findings;
  },
};

