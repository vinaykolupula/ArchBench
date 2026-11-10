import { FitnessTest, ArchitectureFinding } from "../../types.js";

export const statefulOwnershipTest: FitnessTest = {
  id: "STRUC-002",
  version: "1.0",
  title: "Stateful Resource Ownership and Isolation",
  category: "structure",
  description: "Ensures every stateful storage resource declares clear domain ownership and isolates access.",
  evaluate(context): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];
    const { alternative, graph } = context;

    const statefulTypes = new Set([
      "relational_database",
      "document_database",
      "key_value_store",
      "search_engine",
      "object_storage",
    ]);

    for (const comp of alternative.components) {
      if (statefulTypes.has(comp.type)) {
        // 1. Check explicit ownership
        const ownership = comp.data?.ownership;
        if (!ownership) {
          findings.push({
            id: `finding-${comp.id}-missing-ownership`,
            testId: "STRUC-002",
            category: "structure",
            status: "warning",
            severity: "warning",
            title: `Datastore "${comp.id}" lacks declared domain ownership`,
            summary: `Stateful component "${comp.id}" (${comp.type}) does not declare a bounded context in 'data.ownership'. In an evolving architecture, clear data ownership is required to avoid multiple teams coupling to shared schemas.`,
            evidence: [
              {
                type: "component",
                id: comp.id,
                details: `Component type: ${comp.type}`,
              },
            ],
            affectedComponents: [comp.id],
            suggestedActions: [
              `Specify an explicit domain ownership (e.g., data: { ownership: "${comp.id.replace(/-db$|-store$/, "")}-domain" }).`,
            ],
            learningConcept: "Bounded Contexts & Data Ownership",
          });
        }

        // 2. Check for multiple writing compute services (Shared Database Anti-Pattern)
        const incomingEdges = graph.getAllEdges().filter((e) => e.to === comp.id);
        const writingServices = incomingEdges.filter((e) => {
          const fromNode = graph.getNode(e.from);
          return fromNode?.kind === "component" && (fromNode.componentType === "application" || fromNode.componentType === "service");
        });

        if (writingServices.length > 1) {
          const serviceIds = writingServices.map((e) => e.from);
          findings.push({
            id: `finding-${comp.id}-shared-database`,
            testId: "STRUC-002",
            category: "structure",
            status: "warning",
            severity: "warning",
            title: `Shared database anti-pattern on "${comp.id}"`,
            summary: `Multiple independent compute services (${serviceIds.join(", ")}) connect directly to "${comp.id}". Direct multi-service database access tightly couples schemas and deployment lifecycles.`,
            evidence: [
              {
                type: "component",
                id: comp.id,
                details: `Connected services: ${serviceIds.join(", ")}`,
              },
            ],
            affectedComponents: [comp.id, ...serviceIds],
            suggestedActions: [
              `Encapsulate access to "${comp.id}" behind a single authoritative service API.`,
              `Separate data into dedicated bounded stores if independent evolution is required.`,
            ],
            learningConcept: "Shared Database Anti-Pattern",
          });
        }
      }
    }

    return findings;
  },
};

