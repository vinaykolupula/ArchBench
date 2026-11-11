import {
  CapacityEstimationInput,
  CapacityEstimationOutput,
  HashRingSimulationResult,
  HashRingNodeSlice,
  RateLimitAlgorithm,
  RateLimitSimulationResult,
  QuorumSimulationResult,
  CacheStrategyType,
  CacheEvictionType,
  CacheSimulationResult,
  RetryStrategyType,
  RetryStormSimulationResult,
} from "../types.js";

/**
 * Deterministic FNV-1a 32-bit hash for repeatable ring distribution across runs.
 */
function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Back-of-the-envelope capacity estimator built on standard engineering
 * orders of magnitude (1 day ~= 86,400 sec).
 */
export function calculateCapacityEstimates(
  input: CapacityEstimationInput
): CapacityEstimationOutput {
  const safeNum = (val: number, fallback: number): number =>
    Number.isFinite(val) ? val : fallback;
  const dau = Math.max(1, safeNum(input.dailyActiveUsers, 1));
  const actionsPerDay = Math.max(1, safeNum(input.actionsPerUserPerDay, 1));
  const ratio = Math.max(0.1, safeNum(input.readToWriteRatio, 1));
  const payloadKb = Math.max(0.1, safeNum(input.payloadSizeKb, 1));
  const retentionYrs = Math.max(0.1, safeNum(input.retentionYears, 1));
  const peakMult = Math.max(1, safeNum(input.peakMultiplier, 1));
  const repFactor = Math.max(1, safeNum(input.replicationFactor, 1));
  const cachePct = Math.min(100, Math.max(1, safeNum(input.cacheHotSetPercent, 20)));

  const totalDailyRequests = Math.round(dau * actionsPerDay);
  const secondsPerDay = 86400;
  const avgRps = Number((totalDailyRequests / secondsPerDay).toFixed(1));
  const peakRps = Number((avgRps * peakMult).toFixed(1));

  const writeFraction = 1 / (1 + ratio);
  const writeQps = Number((peakRps * writeFraction).toFixed(1));
  const readQps = Number((peakRps - writeQps).toFixed(1));

  // Only writes + metadata persist to storage daily
  const dailyWrites = totalDailyRequests * writeFraction;
  const dailyStorageGb = Number(
    ((dailyWrites * payloadKb) / (1024 * 1024)).toFixed(3)
  );
  const retentionStorageTb = Number(
    ((dailyStorageGb * 365 * retentionYrs) / 1024).toFixed(3)
  );
  const replicatedStorageTb = Number((retentionStorageTb * repFactor).toFixed(3));

  // Bandwidth in Mbps (Megabits per second = MB/s * 8)
  const ingressMbPerSec = (writeQps * payloadKb) / 1024;
  const egressMbPerSec = (readQps * payloadKb) / 1024;
  const ingressBandwidthMbps = Number((ingressMbPerSec * 8).toFixed(2));
  const egressBandwidthMbps = Number((egressMbPerSec * 8).toFixed(2));

  // 80/20 rule hot working set RAM required per day
  const hotCacheMemoryGb = Number(((dailyStorageGb * cachePct) / 100).toFixed(2));

  // Assume ~2,500 req/s safe saturation budget per standard stateless API container
  const estimatedAppServers = Math.max(2, Math.ceil(peakRps / 2500));

  let recommendedArchetype = "Lean Modular Monolith + Multi-AZ PostgreSQL";
  if (peakRps > 25000 || replicatedStorageTb > 50) {
    recommendedArchetype =
      "Geo-Distributed Partitioned Cluster (Edge CDN + Consistent-Hashed Cache + Sharded Storage + Kafka)";
  } else if (peakRps > 4000 || writeQps > 1200) {
    recommendedArchetype =
      "Stateless Service Tier + Read Replicas + Redis Cache + Async Message Queue";
  }

  return {
    totalDailyRequests,
    avgRps,
    peakRps,
    readQps,
    writeQps,
    dailyStorageGb,
    retentionStorageTb,
    replicatedStorageTb,
    ingressBandwidthMbps,
    egressBandwidthMbps,
    hotCacheMemoryGb,
    estimatedAppServers,
    recommendedArchetype,
  };
}

