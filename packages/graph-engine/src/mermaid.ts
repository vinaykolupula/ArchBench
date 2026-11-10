import { GraphNode, GraphEdge } from "./types.js";

export interface MermaidExportOptions {
  direction?: "TD" | "LR";
  includeContext?: boolean;
}

export function exportToMermaid(
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[],
  options: MermaidExportOptions = {}
): string {
  const direction = options.direction ?? "TD";
  const lines: string[] = [];

  lines.push(`flowchart ${direction}`);

  // Separate nodes into external context vs internal components
  const userNodes: GraphNode[] = [];
  const extNodes: GraphNode[] = [];
  const internalNodes: GraphNode[] = [];

  for (const node of nodes.values()) {
    if (node.kind === "user") userNodes.push(node);
    else if (node.kind === "external_system") extNodes.push(node);
    else internalNodes.push(node);
  }

  // Format node label with shape based on component type
  const formatNode = (node: GraphNode): string => {
    const rawLabel = node.technology ? `${node.name || node.id}\\n[${node.technology}]` : (node.name || node.id);
    const safeLabel = rawLabel.replace(/"/g, "'");

    if (node.kind === "user") {
      return `${sanitizeId(node.id)}(["👤 ${safeLabel}"])`;
    }
    if (node.kind === "external_system") {
      return `${sanitizeId(node.id)}[["🌐 ${safeLabel}"]]`;
    }

    switch (node.componentType) {
      case "relational_database":
      case "document_database":
      case "key_value_store":
      case "search_engine":
        return `${sanitizeId(node.id)}[("🗄️ ${safeLabel}")]`;
      case "message_queue":
      case "event_stream":
        return `${sanitizeId(node.id)}> "📨 ${safeLabel}"]`;
      case "cache":
        return `${sanitizeId(node.id)}[("⚡ ${safeLabel}")]`;
      case "api_gateway":
      case "load_balancer":
        return `${sanitizeId(node.id)}{{"🚪 ${safeLabel}"}}`;
      case "background_worker":
        return `${sanitizeId(node.id)}["⚙️ ${safeLabel}"]`;
      case "object_storage":
        return `${sanitizeId(node.id)}[("📦 ${safeLabel}")]`;
      default:
        return `${sanitizeId(node.id)}["📦 ${safeLabel}"]`;
    }
  };

  // Subgraph for Users / Clients if present
  if (userNodes.length > 0) {
    lines.push("  subgraph Users [Users & Clients]");
    for (const u of userNodes) {
      lines.push(`    ${formatNode(u)}`);
    }
    lines.push("  end");
  }

  // Subgraph for Core System Components
  if (internalNodes.length > 0) {
    lines.push("  subgraph SystemBoundary [Internal System Boundary]");
    for (const c of internalNodes) {
      lines.push(`    ${formatNode(c)}`);
    }
    lines.push("  end");
  }

  // Subgraph for External Systems
  if (extNodes.length > 0) {
    lines.push("  subgraph ExternalDependencies [External Systems & Providers]");
    for (const ext of extNodes) {
      lines.push(`    ${formatNode(ext)}`);
    }
    lines.push("  end");
  }

  lines.push("");

  // Connections (edges)
  for (const edge of edges) {
    const fromId = sanitizeId(edge.from);
    const toId = sanitizeId(edge.to);
    const label = edge.purpose ? `|"${edge.purpose}"|` : "";

    if (edge.protocol === "asynchronous") {
      lines.push(`  ${fromId} -.->${label} ${toId}`);
    } else {
      lines.push(`  ${fromId} -->${label} ${toId}`);
    }
  }

  return lines.join("\n");
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

