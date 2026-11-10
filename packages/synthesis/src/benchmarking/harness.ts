import {
  ArchSpec,
  ArchitectureAlternative,
} from "@archbench/archspec";
import { ArchitectureGraph } from "@archbench/graph-engine";
import { evaluateArchitecture } from "@archbench/archeval";
import yaml from "yaml";
import {
  SystemDesignBrief,
  CandidateBenchmarkMetrics,
  SynthesizedAlternative,
  ArchitecturalVerdict,
  SynthesisResult,
} from "../types.js";

function calculateAlternativeMetrics(
  alt: ArchitectureAlternative,
  graph: ArchitectureGraph,
  brief: SystemDesignBrief,
  healthScore: number,
  passed: boolean
): CandidateBenchmarkMetrics {
  const spofs = graph.findSinglePointsOfFailure();
  const spofCount = spofs.length;

  let deployableCount = 0;
  let statefulStoreCount = 0;
  let estimatedCost = 60; // base cloud VPC / DNS / egress

  for (const comp of alt.components) {
    const type = comp.type || "service";
    const replicas = comp.deployment?.replicas || 1;

    if (type === "service" || type === "background_worker" || type === "api_gateway") {
      deployableCount++;
      estimatedCost += replicas * 35;
    } else if (
      type === "relational_database" ||
      type === "document_database" ||
      type === "key_value_store"
    ) {
      statefulStoreCount++;
      estimatedCost += replicas * 160;
    } else if (type === "cache") {
      statefulStoreCount++;
      estimatedCost += replicas * 75;
    } else if (type === "message_queue" || type === "event_stream") {
      statefulStoreCount++;
      estimatedCost += replicas * 120;
    } else {
      estimatedCost += replicas * 40;
    }
  }

  // Archetype-driven performance projections
  let maxThroughputRps = brief.scaleTargets.peakRps;
  let latencySurgeP99Ms = brief.scaleTargets.p99LatencyMs;
  let queueDrainSeconds = 10;
  let cognitiveComplexity: "Low" | "Moderate" | "High" | "Extreme" = "Moderate";

  if (alt.id.includes("monolith")) {
    maxThroughputRps = Math.min(3500, Math.round(brief.scaleTargets.peakRps * 1.2));
    latencySurgeP99Ms = Math.max(180, brief.scaleTargets.p99LatencyMs * 3.5);
    queueDrainSeconds = 95;
    cognitiveComplexity = "Low";
  } else if (alt.id.includes("saga") || alt.id.includes("event")) {
    maxThroughputRps = Math.max(8000, Math.round(brief.scaleTargets.peakRps * 2.8));
    latencySurgeP99Ms = Math.max(35, Math.round(brief.scaleTargets.p99LatencyMs * 1.15));
    queueDrainSeconds = 8;
    cognitiveComplexity = "Moderate";
  } else if (alt.id.includes("partition") || alt.id.includes("cluster") || alt.id.includes("stream")) {
    maxThroughputRps = Math.max(35000, Math.round(brief.scaleTargets.peakRps * 6.5));
    latencySurgeP99Ms = Math.max(12, Math.round(brief.scaleTargets.p99LatencyMs * 0.75));
    queueDrainSeconds = 2;
    cognitiveComplexity = alt.components.length > 8 ? "Extreme" : "High";
  }

  let status: "passed" | "risks" | "failed" = "passed";
  if (!passed || healthScore < 70) {
    status = "failed";
  } else if (healthScore < 90 || spofCount > 0) {
    status = "risks";
  }

  return {
    healthScore,
    status,
    maxThroughputRps,
    latencySurgeP99Ms,
    queueDrainSeconds,
    singlePointsOfFailureCount: spofCount,
    componentCount: alt.components.length,
    deployableCount,
    statefulStoreCount,
    estimatedMonthlyCostUsd: Math.round(estimatedCost),
    cognitiveComplexity,
  };
}