const RING_NODE_COLORS = ["#f4f4f5", "#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa"];

/**
 * Deterministic Consistent Hashing vs Modulo Hashing simulator.
 * Demonstrates key balance across vnodes and minimal churn upon node failure.
 */
export function simulateConsistentHashRing(
  nodeCount: number,
  vnodesPerServer: number,
  totalKeys = 120,
  mode: "consistent" | "modulo" = "consistent",
  removeLastNode = false
): HashRingSimulationResult {
  const safeNodes = Math.max(2, Math.min(6, nodeCount));
  const safeVnodes = Math.max(1, Math.min(50, vnodesPerServer));
  const safeKeys = Math.max(24, Math.min(360, totalKeys));

  const serverIds = Array.from({ length: safeNodes }, (_, idx) => `Node-${String.fromCharCode(65 + idx)}`);
  const activeServers = removeLastNode ? serverIds.slice(0, safeNodes - 1) : serverIds;
  const removedNodeId = removeLastNode ? serverIds[safeNodes - 1] : undefined;

  const buildVnodes = (ids: string[]) => {
    const ring: Array<{ point: number; angleDeg: number; nodeId: string }> = [];
    for (const id of ids) {
      for (let v = 0; v < safeVnodes; v++) {
        const point = fnv1a32(`${id}#vnode-${v}`);
        const angleDeg = Number(((point / 0xffffffff) * 360).toFixed(2));
        ring.push({ point, angleDeg, nodeId: id });
      }
    }
    ring.sort((a, b) => a.point - b.point);
    return ring;
  };

  const assignKey = (
    keyHash: number,
    ids: string[],
    ring: Array<{ point: number; nodeId: string }>
  ): string => {
    if (mode === "modulo") {
      return ids[keyHash % ids.length];
    }
    for (const slot of ring) {
      if (keyHash <= slot.point) return slot.nodeId;
    }
    return ring[0].nodeId;
  };

  const baselineRing = buildVnodes(serverIds);
  const currentRing = removeLastNode ? buildVnodes(activeServers) : baselineRing;

  const counts = new Map<string, number>(activeServers.map((id) => [id, 0]));
  const sampleKeys: HashRingSimulationResult["sampleKeys"] = [];
  let movedKeys = 0;

  for (let i = 0; i < safeKeys; i++) {
    const keyName = `user_key_${i + 1}`;
    const keyHash = fnv1a32(keyName);
    const angleDeg = Number(((keyHash / 0xffffffff) * 360).toFixed(2));
    const prevNode = assignKey(keyHash, serverIds, baselineRing);
    const assignedNode = assignKey(keyHash, activeServers, currentRing);
    const moved = removeLastNode && prevNode !== assignedNode;
    if (moved) movedKeys++;

    counts.set(assignedNode, (counts.get(assignedNode) || 0) + 1);
    if (i < 36) {
      sampleKeys.push({
        key: keyName,
        angleDeg,
        assignedNode,
        previousNode: prevNode,
        moved,
      });
    }
  }

  const slices: HashRingNodeSlice[] = activeServers.map((nodeId, idx) => {
    const keyCount = counts.get(nodeId) || 0;
    const sharePercent = Number(((keyCount / safeKeys) * 100).toFixed(1));
    const vnodePositions = currentRing
      .filter((r) => r.nodeId === nodeId)
      .map((r) => r.angleDeg);

    return {
      nodeId,
      color: RING_NODE_COLORS[idx % RING_NODE_COLORS.length],
      vnodePositions,
      keyCount,
      sharePercent,
    };
  });

  const meanShare = 100 / activeServers.length;
  const variance =
    slices.reduce((acc, s) => acc + Math.pow(s.sharePercent - meanShare, 2), 0) / slices.length;
  const stdDevPercent = Number(Math.sqrt(variance).toFixed(2));
  const migrationPercentAfterRemoval = removeLastNode
    ? Number(((movedKeys / safeKeys) * 100).toFixed(1))
    : 0;

  return {
    mode,
    vnodesPerServer: safeVnodes,
    totalKeys: safeKeys,
    nodes: slices,
    stdDevPercent,
    migrationPercentAfterRemoval,
    removedNodeId,
    sampleKeys,
  };
}

