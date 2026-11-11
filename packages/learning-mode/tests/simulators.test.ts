import { describe, expect, it } from "vitest";
import {
  calculateCapacityEstimates,
  simulateCacheStrategy,
  simulateConsistentHashRing,
  simulateQuorum,
  simulateRateLimiter,
  simulateRetryStorm,
} from "../src/simulators/index.js";

describe("Interactive Simulator Pure Math Engines", () => {
  it("computes consistent Back-of-the-Envelope capacity estimates", () => {
    const res = calculateCapacityEstimates({
      dailyActiveUsers: 100_000_000,
      actionsPerUserPerDay: 5,
      readToWriteRatio: 100,
      payloadSizeKb: 0.5,
      retentionYears: 5,
      peakMultiplier: 3,
      replicationFactor: 3,
      cacheHotSetPercent: 20,
    });

    expect(res.totalDailyRequests).toBe(500_000_000);
    expect(res.avgRps).toBeGreaterThan(5500);
    expect(res.peakRps).toBeCloseTo(res.avgRps * 3, 0);
    expect(res.readQps).toBeGreaterThan(res.writeQps * 50);
    expect(res.replicatedStorageTb).toBeCloseTo(res.retentionStorageTb * 3, 1);
    expect(res.estimatedAppServers).toBeGreaterThanOrEqual(1);
    expect(res.recommendedArchetype.length).toBeGreaterThan(0);
  });

  it("shows dramatic key-movement advantage of consistent hashing + vnodes over modulo hashing", () => {
    const modulo = simulateConsistentHashRing(4, 1, 200, "modulo", true);
    const consistent = simulateConsistentHashRing(4, 150, 200, "consistent", true);

    expect(consistent.nodes.length).toBe(3);
    expect(consistent.removedNodeId).toBe("Node-D");
    expect(modulo.migrationPercentAfterRemoval).toBeGreaterThan(50);
    expect(consistent.migrationPercentAfterRemoval).toBeLessThan(40);
    expect(consistent.stdDevPercent).toBeLessThan(15);
  });

  it("distinguishes fixed_window boundary burst vulnerability from token_bucket", () => {
    const pattern = [10, 0, 0, 10, 10, 0];
    const fixed = simulateRateLimiter("fixed_window", 10, 2, pattern);
    const bucket = simulateRateLimiter("token_bucket", 10, 2, pattern);

    expect(fixed.boundaryBurstVulnerable).toBe(true);
    expect(bucket.boundaryBurstVulnerable).toBe(false);
    expect(bucket.totalSent).toBe(30);
    expect(bucket.allowedCount + bucket.rejected429Count).toBe(30);
  });

  it("enforces strict Quorum W + R > N vs stale read risk when W + R <= N", () => {
    const strict = simulateQuorum(5, 3, 3, false);
    expect(strict.strictQuorum).toBe(true);
    expect(strict.staleReadOccurred).toBe(false);
    expect(strict.capClassification).toContain("CP");

    const stale = simulateQuorum(5, 2, 2, false);
    expect(stale.strictQuorum).toBe(false);
    expect(stale.staleReadOccurred).toBe(true);
    expect(stale.capClassification).toContain("AP");

    const partitioned = simulateQuorum(5, 4, 3, true);
    expect(partitioned.writeSucceeded).toBe(false);
  });

  it("simulates LRU vs LFU caching strategies and tracks write-behind crash risk", () => {
    const ops: Array<{ op: "READ" | "WRITE"; key: string }> = [
      { op: "WRITE", key: "k1" },
      { op: "READ", key: "k1" },
      { op: "READ", key: "k2" },
      { op: "READ", key: "k1" },
      { op: "READ", key: "k3" },
      { op: "READ", key: "k1" },
    ];
    const cacheAside = simulateCacheStrategy("cache_aside", "LRU", 2, ops);
    const writeThrough = simulateCacheStrategy("write_through", "LRU", 2, ops);
    const writeBehind = simulateCacheStrategy("write_behind", "LFU", 2, ops);

    expect(cacheAside.hitRatePercent).toBeGreaterThan(0);
    expect(cacheAside.staleWindowRisk).toBe("Low");
    expect(writeThrough.staleWindowRisk).toBe("None");
    expect(writeBehind.staleWindowRisk).toContain("High");
    expect(writeBehind.finalSlots.length).toBeLessThanOrEqual(2);
  });

  it("models immediate retry storm collapse vs circuit breaker + jitter recovery", () => {
    const immediate = simulateRetryStorm(50, "immediate");
    const protectedRun = simulateRetryStorm(50, "circuit_breaker_jitter");

    expect(immediate.totalGeneratedRequests).toBeGreaterThan(
      protectedRun.totalGeneratedRequests
    );
    expect(immediate.downstreamRecovered).toBe(false);
    expect(protectedRun.downstreamRecovered).toBe(true);
    expect(protectedRun.circuitTrippedAtTick).toBeDefined();
  });
});
