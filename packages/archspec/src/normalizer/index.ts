import { ArchSpec, ArchitectureAlternative, ArchitectureComponent } from "../types/index.js";

/**
 * Normalizes an ArchSpec object by ensuring consistent defaults
 * across components, connections, and requirements.
 */
export function normalizeArchSpec(spec: ArchSpec): ArchSpec {
  const normalized: ArchSpec = JSON.parse(JSON.stringify(spec));

  for (const alt of normalized.architecture.alternatives) {
    normalizeAlternative(alt);
  }

  return normalized;
}

function normalizeAlternative(alt: ArchitectureAlternative): void {
  for (const comp of alt.components) {
    normalizeComponent(comp);
  }

  for (const conn of alt.connections) {
    if (!conn.transport) {
      conn.transport = conn.protocol === "synchronous" ? "http" : "message_channel";
    }
  }
}

function normalizeComponent(comp: ArchitectureComponent): void {
  if (!comp.deployment) {
    comp.deployment = { replicas: 1 };
  } else if (comp.deployment.replicas === undefined) {
    comp.deployment.replicas = 1;
  }

  if (comp.type === "message_queue" || comp.type === "event_stream") {
    if (!comp.messaging) {
      comp.messaging = { delivery_semantics: "at_least_once" };
    } else if (!comp.messaging.delivery_semantics) {
      comp.messaging.delivery_semantics = "at_least_once";
    }
  }
}

