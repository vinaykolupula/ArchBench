import {
  ArchitectureAlternative,
  SystemContext,
} from "@archbench/archspec";
import { GraphNode, GraphEdge, NodeMetrics } from "./types.js";
import { findDirectedCycles } from "./algorithms/cycles.js";
import { getReachableNodes, findOrphanedNodes } from "./algorithms/reachability.js";
import { findArticulationPoints } from "./algorithms/articulation.js";
import { findPathsBetween } from "./algorithms/critical-path.js";
import { exportToMermaid, MermaidExportOptions } from "./mermaid.js";

export class ArchitectureGraph {
  public readonly alternativeId: string;
  private readonly nodes = new Map<string, GraphNode>();
  private readonly edges: GraphEdge[] = [];

  constructor(alternative: ArchitectureAlternative, context?: SystemContext) {
    this.alternativeId = alternative.id;

    // 1. Ingest Context Users
    if (context?.users) {
      for (const u of context.users) {
        this.nodes.set(u.id, {
          id: u.id,
          name: u.name || u.id,
          kind: "user",
          responsibility: u.description,
          rawUser: u,
        });
      }
    }

    // 2. Ingest Context External Systems
    if (context?.external_systems) {
      for (const ext of context.external_systems) {
        this.nodes.set(ext.id, {
          id: ext.id,
          name: ext.name || ext.id,
          kind: "external_system",
          responsibility: ext.description,
          rawExternalSystem: ext,
        });
      }
    }

    // 3. Ingest Internal Architecture Components
    for (const comp of alternative.components) {
      this.nodes.set(comp.id, {
        id: comp.id,
        name: comp.name || comp.id,
        kind: "component",
        componentType: comp.type,
        technology: comp.technology,
        responsibility: comp.responsibility,
        rawComponent: comp,
      });
    }

    // 4. Ingest Connections
    for (const conn of alternative.connections) {
      this.edges.push({
        id: conn.id,
        from: conn.from,
        to: conn.to,
        protocol: conn.protocol,
        transport: conn.transport,
        purpose: conn.purpose,
        timeout_ms: conn.timeout_ms,
        rawConnection: conn,
      });
    }
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): GraphEdge[] {
    return [...this.edges];
  }

  public findSynchronousCycles(): string[][] {
    return findDirectedCycles(this.nodes, this.edges, true);
  }

  public findAllDirectedCycles(): string[][] {
    return findDirectedCycles(this.nodes, this.edges, false);
  }

  public findOrphanedNodes(): GraphNode[] {
    return findOrphanedNodes(this.nodes, this.edges);
  }

  public getReachableNodes(startNodeId: string): Set<string> {
    return getReachableNodes(startNodeId, this.edges);
  }

  public findSinglePointsOfFailure(): string[] {
    return findArticulationPoints(this.nodes, this.edges);
  }

  public findPaths(startId: string, endId: string, syncOnly = false) {
    return findPathsBetween(startId, endId, this.edges, syncOnly);
  }

  public getNodeMetrics(nodeId: string): NodeMetrics {
    let inDegree = 0;
    let outDegree = 0;
    let syncInDegree = 0;
    let syncOutDegree = 0;
    let asyncInDegree = 0;
    let asyncOutDegree = 0;

    for (const e of this.edges) {
      if (e.to === nodeId) {
        inDegree++;
        if (e.protocol === "synchronous") syncInDegree++;
        else asyncInDegree++;
      }
      if (e.from === nodeId) {
        outDegree++;
        if (e.protocol === "synchronous") syncOutDegree++;
        else asyncOutDegree++;
      }
    }

    return {
      inDegree,
      outDegree,
      syncInDegree,
      syncOutDegree,
      asyncInDegree,
      asyncOutDegree,
    };
  }

  public toMermaid(options?: MermaidExportOptions): string {
    return exportToMermaid(this.nodes, this.edges, options);
  }
}