function synthesizeVerdict(
  brief: SystemDesignBrief,
  alternatives: SynthesizedAlternative[]
): ArchitecturalVerdict {
  const peakRps = brief.scaleTargets.peakRps;
  const budget = brief.constraints.budgetMonthlyUsd || 2500;
  const teamSize = brief.constraints.teamSize || 6;
  const avail = brief.scaleTargets.availabilityPercent;

  let recommendedId = "decoupled-event-sagas";
  let title = "Decoupled Event-Driven Sagas (Recommended Default)";
  let justification =
    "Optimal balance between horizontal scale, fault isolation, and cognitive load. The transactional outbox pattern guarantees zero dual-write loss while keeping latency low during traffic surges.";

  if (peakRps <= 2500 && (budget < 800 || teamSize <= 4)) {
    recommendedId = "lean-modular-monolith";
    title = "Lean Modular Monolith (Budget & Team Optimized)";
    justification = `Given team size (${teamSize} engineers) and initial target traffic (${peakRps.toLocaleString()} RPS), a distributed architecture introduces unnecessary cognitive and operational overhead. The modular monolith with read caching minimizes MTTR and operational costs.`;
  } else if (peakRps >= 15000 || avail >= 99.99 || brief.scaleTargets.p99LatencyMs <= 20) {
    recommendedId = "distributed-partitioned-cluster";
    title = "Distributed Partitioned Cluster (Extreme Scale & Ultra-Low Latency)";
    justification = `With ${peakRps.toLocaleString()} RPS peak throughput and high availability (${avail}%), asynchronous CQRS with partitioned Kafka streams and memory-optimized read replicas is required to prevent database write lock saturation.`;
  }

  const alt = alternatives.find((a) => a.id === recommendedId) || alternatives[0];

  return {
    recommendedAlternativeId: alt.id,
    recommendationTitle: title,
    justification,
    keyTradeOffs: [
      `Write-path durability vs ingest latency: Outbox queues buffer peak bursts without blocking clients.`,
      `Team velocity vs operational surface: ${alt.metrics.deployableCount} independent deployables with \$${alt.metrics.estimatedMonthlyCostUsd}/mo estimated cloud spend.`,
      `Consistency boundary: Read projections trade strict serializability for sub-${alt.metrics.latencySurgeP99Ms}ms latency under load.`,
    ],
    evolutionTriggers: [
      {
        metric: "Peak Ingestion Throughput",
        threshold: `> ${Math.round(alt.metrics.maxThroughputRps * 0.85).toLocaleString()} RPS sustained`,
        action: "Partition write-path ingress into autonomous regional Kafka broker partitions.",
      },
      {
        metric: "P99 Read Query Latency",
        threshold: `> ${Math.round(brief.scaleTargets.p99LatencyMs * 1.5)}ms for > 5 consecutive minutes`,
        action: "Add distributed Redis read replica sharding or switch to ScyllaDB denormalized views.",
      },
      {
        metric: "Engineering Team Growth",
        threshold: "> 12 active backend contributors",
        action: "Decompose internal domain modules into dedicated microservices with autonomous CI/CD pipelines.",
      },
    ],
  };
}

export function benchmarkSynthesizedAlternatives(
  brief: SystemDesignBrief,
  normalized: { requirements: any[]; assumptions: any[]; constraints: any[] },
  rawAlternatives: ArchitectureAlternative[]
): SynthesisResult {
  const projectName = brief.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");

  const fullArchSpec: ArchSpec = {
    archbench: {
      spec_version: "0.1",
      project: projectName,
      description: brief.description,
      authors: ["ArchBench Dynamic Synthesis Engine"],
    },
    system: {
      context: {
        users: [
          {
            id: "client-user",
            name: `${brief.name} Clients`,
            description: `End users and web/mobile apps interacting with ${brief.name}.`,
          },
        ],
        external_systems: [
          {
            id: "external-gateway",
            name: "Cloud Edge & External Services",
            category: "external_provider",
            description: "Upstream CDN, identity providers, and third-party APIs.",
          },
        ],
      },
      requirements: normalized.requirements,
      constraints: normalized.constraints,
      assumptions: normalized.assumptions,
    },
    architecture: {
      alternatives: rawAlternatives,
    },
  };

  const graphs = new Map<string, ArchitectureGraph>();
  for (const alt of rawAlternatives) {
    const graph = new ArchitectureGraph(alt, fullArchSpec.system?.context);
    graphs.set(alt.id, graph);
  }

  // Run ArchEval evaluation across all alternatives
  const evaluation = evaluateArchitecture(fullArchSpec, fullArchSpec, graphs);

  const alternatives: SynthesizedAlternative[] = rawAlternatives.map((alt) => {
    const graph = graphs.get(alt.id)!;
    const evalResult = evaluation.alternatives[alt.id];
    const score = evalResult?.score ?? 85;
    const passed = evalResult?.passed ?? true;

    const metrics = calculateAlternativeMetrics(alt, graph, brief, score, passed);

    let archetype: SynthesizedAlternative["archetype"] = "event_driven_sagas";
    if (alt.id.includes("monolith")) archetype = "modular_monolith";
    else if (alt.id.includes("partition") || alt.id.includes("cluster"))
      archetype = "distributed_microservices";

    return {
      id: alt.id,
      name: alt.name,
      archetype,
      description: alt.description || "",
      keyDecisions: (alt.decisions || []).map((d) => d.title),
      specAlternative: alt,
      metrics,
    };
  });

  const verdict = synthesizeVerdict(brief, alternatives);
  const fullArchSpecYaml = yaml.stringify(fullArchSpec);

  return {
    brief,
    normalizedRequirements: normalized.requirements,
    assumptions: normalized.assumptions,
    alternatives,
    verdict,
    fullArchSpecYaml,
    fullArchSpec,
  };
}