/**
 * Deterministic Rate Limiter Packet Cannon trace comparing the 5 classic
 * algorithms across steady vs boundary-burst workloads.
 */
export function simulateRateLimiter(
  algorithm: RateLimitAlgorithm,
  capacity: number,
  refillPerTick: number,
  incomingPattern: number[]
): RateLimitSimulationResult {
  const cap = Math.max(1, capacity);
  const refill = Math.max(1, refillPerTick);

  let tokens = algorithm === "token_bucket" ? cap : 0;
  let leakyQueue = 0;
  let windowCount = 0;
  let prevWindowCount = 0;
  const logTimestamps: number[] = [];

  let allowedCount = 0;
  let rejected429Count = 0;
  let totalSent = 0;

  const ticks = incomingPattern.map((incomingRaw, tick) => {
    const incoming = Math.max(0, incomingRaw);
    totalSent += incoming;
    let allowed = 0;
    let rejected = 0;
    let bucketLevel = 0;

    if (algorithm === "token_bucket") {
      tokens = Math.min(cap, tokens + (tick === 0 ? 0 : refill));
      allowed = Math.min(incoming, tokens);
      rejected = incoming - allowed;
      tokens -= allowed;
      bucketLevel = tokens;
    } else if (algorithm === "leaky_bucket") {
      const space = cap - leakyQueue;
      allowed = Math.min(incoming, space);
      rejected = incoming - allowed;
      leakyQueue = Math.max(0, leakyQueue + allowed - refill);
      bucketLevel = leakyQueue;
    } else if (algorithm === "fixed_window") {
      if (tick > 0 && tick % 4 === 0) {
        windowCount = 0;
      }
      const remaining = Math.max(0, cap - windowCount);
      allowed = Math.min(incoming, remaining);
      rejected = incoming - allowed;
      windowCount += allowed;
      bucketLevel = windowCount;
    } else if (algorithm === "sliding_window_log") {
      const windowStart = tick - 3;
      while (logTimestamps.length > 0 && logTimestamps[0] < windowStart) {
        logTimestamps.shift();
      }
      const remaining = Math.max(0, cap - logTimestamps.length);
      allowed = Math.min(incoming, remaining);
      rejected = incoming - allowed;
      for (let i = 0; i < allowed; i++) logTimestamps.push(tick);
      bucketLevel = logTimestamps.length;
    } else {
      // sliding_window_counter
      const posInWindow = tick % 4;
      if (tick > 0 && posInWindow === 0) {
        prevWindowCount = windowCount;
        windowCount = 0;
      }
      const prevWeight = (4 - posInWindow) / 4;
      const estimatedUsed = Math.floor(prevWindowCount * prevWeight) + windowCount;
      const remaining = Math.max(0, cap - estimatedUsed);
      allowed = Math.min(incoming, remaining);
      rejected = incoming - allowed;
      windowCount += allowed;
      bucketLevel = estimatedUsed + allowed;
    }

    allowedCount += allowed;
    rejected429Count += rejected;

    return { tick, incoming, allowed, rejected, bucketLevel };
  });

  const boundaryBurstVulnerable = algorithm === "fixed_window";
  const summaryMap: Record<RateLimitAlgorithm, string> = {
    token_bucket: "Allows controlled bursts up to bucket capacity while enforcing long-term average rate.",
    leaky_bucket: "Smooths erratic traffic bursts into a constant, predictable downstream processing rate.",
    fixed_window: "Low memory, but susceptible to 2x boundary-edge spikes right before/after window resets.",
    sliding_window_log: "Exact sliding rate enforcement with zero boundary leaks, at the cost of storing timestamps.",
    sliding_window_counter: "Memory-efficient hybrid approximation using weighted overlap of previous & current counters.",
  };

  return {
    algorithm,
    totalSent,
    allowedCount,
    rejected429Count,
    ticks,
    boundaryBurstVulnerable,
    summaryNote: summaryMap[algorithm],
  };
}

