/**
 * ArchSpec v0.1 Specification Type Definitions
 */

export interface ArchBenchMetadata {
  spec_version: "0.1";
  project: string;
  description?: string;
  authors?: string[];
}

export interface ContextUser {
  id: string;
  name?: string;
  description?: string;
}

export interface ContextExternalSystem {
  id: string;
  name?: string;
  category?: string;
  description?: string;
}

export interface SystemContext {
  users?: ContextUser[];
  external_systems?: ContextExternalSystem[];
}

export type RequirementCategory =
  | "functional"
  | "availability"
  | "latency"
  | "throughput"
  | "durability"
  | "consistency"
  | "security"
  | "compliance"
  | "cost"
  | "operability"
  | "maintainability"
  | "scalability";

export type RequirementPriority = "must" | "should" | "could" | "wont";

export interface Requirement {
  id: string;
  category: RequirementCategory;
  priority: RequirementPriority;
  statement: string;
  target?: Record<string, unknown>;
  measurement_window?: string;
  verification?: string;
}

export type ConstraintCategory =
  | "team"
  | "deployment"
  | "budget"
  | "technology"
  | "regulatory"
  | "timeline"
  | "operational";

export interface Constraint {
  id: string;
  category: ConstraintCategory;
  statement: string;
}

export type AssumptionStatus = "confirmed" | "assumed" | "unknown";
export type ConfidenceLevel = "high" | "medium" | "low";
export type ImpactLevel = "high" | "medium" | "low";

export interface Assumption {
  id: string;
  statement: string;
  status: AssumptionStatus;
  confidence?: ConfidenceLevel;
  impact_if_false?: ImpactLevel;
  validation?: string;
  owner?: string;
}

export type ComponentType =
  | "application"
  | "service"
  | "module"
  | "api_gateway"
  | "load_balancer"
  | "relational_database"
  | "document_database"
  | "key_value_store"
  | "cache"
  | "message_queue"
  | "event_stream"
  | "background_worker"
  | "object_storage"
  | "search_engine"
  | "identity_provider"
  | "external_provider"
  | "observability";

export interface DeploymentConfig {
  replicas?: number;
  region?: string;
  platform?: string;
}

export interface DataConfig {
  ownership?: string;
  storage_type?: string;
  retention?: string;
  backup_frequency?: string;
}

export type DeliverySemantics = "at_least_once" | "at_most_once" | "effectively_once";

export interface MessagingConfig {
  delivery_semantics?: DeliverySemantics;
  overload_policy?: string;
  retention_period?: string;
}

export type BackoffType = "fixed" | "exponential" | "linear";

export interface RetryPolicy {
  max_attempts: number;
  backoff: BackoffType;
  dead_letter_target?: string;
}

export interface BehaviorConfig {
  idempotent?: boolean;
  idempotency_key?: string;
  retry_policy?: RetryPolicy;
}

export interface ArchitectureComponent {
  id: string;
  name?: string;
  type: ComponentType;
  technology?: string;
  responsibility: string;
  requirements?: string[];
  deployment?: DeploymentConfig;
  data?: DataConfig;
  messaging?: MessagingConfig;
  behavior?: BehaviorConfig;
}

export type ProtocolType = "synchronous" | "asynchronous";

export interface ArchitectureConnection {
  id: string;
  from: string;
  to: string;
  protocol: ProtocolType;
  transport?: string;
  purpose?: string;
  timeout_ms?: number;
  retry_policy?: {
    max_attempts: number;
    backoff: BackoffType;
  };
}

export type DecisionStatus = "proposed" | "accepted" | "superseded" | "deprecated" | "rejected";

export interface EvolutionTrigger {
  id: string;
  metric: string;
  threshold: string;
  condition?: string;
  action: string;
}

export interface ArchitectureDecision {
  id: string;
  title: string;
  status: DecisionStatus;
  context: string;
  choice: string;
  alternatives?: string[];
  consequences?: string[];
  requirements?: string[];
  evolution_triggers?: EvolutionTrigger[];
}

export interface ArchitectureAlternative {
  id: string;
  name: string;
  description?: string;
  components: ArchitectureComponent[];
  connections: ArchitectureConnection[];
  decisions?: ArchitectureDecision[];
  workload?: Record<string, unknown>;
  objectives?: Record<string, unknown>;
}

export interface ArchitectureSection {
  alternatives: ArchitectureAlternative[];
}

export interface SystemSection {
  context?: SystemContext;
  requirements: Requirement[];
  constraints?: Constraint[];
  assumptions?: Assumption[];
}

export interface ArchSpec {
  archbench: ArchBenchMetadata;
  system: SystemSection;
  architecture: ArchitectureSection;
}

export interface SourceLocation {
  line: number;
  column: number;
}

export interface DiagnosticError {
  path: string;
  message: string;
  rule?: string;
  location?: SourceLocation;
}

