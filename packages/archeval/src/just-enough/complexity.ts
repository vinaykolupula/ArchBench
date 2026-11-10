import { ArchitectureAlternative } from "@archbench/archspec";
import { ArchitectureGraph } from "@archbench/graph-engine";
import { ComplexityVector } from "../types.js";

export function calculateComplexityVector(
  alternative: ArchitectureAlternative,
  graph: ArchitectureGraph
): ComplexityVector {
  const componentCount = alternative.components.length;

  let deployableCount = 0;
  let statefulStoreCount = 0;

  for (const comp of alternative.components) {
    if (
      comp.type === "application" ||
      comp.type === "service" ||
      comp.type === "background_worker" ||
      comp.type === "api_gateway"
    ) {
      deployableCount++;
    }

    if (
      comp.type === "relational_database" ||
      comp.type === "document_database" ||
      comp.type === "key_value_store" ||
      comp.type === "cache" ||
      comp.type === "message_queue" ||
      comp.type === "event_stream" ||
      comp.type === "object_storage" ||
      comp.type === "search_engine"
    ) {
      statefulStoreCount++;
    }
  }

  const networkBoundaryCount = alternative.connections.length;

  const externalDependencyCount = graph
    .getAllNodes()
    .filter((n) => n.kind === "external_system").length;

  return {
    componentCount,
    deployableCount,
    networkBoundaryCount,
    statefulStoreCount,
    externalDependencyCount,
  };
}