/**
 * Deterministic Dynamo-style Quorum (W + R > N) and CAP Split-Brain simulator.
 */
export function simulateQuorum(
  n: number,
  w: number,
  r: number,
  partitioned: boolean
): QuorumSimulationResult {
  const safeN = Math.max(1, Math.min(7, n));
  const safeW = Math.max(1, Math.min(safeN, w));
  const safeR = Math.max(1, Math.min(safeN, r));
  const strictQuorum = safeW + safeR > safeN;

  // When partitioned, split replicas into majority Partition A and minority Partition B
  const groupASize = partitioned ? Math.ceil(safeN / 2) : safeN;

  const writeSucceeded = groupASize >= safeW;
  const replicas = Array.from({ length: safeN }, (_, idx) => {
    const partitionGroup: "A" | "B" = idx < groupASize ? "A" : "B";
    const canWriteHere = writeSucceeded && idx < safeW;
    return {
      id: idx + 1,
      partitionGroup,
      version: canWriteHere ? 2 : 1,
      participatedInWrite: canWriteHere,
      participatedInRead: false,
    };
  });

  // Read targets try from Group B (worst-case stale client landing on minority) first if partitioned, else Group A
  const readPool = partitioned
    ? [...replicas.filter((rep) => rep.partitionGroup === "B"), ...replicas.filter((rep) => rep.partitionGroup === "A")]
    : replicas;

  // Under a real network partition, a client trapped on minority side B can only reach Group B nodes!
  const reachableForMinorityClient = partitioned
    ? replicas.filter((rep) => rep.partitionGroup === "B")
    : [...replicas].sort((a, b) => a.version - b.version);

  const readSucceeded = reachableForMinorityClient.length >= safeR;
  let maxVersionSeen = 1;
  if (readSucceeded) {
    for (let i = 0; i < safeR; i++) {
      const target = reachableForMinorityClient[i] || readPool[i];
      if (target) {
        target.participatedInRead = true;
        maxVersionSeen = Math.max(maxVersionSeen, target.version);
      }
    }
  }

  const staleReadOccurred = writeSucceeded && readSucceeded && maxVersionSeen < 2;

  let capClassification: QuorumSimulationResult["capClassification"] =
    "CA-like (Wait/Unavailable)";
  if (partitioned) {
    capClassification =
      strictQuorum && !readSucceeded
        ? "CP (Consistent under Partition)"
        : "AP (Available, Stale Risk)";
  } else {
    capClassification = strictQuorum
      ? "CP (Consistent under Partition)"
      : "AP (Available, Stale Risk)";
  }

  let explanation = "";
  if (partitioned && strictQuorum && !readSucceeded) {
    explanation = `Partition active: Group A accepted Write v2 (size ${groupASize} >= W=${safeW}), while minority Group B rejected the Read (size ${safeN - groupASize} < R=${safeR}) to strictly guarantee zero stale reads (CP).`;
  } else if (staleReadOccurred) {
    explanation = `Stale read detected! Because W (${safeW}) + R (${safeR}) <= N (${safeN}), read nodes did not overlap with the v2 write quorum and returned outdated v1.`;
  } else if (writeSucceeded && (partitioned ? readSucceeded : true)) {
    explanation = `Overlap invariant satisfied (W=${safeW} + R=${safeR} > N=${safeN}). At least 1 read replica holds the latest v2 state.`;
  } else {
    explanation = `Write failed on majority partition because W (${safeW}) exceeds available Group A nodes (${groupASize}).`;
  }

  return {
    n: safeN,
    w: safeW,
    r: safeR,
    strictQuorum,
    partitioned,
    writeSucceeded,
    readSucceeded: partitioned ? readSucceeded : true,
    staleReadOccurred,
    capClassification,
    replicas,
    explanation,
  };
}

/**
 * Deterministic Cache Strategy + LRU/LFU Eviction trace simulator.
 */
