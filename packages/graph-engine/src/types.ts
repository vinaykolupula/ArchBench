import {
  ComponentType,
  ProtocolType,
  ArchitectureComponent,
  ArchitectureConnection,
  ContextUser,
  ContextExternalSystem,
} from "@archbench/archspec";

export type NodeKind = "component" | "user" | "external_system";

export interface GraphNode {
  id: string;
  name: string;
  kind: NodeKind;
  componentType?: ComponentType;
  technology?: string;
  responsibility?: string;
  rawComponent?: ArchitectureComponent;
  rawUser?: ContextUser;
  rawExternalSystem?: ContextExternalSystem;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  protocol: ProtocolType;
  transport?: string;
  purpose?: string;
  timeout_ms?: number;
  rawConnection?: ArchitectureConnection;
}

export interface NodeMetrics {
  inDegree: number;
  outDegree: number;
  syncInDegree: number;
  syncOutDegree: number;
  asyncInDegree: number;
  asyncOutDegree: number;
}

export interface CriticalPath {
  nodes: string[];
  edges: GraphEdge[];
  totalEstimatedTimeoutMs: number;
  synchronousHops: number;
}

