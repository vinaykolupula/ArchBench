import { GraphNode, GraphEdge } from "../types.js";

export function getReachableNodes(
  startNodeId: string,
  edges: GraphEdge[]
): Set<string> {
  const reachable = new Set<string>();
  const queue: string[] = [startNodeId];
  reachable.add(startNodeId);

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adj.has(edge.from)) {
      adj.set(edge.from, []);
    }
    adj.get(edge.from)!.push(edge.to);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current) || [];
    for (const next of neighbors) {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }

  return reachable;
}

export function findOrphanedNodes(
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[]
): GraphNode[] {
  const connectedNodeIds = new Set<string>();
  for (const edge of edges) {
    connectedNodeIds.add(edge.from);
    connectedNodeIds.add(edge.to);
  }

  const orphaned: GraphNode[] = [];
  for (const [id, node] of nodes.entries()) {
    // Only check internal components for orphan status
    if (node.kind === "component" && !connectedNodeIds.has(id)) {
      orphaned.push(node);
    }
  }

  return orphaned;
}

