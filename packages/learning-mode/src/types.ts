export interface LearningCard {
  id: string;
  concept: string;
  title: string;
  plainEnglishAnalogy?: string;
  summary: string;
  whyItMatters: string;
  concreteFailureExample: string;
  mitigationOptions: string[];
  verificationApproach: string;
  furtherReading?: string[];
  ruleIds?: string[];
}

export type ExplanationMode = "guided" | "quick" | "interview";

export type LessonDifficulty = "foundation" | "intermediate" | "principal";

export type InteractiveSimId =
  | "zero-to-millions"
  | "consistent-hashing"
  | "rate-limiter"
  | "caching-strategies"
  | "cap-quorum"
  | "sharding-storage"
  | "replication-failover"
  | "retry-circuit-breaker"
  | "outbox-saga"
  | "geospatial-index";

export interface EvolutionNode {
  id: string;
  label: string;
  kind: "client" | "edge" | "lb" | "service" | "cache" | "queue" | "db" | "replica" | "shard" | "worker";
  tier: number;
  highlight?: boolean;
}

export interface EvolutionEdge {
  from: string;
  to: string;
  label: string;
  style?: "sync" | "async";
}

export interface EvolutionStage {
  stageNumber: number;
  title: string;
  scaleLabel: string;
  nodes: EvolutionNode[];
  edges: EvolutionEdge[];
  problemSolved: string;
  remainingBottleneck: string;
}

export interface LessonQuizQuestion {
  id: string;
  scenarioPrompt: string;
  options: Array<{
    id: string;
    label: string;
    explanation: string;
  }>;
  correctOptionId: string;
  xpReward: number;
}

export interface CoreEntityCard {
  name: string;
  category: string;
  responsibility: string;
  whenToUse: string;
}

export interface TradeOffEntry {
  approach: string;
  pros: string[];
  cons: string[];
  bestFor: string;
}

export interface SeniorInterviewHook {
  hook: string;
  failurePrevented: string;
  redFlagToAvoid: string;
}

export interface BreakAndFixLab {
  id: string;
  title: string;
  missionBrief: string;
  labGoalPlainEnglish?: string;
  starterYamlSnippet?: string;
  targetRuleIds: string[];
  startingScore: number;
  targetScore: number;
  brokenArchSpecYaml: string;
  hintSteps: string[];
  solutionSummary: string;
  solutionArchSpecYaml: string;
  xpReward: number;
}

export interface KeyTermGlossaryItem {
  term: string;
  plainMeaning: string;
}

export interface SystemDesignLesson {
  id: string;
  trackId: string;
  order: number;
  title: string;
  subtitle: string;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  ruleIds?: string[];
  componentTypes?: string[];
  tags: string[];
  plainEnglishAnalogy?: string;
  keyTerms?: KeyTermGlossaryItem[];
  summary: string;
  whyItMatters: string;
  coreEntities: CoreEntityCard[];
  tradeOffs: TradeOffEntry[];
  seniorInterviewHooks: SeniorInterviewHook[];
  interactiveSim?: InteractiveSimId;
  evolutionStages?: EvolutionStage[];
  quizzes: LessonQuizQuestion[];
  lab?: BreakAndFixLab;
  furtherReading: string[];
}

export interface CurriculumTrack {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  badge: string;
  estimatedMinutes: number;
  lessonIds: string[];
}

export interface DeliveryFrameworkStage {
  stepNumber: number;
  id: string;
  title: string;
  timeBudgetMinutes: string;
  plainExplanation?: string;
  objective: string;
  checklist: string[];
  whatToSayOutLoud: string;
  timeTrapToAvoid: string;
}

export interface LatencyNumberItem {
  id: string;
  operation: string;
  category: "cpu" | "memory" | "disk" | "network";
  nanoseconds: number;
  displayTime: string;
  humanScaleAnalogy: string;
  architecturalTakeaway: string;
}

export interface CapacityEstimationInput {
  dailyActiveUsers: number;
  actionsPerUserPerDay: number;
  readToWriteRatio: number; // e.g., 10 means 10 reads per 1 write
  payloadSizeKb: number;
  retentionYears: number;
  peakMultiplier: number; // e.g., 3x or 5x
  replicationFactor: number; // e.g., 3
  cacheHotSetPercent: number; // e.g., 20 (80/20 rule)
}

export interface CapacityEstimationOutput {
  totalDailyRequests: number;
  avgRps: number;
  peakRps: number;
  readQps: number;
  writeQps: number;
  dailyStorageGb: number;
  retentionStorageTb: number;
  replicatedStorageTb: number;
  ingressBandwidthMbps: number;
  egressBandwidthMbps: number;
  hotCacheMemoryGb: number;
  estimatedAppServers: number;
  recommendedArchetype: string;
}