export function simulateCacheStrategy(
  strategy: CacheStrategyType,
  eviction: CacheEvictionType,
  cacheCapacity: number,
  ops: Array<{ op: "READ" | "WRITE"; key: string }>
): CacheSimulationResult {
  const cap = Math.max(2, Math.min(6, cacheCapacity));
  const dbStore = new Map<string, number>([
    ["A", 1],
    ["B", 1],
    ["C", 1],
    ["D", 1],
  ]);

  interface SlotEntry {
    key: string;
    valueVersion: number;
    freq: number;
    lastUsedStep: number;
    dirty: boolean;
  }

  const cache = new Map<string, SlotEntry>();
  let hitCount = 0;
  let missCount = 0;
  let dbReads = 0;
  let dbWrites = 0;
  let totalLatency = 0;

  const evictIfNeeded = (): string | undefined => {
    if (cache.size < cap) return undefined;
    const entries = Array.from(cache.values());
    entries.sort((a, b) => {
      if (eviction === "LFU") {
        if (a.freq !== b.freq) return a.freq - b.freq;
        return a.lastUsedStep - b.lastUsedStep;
      }
      return a.lastUsedStep - b.lastUsedStep;
    });
    const victim = entries[0];
    if (victim) {
      if (victim.dirty) dbWrites++; // write-behind flush on eviction
      cache.delete(victim.key);
      return victim.key;
    }
    return undefined;
  };

  const trace: CacheSimulationResult["trace"] = [];

  ops.forEach((item, idx) => {
    const step = idx + 1;
    const existing = cache.get(item.key);

    if (item.op === "READ") {
      if (existing) {
        hitCount++;
        existing.freq++;
        existing.lastUsedStep = step;
        const lat = 2;
        totalLatency += lat;
        trace.push({ step, op: "READ", key: item.key, outcome: "CACHE_HIT", latencyMs: lat });
      } else {
        missCount++;
        dbReads++;
        const dbVal = dbStore.get(item.key) || 1;
        const evictedKey = evictIfNeeded();
        cache.set(item.key, {
          key: item.key,
          valueVersion: dbVal,
          freq: 1,
          lastUsedStep: step,
          dirty: false,
        });
        const lat = 28;
        totalLatency += lat;
        trace.push({
          step,
          op: "READ",
          key: item.key,
          outcome: "CACHE_MISS",
          latencyMs: lat,
          evictedKey,
        });
      }
    } else {
      const nextVer = (dbStore.get(item.key) || 0) + 1;
      if (strategy === "write_behind") {
        const evictedKey = existing ? undefined : evictIfNeeded();
        cache.set(item.key, {
          key: item.key,
          valueVersion: nextVer,
          freq: (existing?.freq || 0) + 1,
          lastUsedStep: step,
          dirty: true,
        });
        const lat = 3;
        totalLatency += lat;
        trace.push({
          step,
          op: "WRITE",
          key: item.key,
          outcome: "ASYNC_BUFFER",
          latencyMs: lat,
          evictedKey,
        });
      } else if (strategy === "write_around" || strategy === "cache_aside") {
        dbStore.set(item.key, nextVer);
        dbWrites++;
        if (strategy === "cache_aside") {
          cache.delete(item.key); // invalidate cache on write
        }
        const lat = 24;
        totalLatency += lat;
        trace.push({
          step,
          op: "WRITE",
          key: item.key,
          outcome: "BYPASS_WRITE",
          latencyMs: lat,
        });
      } else {
        // write_through / read_through sync
        dbStore.set(item.key, nextVer);
        dbWrites++;
        const evictedKey = existing ? undefined : evictIfNeeded();
        cache.set(item.key, {
          key: item.key,
          valueVersion: nextVer,
          freq: (existing?.freq || 0) + 1,
          lastUsedStep: step,
          dirty: false,
        });
        const lat = 26;
        totalLatency += lat;
        trace.push({
          step,
          op: "WRITE",
          key: item.key,
          outcome: "SYNC_WRITE",
          latencyMs: lat,
          evictedKey,
        });
      }
    }
  });

  const totalReads = hitCount + missCount;
  const hitRatePercent = totalReads > 0 ? Number(((hitCount / totalReads) * 100).toFixed(1)) : 0;
  const avgLatencyMs = ops.length > 0 ? Number((totalLatency / ops.length).toFixed(1)) : 0;

  let staleWindowRisk: CacheSimulationResult["staleWindowRisk"] = "None";
  if (strategy === "write_behind") staleWindowRisk = "High (Crash Data-Loss Risk)";
  else if (strategy === "write_around") staleWindowRisk = "Medium (First-Read Miss)";
  else if (strategy === "cache_aside") staleWindowRisk = "Low";

  return {
    strategy,
    eviction,
    cacheCapacity: cap,
    hitCount,
    missCount,
    hitRatePercent,
    dbReads,
    dbWrites,
    avgLatencyMs,
    staleWindowRisk,
    finalSlots: Array.from(cache.values()).map(({ key, valueVersion, freq, dirty }) => ({
      key,
      valueVersion,
      freq,
      dirty,
    })),
    trace,
  };
}

