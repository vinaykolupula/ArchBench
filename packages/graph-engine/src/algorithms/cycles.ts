import { GraphNode, GraphEdge } from "../types.js";

/**
 * Detects directed cycles in a graph.
 * If syncOnly is true, only traverses edges where protocol === "synchronous".
 */
export function findDirectedCycles(
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[],
  syncOnly = false
): string[][] {
  const filteredEdges = syncOnly
    ? edges.filter((e) => e.protocol === "synchronous")
    : edges;

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const node of nodes.keys()) {
    adj.set(node, []);
  }
  for (const edge of filteredEdges) {
    if (adj.has(edge.from)) {
      adj.get(edge.from)!.push(edge.to);
    }
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];
  const currentPath: string[] = [];

  function dfs(u: string) {
    visited.add(u);
    recStack.add(u);
    currentPath.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        dfs(v);
      } else if (recStack.has(v)) {
        // Cycle detected from v to current u
        const cycleStartIndex = currentPath.indexOf(v);
        if (cycleStartIndex !== -1) {
          const cycle = currentPath.slice(cycleStartIndex);
          cycle.push(v); // close the cycle loop
          cycles.push(cycle);
        }
      }
    }

    currentPath.pop();
    recStack.delete(u);
  }

  for (const nodeId of nodes.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  }

  return cycles;
}

