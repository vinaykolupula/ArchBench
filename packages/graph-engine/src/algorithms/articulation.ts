import { GraphNode, GraphEdge } from "../types.js";

/**
 * Finds articulation points (structural single points of failure) in the architecture graph.
 * Converts the graph to an undirected view to analyze topological dependency partitioning.
 */
export function findArticulationPoints(
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[]
): string[] {
  // Build undirected adjacency list
  const adj = new Map<string, Set<string>>();
  for (const nodeId of nodes.keys()) {
    adj.set(nodeId, new Set<string>());
  }
  for (const edge of edges) {
    if (adj.has(edge.from) && adj.has(edge.to)) {
      adj.get(edge.from)!.add(edge.to);
      adj.get(edge.to)!.add(edge.from);
    }
  }

  const visited = new Set<string>();
  const tin = new Map<string, number>();
  const low = new Map<string, number>();
  const isArticulation = new Set<string>();
  let timer = 0;

  function dfs(u: string, p: string | null = null) {
    visited.add(u);
    tin.set(u, timer);
    low.set(u, timer);
    timer++;

    let children = 0;
    const neighbors = adj.get(u) || new Set();

    for (const v of neighbors) {
      if (v === p) continue;
      if (visited.has(v)) {
        low.set(u, Math.min(low.get(u)!, tin.get(v)!));
      } else {
        dfs(v, u);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
        if (low.get(v)! >= tin.get(u)! && p !== null) {
          isArticulation.add(u);
        }
        children++;
      }
    }

    if (p === null && children > 1) {
      isArticulation.add(u);
    }
  }

  for (const nodeId of nodes.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  }

  // Filter to components only (exclude external client users)
  return Array.from(isArticulation).filter((id) => {
    const node = nodes.get(id);
    return node?.kind === "component";
  });
}

