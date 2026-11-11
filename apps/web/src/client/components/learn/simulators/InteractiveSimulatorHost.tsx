import React from "react";
import { InteractiveSimId } from "@archbench/learning-mode";
import { Lightbulb } from "lucide-react";
import { SimZeroToMillions } from "./SimZeroToMillions.js";
import { SimConsistentHashRing } from "./SimConsistentHashRing.js";
import { SimRateLimiter } from "./SimRateLimiter.js";
import { SimCachingStrategies } from "./SimCachingStrategies.js";
import { SimQuorumCap } from "./SimQuorumCap.js";
import { SimShardingStorage } from "./SimShardingStorage.js";
import { SimReplicationFailover } from "./SimReplicationFailover.js";
import { SimRetryCircuitBreaker } from "./SimRetryCircuitBreaker.js";
import { SimOutboxSaga } from "./SimOutboxSaga.js";
import { SimGeospatialIndex } from "./SimGeospatialIndex.js";

export interface SimulatorCatalogMeta {
  id: InteractiveSimId;
  title: string;
  subtitle: string;
  category: string;
}

export const SIMULATOR_CATALOG: SimulatorCatalogMeta[] = [
  {
    id: "zero-to-millions",
    title: "0 -> 10M Scale Progression",
    subtitle: "Scrub multi-stage scaling layers & throughput bottlenecks",
    category: "Foundations",
  },
  {
    id: "caching-strategies",
    title: "Caching & Eviction Studio",
    subtitle: "Cache-Aside vs Write-Through vs Write-Behind + LRU/LFU",
    category: "Storage & Cache",
  },
  {
    id: "consistent-hashing",
    title: "Consistent Hash Ring",
    subtitle: "Vnodes vs hash%N key churn during shard crashes",
    category: "Distributed Core",
  },
  {
    id: "cap-quorum",
    title: "CAP & Dynamo Quorum",
    subtitle: "Tune W + R > N and slice datacenter network links",
    category: "Distributed Core",
  },
  {
    id: "rate-limiter",
    title: "Rate Limiter Engine",
    subtitle: "Token Bucket vs Fixed Window 2x Boundary Attacks",
    category: "Entities",
  },
  {
    id: "sharding-storage",
    title: "Shard & Hot-Key Studio",
    subtitle: "Compare Range, Hash, and Salted Shards against viral skew",
    category: "Storage & Cache",
  },
  {
    id: "replication-failover",
    title: "WAL Lag & Read-Your-Writes",
    subtitle: "Trigger stale replica bugs & test Primary session pinning",
    category: "Storage & Cache",
  },
  {
    id: "retry-circuit-breaker",
    title: "Retry Storm & Breaker",
    subtitle: "Compare naive retries vs Full Jitter + Fast-Fail Breakers",
    category: "Resilience",
  },
  {
    id: "outbox-saga",
    title: "Transactional Outbox & Sagas",
    subtitle: "Inject pod crashes to see Dual-Write loss vs Debezium CDC",
    category: "Resilience",
  },
  {
    id: "geospatial-index",
    title: "Geohash & H3 Proximity",
    subtitle: "Click grid borders to debug missing nearby drivers",
    category: "Entities",
  },
];

const SIMULATOR_EXPERIMENTS: Record<InteractiveSimId, string> = {
  "zero-to-millions":
    "Drag the Scale Slider left -> right to see why Stage 3 (Load Balancer) still melts Postgres until you add Read Replicas (Stage 4) and Redis/CDN (Stage 5).",
  "caching-strategies":
    "Switch between Cache-Aside, Write-Through, and Write-Behind and watch DB Reads, Latency, and the 'High Crash Data-Loss Risk' warning flip immediately!",
  "consistent-hashing":
    "Click 'Kill 1 Shard' while switching between 'Ring (Vnodes)' and 'hash % N' — notice how modulo remaps ~80%+ of your cache at once!",
  "cap-quorum":
    "Set N=5, W=2, R=2 (W+R <= N) and click 'Sever Network (P)' to trigger a real Stale Read; then raise W=3, R=3 to enforce strict overlap.",
  "rate-limiter":
    "Keep Traffic on 'Boundary Edge Attack', click 'Fixed Window', and watch T3+T4 slip 2x traffic across the Window Reset dashed line vs 'Token Bucket'!",
  "sharding-storage":
    "Toggle between 'Range', 'hash(celebrity_id)', and 'Salted hash(key + #0..9)' with high Skew % to diffuse a 1-shard CPU meltdown across all 4 servers.",
  "replication-failover":
    "Click 'Write Profile & Immediately Reload' at 650ms async lag to see old data v1 reappear; then enable 'Pin Writes -> Primary: ON' to heal it.",
  "retry-circuit-breaker":
    "Compare 'Naive Immediate Retry' (0% downstream collapse!) against 'Circuit Breaker + Jitter' where fast-fail lets the database breathe and recover.",
  "outbox-saga":
    "Leave 'Crash Fault: INJECTED' ON and flip between 'Naive Dual-Write' (lost event!) and 'Transactional Outbox + CDC' (safe atomic SQL guarantee).",
  "geospatial-index":
    "Click 'Single Geohash Cell' near the border to see Driver D2 missed right across the street; switch to '3x3 Neighbors' or 'Uber H3' to fix the blind spot.",
};

interface HostProps {
  simId: InteractiveSimId;
  onExplore?: (simId: InteractiveSimId) => void;
}

export const InteractiveSimulatorHost: React.FC<HostProps> = ({
  simId,
  onExplore,
}) => {
  const handleInteract = () => {
    onExplore?.(simId);
  };

  const experimentTip = SIMULATOR_EXPERIMENTS[simId];

  const renderSimulator = () => {
    switch (simId) {
      case "zero-to-millions":
        return <SimZeroToMillions onInteract={handleInteract} />;
      case "consistent-hashing":
        return <SimConsistentHashRing onInteract={handleInteract} />;
      case "rate-limiter":
        return <SimRateLimiter onInteract={handleInteract} />;
      case "caching-strategies":
        return <SimCachingStrategies onInteract={handleInteract} />;
      case "cap-quorum":
        return <SimQuorumCap onInteract={handleInteract} />;
      case "sharding-storage":
        return <SimShardingStorage onInteract={handleInteract} />;
      case "replication-failover":
        return <SimReplicationFailover onInteract={handleInteract} />;
      case "retry-circuit-breaker":
        return <SimRetryCircuitBreaker onInteract={handleInteract} />;
      case "outbox-saga":
        return <SimOutboxSaga onInteract={handleInteract} />;
      case "geospatial-index":
        return <SimGeospatialIndex onInteract={handleInteract} />;
    }
  };

  return (
    <div className="space-y-3">
      {experimentTip && (
        <div className="bg-sky-950/30 border border-sky-800/60 rounded-xl px-3.5 py-2.5 flex items-start gap-2 text-xs">
          <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="font-sans text-xs text-sky-100 leading-relaxed">
            <strong className="font-mono text-[10px] uppercase text-sky-300 mr-1.5">
              Try This 10-Second Experiment:
            </strong>
            {experimentTip}
          </div>
        </div>
      )}
      {renderSimulator()}
    </div>
  );
};