export interface InterviewCaseStudy {
  id: string;
  title: string;
  companyAnalog: string;
  difficulty: LessonDifficulty;
  category: string;
  scaleBadge: string;
  plainOverview?: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  backOfEnvelopeNotes: string[];
  coreEntities: string[];
  keyApis: Array<{ method: string; path: string; purpose: string }>;
  deepDives: Array<{ topic: string; bottleneck: string; solution: string }>;
  seniorHook: string;
  presetId?: string;
  archSpecYaml: string;
}

export type FlashcardCategory =
  | "Numbers & Math"
  | "Storage & Cache"
  | "Distributed Theory"
  | "Senior Pattern Hooks";

export interface FlashcardItem {
  id: string;
  category: FlashcardCategory;
  front: string;
  simpleHint?: string;
  back: string;
  seniorTip: string;
}

// ============================================================================
// Simulator Deterministic IO Contracts
// ============================================================================

export interface HashRingNodeSlice {
  nodeId: string;
  color: string;
  vnodePositions: number[]; // degree angles 0..359.9
  keyCount: number;
  sharePercent: number;
}

export interface HashRingSimulationResult {
  mode: "consistent" | "modulo";
  vnodesPerServer: number;
  totalKeys: number;
  nodes: HashRingNodeSlice[];
  stdDevPercent: number;
  migrationPercentAfterRemoval: number;
  removedNodeId?: string;
  sampleKeys: Array<{
    key: string;
    angleDeg: number;
    assignedNode: string;
    previousNode?: string;
    moved: boolean;
  }>;
}

export type RateLimitAlgorithm =
  | "token_bucket"
  | "leaky_bucket"
  | "fixed_window"
  | "sliding_window_log"
  | "sliding_window_counter";

export interface RateLimitSimulationResult {
  algorithm: RateLimitAlgorithm;
  totalSent: number;
  allowedCount: number;
  rejected429Count: number;
  ticks: Array<{
    tick: number;
    incoming: number;
    allowed: number;
    rejected: number;
    bucketLevel: number;
  }>;
  boundaryBurstVulnerable: boolean;
  summaryNote: string;
}

export interface QuorumSimulationResult {
  n: number;
  w: number;
  r: number;
  strictQuorum: boolean; // W + R > N
  partitioned: boolean;
  writeSucceeded: boolean;
  readSucceeded: boolean;
  staleReadOccurred: boolean;
  capClassification: "CP (Consistent under Partition)" | "AP (Available, Stale Risk)" | "CA-like (Wait/Unavailable)";
  replicas: Array<{
    id: number;
    partitionGroup: "A" | "B";
    version: number;
    participatedInWrite: boolean;
    participatedInRead: boolean;
  }>;
  explanation: string;
}

export type CacheStrategyType =
  | "cache_aside"
  | "read_through"
  | "write_through"
  | "write_behind"
  | "write_around";

export type CacheEvictionType = "LRU" | "LFU";

export interface CacheSimulationResult {
  strategy: CacheStrategyType;
  eviction: CacheEvictionType;
  cacheCapacity: number;
  hitCount: number;
  missCount: number;
  hitRatePercent: number;
  dbReads: number;
  dbWrites: number;
  avgLatencyMs: number;
  staleWindowRisk: "None" | "Low" | "High (Crash Data-Loss Risk)" | "Medium (First-Read Miss)";
  finalSlots: Array<{ key: string; valueVersion: number; freq: number; dirty: boolean }>;
  trace: Array<{
    step: number;
    op: "READ" | "WRITE";
    key: string;
    outcome: "CACHE_HIT" | "CACHE_MISS" | "SYNC_WRITE" | "ASYNC_BUFFER" | "BYPASS_WRITE";
    latencyMs: number;
    evictedKey?: string;
  }>;
}

export type RetryStrategyType =
  | "immediate"
  | "fixed_backoff"
  | "exp_backoff_jitter"
  | "circuit_breaker_jitter";

export interface RetryStormSimulationResult {
  strategy: RetryStrategyType;
  concurrentWorkers: number;
  totalGeneratedRequests: number;
  peakLoadMultiplier: number;
  downstreamRecovered: boolean;
  circuitTrippedAtTick?: number;
  timeline: Array<{
    tick: number;
    downstreamHealthPercent: number;
    incomingRequests: number;
    circuitState: "CLOSED" | "OPEN" | "HALF_OPEN";
  }>;
}