/**
 * Deterministic Retry Storm, Exponential Backoff + Full Jitter, and Circuit Breaker simulator.
 */
export function simulateRetryStorm(
  concurrentWorkers: number,
  strategy: RetryStrategyType
): RetryStormSimulationResult {
  const workers = Math.max(10, Math.min(200, concurrentWorkers));
  const timeline: RetryStormSimulationResult["timeline"] = [];

  let totalGeneratedRequests = 0;
  let peakLoad = 0;
  let circuitTrippedAtTick: number | undefined;

  for (let tick = 0; tick < 12; tick++) {
    // Transient downstream hiccup spans ticks 2..4
    const downstreamHealthyBase = tick >= 2 && tick <= 4 ? 35 : 95;
    let incoming = workers;
    let circuitState: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

    if (tick >= 2) {
      if (strategy === "immediate") {
        // Immediate infinite-like retries cause 4.5x thundering herd meltdown
        const amplification = tick <= 9 ? 4.5 : 3.2;
        incoming = Math.round(workers * amplification);
      } else if (strategy === "fixed_backoff") {
        // Fixed synchronized waves at ticks 3, 5, 7
        incoming = tick % 2 === 1 && tick <= 8 ? Math.round(workers * 3.0) : Math.round(workers * 1.4);
      } else if (strategy === "exp_backoff_jitter") {
        // Jitter spreads load smoothly across ticks; bounded at 1.45x peak
        incoming = tick >= 2 && tick <= 6 ? Math.round(workers * 1.35) : workers;
      } else {
        // circuit_breaker_jitter
        if (tick === 3) {
          circuitState = "OPEN";
          circuitTrippedAtTick = 3;
          incoming = Math.round(workers * 0.15); // Fail fast locally
        } else if (tick >= 4 && tick <= 6) {
          circuitState = "OPEN";
          incoming = Math.round(workers * 0.1);
        } else if (tick === 7) {
          circuitState = "HALF_OPEN";
          incoming = Math.round(workers * 0.35);
        } else {
          circuitState = "CLOSED";
          incoming = workers;
        }
      }
    }

    const overloadPenalty = incoming > workers * 2.2 ? (incoming - workers * 2.2) / 2.2 : 0;
    const downstreamHealthPercent = Math.max(
      5,
      Math.min(100, Math.round(downstreamHealthyBase - overloadPenalty * 14))
    );

    totalGeneratedRequests += incoming;
    peakLoad = Math.max(peakLoad, incoming);

    timeline.push({
      tick,
      downstreamHealthPercent,
      incomingRequests: incoming,
      circuitState,
    });
  }

  const finalHealth = timeline[timeline.length - 1]?.downstreamHealthPercent || 0;
  return {
    strategy,
    concurrentWorkers: workers,
    totalGeneratedRequests,
    peakLoadMultiplier: Number((peakLoad / workers).toFixed(2)),
    downstreamRecovered: finalHealth >= 85,
    circuitTrippedAtTick,
    timeline,
  };
}
