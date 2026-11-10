import { GraphEdge, CriticalPath } from "../types.js";

/**
 * Computes all directed simple paths between two nodes, with an option to filter
 * for synchronous paths only to calculate critical latency budgets and call-chain depth.
 */
export function findPathsBetween(
  startId: string,
  endId: string,
  edges: GraphEdge[],
  syncOnly = false
): CriticalPath[] {
  const filteredEdges = syncOnly
    ? edges.filter((e) => e.protocol === "synchronous")
    : edges;

  // Build edge lookup: from -> GraphEdge[]
  const adj = new Map<string, GraphEdge[]>();
  for (const edge of filteredEdges) {
    if (!adj.has(edge.from)) {
      adj.set(edge.from, []);
    }
    adj.get(edge.from)!.push(edge);
  }

  const results: CriticalPath[] = [];
  const currentNodes: string[] = [startId];
  const currentEdges: GraphEdge[] = [];
  const visited = new Set<string>([startId]);

  function dfs(current: string) {
    if (current === endId) {
      let timeoutSum = 0;
      let syncCount = 0;
      for (const e of currentEdges) {
        if (e.timeout_ms) timeoutSum += e.timeout_ms;
        if (e.protocol === "synchronous") syncCount++;
      }
      results.push({
        nodes: [...currentNodes],
        edges: [...currentEdges],
        totalEstimatedTimeoutMs: timeoutSum,
        synchronousHops: syncCount,
      });
      return;
    }

    const nextEdges = adj.get(current) || [];
    for (const edge of nextEdges) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        currentNodes.push(edge.to);
        currentEdges.push(edge);

        dfs(edge.to);

        currentEdges.pop();
        currentNodes.pop();
        visited.delete(edge.to);
      }
    }
  }

  dfs(startId);

  // Sort paths by synchronous hops descending (deepest critical paths first)
  return results.sort((a, b) => b.synchronousHops - a.synchronousHops);
}

