import { SystemDesignBrief } from "../types.js";
import { normalizeBrief } from "../intake/normalizer.js";

function sanitizeId(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
}

export function synthesizeHeuristicAlternatives(brief: SystemDesignBrief) {
  const normalized = normalizeBrief(brief);
  const baseName = sanitizeId(brief.name);
  const lang = brief.constraints.preferredLanguages?.[0] || "Go";
  const secondaryLang = brief.constraints.preferredLanguages?.[1] || "TypeScript";

  const reqIds = normalized.requirements.map((r) => r.id);
  const primaryReq = reqIds[0] || "REQ-FUNC-001";
  const secondReq = reqIds[1] || primaryReq;

  // --------------------------------------------------------------------------
  // Alternative 1: Lean Modular Monolith
  // --------------------------------------------------------------------------
  const alt1 = {
    id: "lean-modular-monolith",
    name: "Lean Modular Monolith with Read-Replica Cache",
    description: `Unified high-cohesion deployable application with internal domain boundaries, PostgreSQL relational persistence, and Redis read caching. Optimized for rapid delivery and low operational footprint for a team of ${brief.constraints.teamSize || 5}.`,
    components: [
      {
        id: `${baseName}-monolith-app`,
        name: `${brief.name} Core Application`,
        type: "service",
        technology: `${lang} / HTTP Router`,
        responsibility: "Serves all client HTTP/gRPC traffic, enforces validation, and executes domain business logic.",
        requirements: reqIds,
        deployment: {
          replicas: 2,
          platform: "Managed Container Service",
        },
      },
      {
        id: `${baseName}-primary-db`,
        name: `${brief.name} PostgreSQL Primary Database`,
        type: "relational_database",
        technology: "PostgreSQL 16 Multi-AZ",
        responsibility: "Authoritative ACID relational store for accounts, entities, and state mutations.",
        requirements: [primaryReq, "NFR-AVAIL-001"],
        deployment: {
          replicas: 2,
          platform: "PostgreSQL Multi-AZ",
        },
        data: {
          ownership: `${baseName}-core-domain`,
          storage_type: "ssd",
          retention: "90d",
          backup_frequency: "daily",
        },
      },
      {
        id: `${baseName}-read-cache`,
        name: `${brief.name} Redis Read Cache`,
        type: "cache",
        technology: "Redis 7 Cluster",
        responsibility: `Caches high-frequency read queries to satisfy P99 latency SLA (< ${brief.scaleTargets.p99LatencyMs}ms).`,
        requirements: ["NFR-LATENCY-001"],
        deployment: {
          replicas: 2,
          platform: "Redis Cluster",
        },
        data: {
          ownership: `${baseName}-cache-domain`,
          retention: "1h",
        },
      },
    ],
    connections: [
      {
        id: "conn-app-to-cache",
        from: `${baseName}-monolith-app`,
        to: `${baseName}-read-cache`,
        protocol: "synchronous",
        transport: "tcp",
        purpose: "Query hot cached state before database fallback.",
        timeout_ms: 15,
        retry_policy: { max_attempts: 2, backoff: "exponential" },
      },
      {
        id: "conn-app-to-db",
        from: `${baseName}-monolith-app`,
        to: `${baseName}-primary-db`,
        protocol: "synchronous",
        transport: "tcp",
        purpose: "Persist transactional state mutations with serializable isolation.",
        timeout_ms: 50,
        retry_policy: { max_attempts: 3, backoff: "exponential" },
      },
    ],
    decisions: [
      {
        id: "ADR-001",
        title: "Adopt Single Deployable Modular Monolith",
        status: "accepted",
        context: `Current scale of ${brief.scaleTargets.peakRps} RPS and team size of ${brief.constraints.teamSize || 5} favors minimal operational complexity over distributed microservices.`,
        choice: "Single deployable monolith with modular package encapsulation and PostgreSQL.",
        consequences: [
          "Eliminates network serialization and distributed transaction failures.",
          "Vertical scaling required for sudden bursts.",
        ],
      },
    ],
  };

  // --------------------------------------------------------------------------
  // Alternative 2: Decoupled Event-Driven Sagas
  // --------------------------------------------------------------------------
  const alt2 = {
    id: "event-driven-sagas",
    name: "Decoupled Asynchronous Saga Architecture",
    description: "Stateless Ingress API decoupled from background worker pools via transactional message queues and dead-letter topics. Provides zero-data-loss durability under traffic surges.",
    components: [
      {
        id: `${baseName}-api-gateway`,
        name: `${brief.name} Ingress Gateway`,
        type: "api_gateway",
        technology: "Envoy / Cloud Gateway",
        responsibility: "SSL termination, rate limiting, and request routing.",
        requirements: ["NFR-AVAIL-001", "NFR-THROUGHPUT-001"],
        deployment: {
          replicas: 3,
          platform: "Managed Edge Gateway",
        },
      },
      {
        id: `${baseName}-ingress-api`,
        name: `${brief.name} Stateless Ingress Service`,
        type: "service",
        technology: `${lang} / High-Performance Microservice`,
        responsibility: "Accepts incoming commands, writes to outbox table, and responds immediately.",
        requirements: [primaryReq, "NFR-LATENCY-001"],
        deployment: {
          replicas: 4,
          platform: "Managed Kubernetes",
        },
        behavior: {
          idempotent: true,
          idempotency_key: "request_id",
        },
      },
      {
        id: `${baseName}-transactional-db`,
        name: `${brief.name} Transactional Database`,
        type: "relational_database",
        technology: "PostgreSQL 16 with Outbox Pattern",
        responsibility: "Atomic state mutations and transactional outbox event storage.",
        requirements: [primaryReq],
        deployment: {
          replicas: 2,
          platform: "PostgreSQL Multi-AZ",
        },
        data: {
          ownership: `${baseName}-transactional-domain`,
          storage_type: "ssd",
          retention: "90d",
          backup_frequency: "daily",
        },
      },
      {
        id: `${baseName}-work-queue`,
        name: `${brief.name} Work Dispatch Queue`,
        type: "message_queue",
        technology: "RabbitMQ / Amazon SQS",
        responsibility: `Buffers asynchronous execution tasks during surges (up to ${brief.scaleTargets.peakRps * 2} RPS).`,
        requirements: [secondReq, "NFR-THROUGHPUT-001"],
        messaging: {
          delivery_semantics: "at_least_once",
          overload_policy: "bounded_backlog_with_cloudwatch_alarm",
          retention_period: "4d",
        },
      },
      {
        id: `${baseName}-dead-letter-queue`,
        name: `${brief.name} Dead Letter Queue (DLQ)`,
        type: "message_queue",
        technology: "RabbitMQ DLQ / SQS DLQ",
        responsibility: "Isolates poison-pill messages and exhausted retry jobs for manual inspection.",
        requirements: [secondReq],
        messaging: {
          delivery_semantics: "at_least_once",
          overload_policy: "alert_on_message_present",
          retention_period: "14d",
        },
      },
      {
        id: `${baseName}-async-worker`,
        name: `${brief.name} Dispatch & Processing Worker Pool`,
        type: "background_worker",
        technology: `${secondaryLang} Worker Pool`,
        responsibility: "Consumes messages, updates transactional database, and calls downstream providers.",
        requirements: reqIds,
        deployment: {
          replicas: 4,
          platform: "Managed Kubernetes",
        },
        behavior: {
          idempotent: true,
          idempotency_key: "job_id",
          retry_policy: {
            max_attempts: 5,
            backoff: "exponential",
            dead_letter_target: `${baseName}-dead-letter-queue`,
          },
        },
      },
    ],
    connections: [
      {
        id: "conn-gw-to-api",
        from: `${baseName}-api-gateway`,
        to: `${baseName}-ingress-api`,
        protocol: "synchronous",
        transport: "https",
        purpose: "Route incoming client requests to stateless API instances.",
        timeout_ms: 100,
        retry_policy: { max_attempts: 2, backoff: "exponential" },
      },
      {
        id: "conn-api-to-db",
        from: `${baseName}-ingress-api`,
        to: `${baseName}-transactional-db`,
        protocol: "synchronous",
        transport: "tcp",
        purpose: "Execute local ACID transaction recording entity and outbox message.",
        timeout_ms: 40,
        retry_policy: { max_attempts: 3, backoff: "exponential" },
      },
      {
        id: "conn-api-to-queue",
        from: `${baseName}-ingress-api`,
        to: `${baseName}-work-queue`,
        protocol: "asynchronous",
        transport: "amqp",
        purpose: "Publish transactional outbox jobs to worker queue.",
        timeout_ms: 25,
      },
      {
        id: "conn-queue-to-worker",
        from: `${baseName}-work-queue`,
        to: `${baseName}-async-worker`,
        protocol: "asynchronous",
        transport: "amqp",
        purpose: "Dispatch pending work to background worker pool.",
      },
      {
        id: "conn-worker-to-db",
        from: `${baseName}-async-worker`,
        to: `${baseName}-transactional-db`,
        protocol: "synchronous",
        transport: "tcp",
        purpose: "Update task state upon successful worker processing.",
        timeout_ms: 40,
        retry_policy: { max_attempts: 3, backoff: "exponential" },
      },
      {
        id: "conn-worker-to-dlq",
        from: `${baseName}-async-worker`,
        to: `${baseName}-dead-letter-queue`,
        protocol: "asynchronous",
        transport: "amqp",
        purpose: "Route failed jobs exceeding max retry attempts to dead-letter queue.",
      },
    ],
    decisions: [
      {
        id: "ADR-001",
        title: "Transactional Outbox with Asynchronous Worker Pools",
        status: "accepted",
        context: "Downstream third-party latencies and sudden traffic spikes must not degrade API response times.",
        choice: "Decouple API ingress from processing via queues with bounded retries and dead-letter routing.",
        consequences: [
          "Ensures sub-50ms API response and zero data loss.",
          "Requires managing worker consumer lag and Dead Letter Queue monitoring.",
        ],
      },
    ],
  };

  // --------------------------------------------------------------------------
  // Alternative 3: Distributed Partitioned Cluster
  // --------------------------------------------------------------------------
  const alt3 = {
    id: "distributed-partitioned-cluster",
    name: "Distributed Partitioned Event Streaming Cluster",
    description: `High-throughput distributed event streaming platform with partitioned topics (Kafka), CQRS read-model caching, and independent horizontal autoscaling. Tailored for extreme scale (> 50,000 RPS).`,
    components: [
      {
        id: `${baseName}-edge-proxy`,
        name: `${brief.name} Edge Cloud Proxy`,
        type: "api_gateway",
        technology: "Global CDN / Anycast Gateway",
        responsibility: "DDoS mitigation, edge SSL termination, and geo-routing.",
        requirements: ["NFR-AVAIL-001"],
        deployment: {
          replicas: 4,
          platform: "Global Edge Anycast",
        },
      },
      {
        id: `${baseName}-command-service`,
        name: `${brief.name} Write Command Ingress Service`,
        type: "service",
        technology: `${lang} / gRPC`,
        responsibility: "Validates commands and streams events to distributed partitioned log.",
        requirements: [primaryReq, "NFR-THROUGHPUT-001"],
        deployment: {
          replicas: 6,
          platform: "Managed Kubernetes",
        },
        behavior: {
          idempotent: true,
          idempotency_key: "command_id",
        },
      },
      {
        id: `${baseName}-query-service`,
        name: `${brief.name} Read Query Service`,
        type: "service",
        technology: `${lang} / Fast HTTP`,
        responsibility: `Serves high-velocity read queries with P99 < ${brief.scaleTargets.p99LatencyMs}ms.`,
        requirements: ["NFR-LATENCY-001"],
        deployment: {
          replicas: 6,
          platform: "Managed Kubernetes",
        },
      },
      {
        id: `${baseName}-event-stream`,
        name: `${brief.name} Partitioned Event Stream`,
        type: "event_stream",
        technology: "Apache Kafka / AWS Kinesis",
        responsibility: "Immutable, high-throughput distributed commit log with persistent event replay.",
        requirements: [secondReq, "NFR-THROUGHPUT-001"],
        deployment: {
          replicas: 3,
          platform: "Managed Kafka Cluster",
        },
        messaging: {
          delivery_semantics: "at_least_once",
          overload_policy: "partition_backpressure_with_dlq_spillover",
          retention_period: "7d",
        },
      },
      {
        id: `${baseName}-stream-consumers`,
        name: `${brief.name} Stream Consumer Microservice`,
        type: "background_worker",
        technology: `${lang} Consumer Group`,
        responsibility: "Consumes partitioned stream and updates distributed read model.",
        requirements: reqIds,
        deployment: {
          replicas: 6,
          platform: "Managed Kubernetes",
        },
        behavior: {
          idempotent: true,
          idempotency_key: "event_id",
          retry_policy: {
            max_attempts: 5,
            backoff: "exponential",
            dead_letter_target: `${baseName}-stream-dlq`,
          },
        },
      },
      {
        id: `${baseName}-stream-dlq`,
        name: `${brief.name} Stream Dead Letter Topic`,
        type: "message_queue",
        technology: "Kafka DLQ Topic",
        responsibility: "Captures poison-pill stream events after bounded consumer retry exhaustion.",
        requirements: [secondReq],
        messaging: {
          delivery_semantics: "at_least_once",
          overload_policy: "alert_on_message_present",
          retention_period: "14d",
        },
      },
      {
        id: `${baseName}-read-store`,
        name: `${brief.name} Denormalized Read Store`,
        type: "cache",
        technology: "Redis Cluster / ScyllaDB",
        responsibility: "High-speed key-value cache serving read query service.",
        requirements: ["NFR-LATENCY-001"],
        deployment: {
          replicas: 3,
          platform: "Redis Cluster / ScyllaDB",
        },
        data: {
          ownership: `${baseName}-read-projection-domain`,
          retention: "24h",
        },
      },
      {
        id: `${baseName}-audit-store`,
        name: `${brief.name} Cold Storage & Audit Store`,
        type: "object_storage",
        technology: "S3 / GCS Data Lake",
        responsibility: "Long-term cold archive for historical compliance.",
        requirements: [primaryReq],
        data: {
          ownership: `${baseName}-audit-archive-domain`,
          storage_type: "object",
          retention: "365d",
          backup_frequency: "continuous",
        },
      },
    ],
    connections: [
      {
        id: "conn-edge-to-cmd",
        from: `${baseName}-edge-proxy`,
        to: `${baseName}-command-service`,
        protocol: "synchronous",
        transport: "https",
        purpose: "Route write mutations to command service.",
        timeout_ms: 100,
        retry_policy: { max_attempts: 2, backoff: "exponential" },
      },
      {
        id: "conn-edge-to-query",
        from: `${baseName}-edge-proxy`,
        to: `${baseName}-query-service`,
        protocol: "synchronous",
        transport: "https",
        purpose: "Route read requests directly to query service.",
        timeout_ms: 50,
      },
      {
        id: "conn-cmd-to-stream",
        from: `${baseName}-command-service`,
        to: `${baseName}-event-stream`,
        protocol: "asynchronous",
        transport: "kafka",
        purpose: "Append immutable command events to partitioned topic.",
        timeout_ms: 30,
      },
      {
        id: "conn-stream-to-consumer",
        from: `${baseName}-event-stream`,
        to: `${baseName}-stream-consumers`,
        protocol: "asynchronous",
        transport: "kafka",
        purpose: "Consume partitioned events in order by entity partition key.",
      },
      {
        id: "conn-consumer-to-read-store",
        from: `${baseName}-stream-consumers`,
        to: `${baseName}-read-store`,
        protocol: "synchronous",
        transport: "tcp",
        purpose: "Update denormalized read projection for fast retrieval.",
        timeout_ms: 15,
        retry_policy: { max_attempts: 3, backoff: "exponential" },
      },
      {
        id: "conn-query-to-read-store",
        from: `${baseName}-query-service`,
        to: `${baseName}-read-store`,
        protocol: "synchronous",
        transport: "tcp",
        purpose: "Retrieve low-latency read views.",
        timeout_ms: 10,
      },
      {
        id: "conn-consumer-to-audit",
        from: `${baseName}-stream-consumers`,
        to: `${baseName}-audit-store`,
        protocol: "asynchronous",
        transport: "https",
        purpose: "Flush batch intervals to long-term cold archive.",
      },
      {
        id: "conn-consumer-to-dlq",
        from: `${baseName}-stream-consumers`,
        to: `${baseName}-stream-dlq`,
        protocol: "asynchronous",
        transport: "kafka",
        purpose: "Route unprocessable poison events to dead-letter topic after retry exhaustion.",
      },
    ],
    decisions: [
      {
        id: "ADR-001",
        title: "CQRS with Kafka Partitioned Event Streaming",
        status: "accepted",
        context: "Extreme throughput requires strict separation of read and write scaling boundaries.",
        choice: "Command Query Responsibility Segregation (CQRS) with Kafka and ScyllaDB/Redis read projections.",
        consequences: [
          "Delivers maximum throughput (> 50k RPS).",
          "Introduces eventual consistency delays and high operational overhead.",
        ],
      },
    ],
  };

  return {
    normalized,
    alternatives: [alt1, alt2, alt3],
  };
}
