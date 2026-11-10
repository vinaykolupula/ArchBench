import * as fs from "node:fs/promises";
import * as path from "node:path";
import YAML from "yaml";

interface GroundTruthCase {
  id: string;
  archetype: string;
  category: "optimal" | "flawed" | "speculative";
  title: string;
  description: string;
  expectedFindingRuleIds: string[];
  expectedFindingSeverities: Record<string, number>;
  relativeFilePath: string;
}

// Schema requires: id, from, to, protocol (synchronous|asynchronous)
// Optional: transport, purpose, timeout_ms, retry_policy
function conn(
  id: string,
  from: string,
  to: string,
  protocol: "synchronous" | "asynchronous",
  transport?: string,
  purpose?: string
) {
  return {
    id,
    from,
    to,
    protocol,
    ...(transport ? { transport } : {}),
    ...(purpose ? { purpose } : {}),
  };
}

function createSystem(params: {
  project: string;
  desc: string;
  users?: Array<{ id: string; name: string }>;
  externalSystems?: Array<{ id: string; name: string; category?: string }>;
  reqs: Array<{
    id: string;
    cat: string;
    prio: "must" | "should" | "may";
    stmt: string;
    verif?: string;
    target?: Record<string, any>;
  }>;
}) {
  return {
    archbench: {
      spec_version: "0.1",
      project: params.project,
      description: params.desc,
      authors: ["ArchBench Benchmark Suite"],
    },
    system: {
      context: {
        users: params.users || [{ id: "end-user", name: "End User" }],
        external_systems: (params.externalSystems || []).map((es) => ({
          id: es.id,
          name: es.name,
          category: es.category || "external_provider",
        })),
      },
      requirements: params.reqs.map((r) => ({
        id: r.id,
        category: r.cat,
        priority: r.prio,
        statement: r.stmt,
        verification: r.verif || "architecture_check",
        ...(r.target ? { target: r.target } : {}),
      })),
      constraints: [
        {
          id: "CON-001",
          category: "operational",
          statement: "Production deployable within corporate cloud boundaries.",
        },
      ],
      assumptions: [
        {
          id: "ASM-001",
          statement: "Expected traffic patterns follow daily diurnal cycles.",
          status: "confirmed",
          confidence: "high",
          impact_if_false: "medium",
        },
      ],
    },
  };
}

const cases: Array<{
  dir: string;
  filename: string;
  spec: any;
  groundTruth: GroundTruthCase;
}> = [];

// =============================================================
// Archetype 1: URL Shortener (Cases 01 - 05)
// =============================================================

// Case 01: Optimal Simple URL Shortener
cases.push({
  dir: "01-url-shortener",
  filename: "case-01-optimal-simple.yaml",
  spec: {
    ...createSystem({
      project: "url-shortener-optimal-simple",
      desc: "Modular URL Shortener with Single Service and Postgres",
      reqs: [
        { id: "REQ-01", cat: "functional", prio: "must", stmt: "Shorten long URLs." },
        { id: "REQ-02", cat: "functional", prio: "must", stmt: "Redirect short code to destination." },
        { id: "NFR-01", cat: "latency", prio: "must", stmt: "p99 latency < 20ms", target: { p99_latency_ms: 20 } },
      ],
    }),
    architecture: {
      alternatives: [
        {
          id: "modular-monolith",
          name: "Modular Service with Relational Database",
          description: "Simple stateless application with redundant replicas and pooled Postgres.",
          components: [
            {
              id: "shortener-app",
              name: "Shortener Application",
              type: "application",
              technology: "Go / Chi",
              responsibility: "Handles URL encoding and HTTP 302 redirections.",
              requirements: ["REQ-01", "REQ-02", "NFR-01"],
              deployment: { replicas: 3 },
            },
            {
              id: "shortener-db",
              name: "PostgreSQL Database",
              type: "relational_database",
              technology: "PostgreSQL 16",
              responsibility: "Stores URL mappings and indexes.",
              data: { ownership: "shortener-domain" },
              deployment: { replicas: 2 },
            },
          ],
          connections: [
            conn("c01-user-app", "end-user", "shortener-app", "synchronous", "https", "Shorten and redirect"),
            conn("c01-app-db", "shortener-app", "shortener-db", "synchronous", "tcp", "Read and write URL records"),
          ],
        },
      ],
    },
  },
  groundTruth: {
    id: "case-01-optimal-simple",
    archetype: "01-url-shortener",
    category: "optimal",
    title: "Optimal Modular URL Shortener",
    description: "Stateless app with 3 replicas and primary database; clean 0 findings.",
    expectedFindingRuleIds: [],
    expectedFindingSeverities: {},
    relativeFilePath: "benchmarks/cases/01-url-shortener/case-01-optimal-simple.yaml",
  },
});

// Case 02: Justified Cache URL Shortener
cases.push({
  dir: "01-url-shortener",
  filename: "case-02-justified-cache.yaml",
  spec: {
    ...createSystem({
      project: "url-shortener-justified-cache",
      desc: "High Throughput Shortener with Justified Redis Cache",
      reqs: [
        { id: "REQ-01", cat: "functional", prio: "must", stmt: "Shorten and redirect URLs." },
        { id: "NFR-T-01", cat: "throughput", prio: "must", stmt: "Handle 50k read rps.", target: { rps: 50000 } },
      ],
    }),
    architecture: {
      alternatives: [
        {
          id: "cached-architecture",
          name: "Edge Cached Redirection Tier",
          description: "High performance Redis cache absorbing 95% of redirection lookups.",
          components: [
            {
              id: "api-gateway",
              name: "API Gateway",
              type: "api_gateway",
              technology: "Envoy",
              responsibility: "Routes ingress traffic.",
              requirements: ["REQ-01", "NFR-T-01"],
              deployment: { replicas: 3 },
            },
            {
              id: "shortener-svc",
              name: "Shortener Service",
              type: "service",
              technology: "Node.js / Fastify",
              responsibility: "Serves short code lookups.",
              requirements: ["REQ-01"],
              deployment: { replicas: 4 },
            },
            {
              id: "redis-cache",
              name: "Redis Cache",
              type: "key_value_store",
              technology: "Redis Cluster",
              responsibility: "Caches hot URL mappings.",
              data: { ownership: "shortener-domain" },
              deployment: { replicas: 3 },
            },
            {
              id: "postgres-db",
              name: "PostgreSQL Database",
              type: "relational_database",
              technology: "PostgreSQL 16",
              responsibility: "Persistent URL repository.",
              data: { ownership: "shortener-domain" },
              deployment: { replicas: 2 },
            },
          ],
          connections: [
            conn("c02-user-gw", "end-user", "api-gateway", "synchronous", "https"),
            conn("c02-gw-svc", "api-gateway", "shortener-svc", "synchronous", "http"),
            conn("c02-svc-cache", "shortener-svc", "redis-cache", "synchronous", "redis"),
            conn("c02-svc-db", "shortener-svc", "postgres-db", "synchronous", "postgres"),
          ],
        },
      ],
    },
  },
  groundTruth: {
    id: "case-02-justified-cache",
    archetype: "01-url-shortener",
    category: "optimal",
    title: "Justified Caching URL Shortener",
    description: "Redis cluster backed by 50k rps NFR; clean 0 findings.",
    expectedFindingRuleIds: [],
    expectedFindingSeverities: {},
    relativeFilePath: "benchmarks/cases/01-url-shortener/case-02-justified-cache.yaml",
  },
});

// Case 03: Speculative Microservices URL Shortener
cases.push({
  dir: "01-url-shortener",
  filename: "case-03-speculative-microservices.yaml",
  spec: {
    ...createSystem({
      project: "url-shortener-speculative",
      desc: "Low-Traffic URL Shortener Overengineered with 5 Microservices",
      reqs: [
        { id: "REQ-01", cat: "functional", prio: "must", stmt: "Shorten URLs for small team." },
        { id: "NFR-01", cat: "throughput", prio: "must", stmt: "Expected 2 requests per minute.", target: { rps: 1 } },
      ],
    }),
    architecture: {
      alternatives: [
        {
          id: "speculative-cluster",
          name: "Distributed Kubernetes Mesh",
          description: "Heavily fragmented microservices with unneeded event streaming.",
          components: [
            {
              id: "ingress-gw",
              name: "Ingress Gateway",
              type: "api_gateway",
              technology: "Kong",
              responsibility: "Routes requests.",
              requirements: ["REQ-01"],
              deployment: { replicas: 2 },
            },
            {
              id: "encode-svc",
              name: "Hash Encoder Service",
              type: "service",
              technology: "Rust",
              responsibility: "Calculates base62 hashes.",
              requirements: ["REQ-01"],
              deployment: { replicas: 2 },
            },
            {
              id: "persist-svc",
              name: "Persistence Service",
              type: "service",
              technology: "Go",
              responsibility: "Writes to datastore.",
              deployment: { replicas: 2 },
            },
            {
              id: "kafka-bus",
              name: "Kafka Cluster",
              type: "event_stream",
              technology: "Apache Kafka",
              responsibility: "Buffers URL events.",
              messaging: { overload_policy: "drop_oldest", delivery_semantics: "at_least_once" },
            },
            {
              id: "analytics-svc",
              name: "Analytics Service",
              type: "service",
              technology: "Python",
              responsibility: "Processes click metrics.",
              deployment: { replicas: 2 },
              behavior: { idempotent: false },
            },
            {
              id: "mongo-db",
              name: "MongoDB Sharded Cluster",
              type: "document_database",
              technology: "MongoDB",
              responsibility: "Stores documents.",
              data: { ownership: "url-domain" },
            },
          ],
          connections: [
            conn("c03-user-gw", "end-user", "ingress-gw", "synchronous", "https"),
            conn("c03-gw-encode", "ingress-gw", "encode-svc", "synchronous", "grpc"),
            conn("c03-encode-persist", "encode-svc", "persist-svc", "synchronous", "grpc"),
            conn("c03-persist-db", "persist-svc", "mongo-db", "synchronous", "tcp"),
            conn("c03-persist-kafka", "persist-svc", "kafka-bus", "asynchronous", "kafka"),
            conn("c03-kafka-analytics", "kafka-bus", "analytics-svc", "asynchronous", "kafka"),
          ],
        },
      ],
    },
  },
  groundTruth: {
    id: "case-03-speculative-microservices",
    archetype: "01-url-shortener",
    category: "speculative",
    title: "Speculative Microservices Shortener",
    description: "Speculative architecture with multiple flaws: unmapped NFR, deep sync chain, non-idempotent consumer, and dual-write without outbox.",
    expectedFindingRuleIds: ["REQ-COV-001", "STRUC-001", "REL-002", "DATA-001"],
    expectedFindingSeverities: { critical: 1, warning: 2, error: 1 },
    relativeFilePath: "benchmarks/cases/01-url-shortener/case-03-speculative-microservices.yaml",
  },
});

// Case 04: Unbounded Retries URL Shortener
cases.push({
  dir: "01-url-shortener",
  filename: "case-04-unbounded-retries.yaml",
  spec: {
    ...createSystem({
      project: "url-shortener-unbounded-retries",
      desc: "URL Shortener with Misconfigured Excessive Retries",
      reqs: [{ id: "REQ-01", cat: "functional", prio: "must", stmt: "Shorten and redirect URLs." }],
    }),
    architecture: {
      alternatives: [
        {
          id: "faulty-retries",
          name: "Aggressive Retry Configuration",
          description: "Service configured with 50 retries causing retry storm vulnerability.",
          components: [
            {
              id: "api-svc",
              name: "API Service",
              type: "service",
              technology: "Go",
              responsibility: "API handler.",
              requirements: ["REQ-01"],
              deployment: { replicas: 3 },
              behavior: { retry_policy: { max_attempts: 50, backoff: "linear" } },
            },
            {
              id: "url-db",
              name: "PostgreSQL Database",
              type: "relational_database",
              technology: "PostgreSQL",
              responsibility: "URL table.",
              data: { ownership: "url-domain" },
              deployment: { replicas: 2 },
            },
          ],
          connections: [
            conn("c04-user-svc", "end-user", "api-svc", "synchronous", "https"),
            conn("c04-svc-db", "api-svc", "url-db", "synchronous", "tcp"),
          ],
        },
      ],
    },
  },
  groundTruth: {
    id: "case-04-unbounded-retries",
    archetype: "01-url-shortener",
    category: "flawed",
    title: "Unbounded Retries URL Shortener",
    description: "Triggers REL-001 (excessive retries) and REL-003 (no DLQ).",
    expectedFindingRuleIds: ["REL-001", "REL-003"],
    expectedFindingSeverities: { warning: 2 },
    relativeFilePath: "benchmarks/cases/01-url-shortener/case-04-unbounded-retries.yaml",
  },
});

// Case 05: Deep Synchronous Call Chain URL Shortener
cases.push({
  dir: "01-url-shortener",
  filename: "case-05-sync-chain-cascade.yaml",
  spec: {
    ...createSystem({
      project: "url-shortener-sync-chain",
      desc: "URL Shortener with 4 Synchronous Hops from Ingress to Database",
      reqs: [{ id: "REQ-01", cat: "functional", prio: "must", stmt: "Shorten and redirect URLs." }],
    }),
    architecture: {
      alternatives: [
        {
          id: "cascading-chain",
          name: "Deep Synchronous Chain",
          description: "Gateway -> Auth -> Router -> Shortener -> DB (4 hops).",
          components: [
            {
              id: "api-gw",
              name: "API Gateway",
              type: "api_gateway",
              technology: "Kong",
              responsibility: "Gateway.",
              requirements: ["REQ-01"],
              deployment: { replicas: 2 },
            },
            {
              id: "auth-proxy",
              name: "Auth Proxy",
              type: "service",
              technology: "Node.js",
              responsibility: "Token checks.",
              deployment: { replicas: 2 },
            },
            {
              id: "router-svc",
              name: "Routing Service",
              type: "service",
              technology: "Go",
              responsibility: "Tenant routing.",
              deployment: { replicas: 2 },
            },
            {
              id: "shortener-core",
              name: "Core Shortener",
              type: "service",
              technology: "Rust",
              responsibility: "Short URL generator.",
              deployment: { replicas: 2 },
            },
            {
              id: "sql-store",
              name: "SQL Database",
              type: "relational_database",
              technology: "PostgreSQL",
              responsibility: "Datastore.",
              data: { ownership: "shortener-domain" },
              deployment: { replicas: 2 },
            },
          ],
          connections: [
            conn("c05-user-gw", "end-user", "api-gw", "synchronous", "https"),
            conn("c05-gw-auth", "api-gw", "auth-proxy", "synchronous", "http"),
            conn("c05-auth-router", "auth-proxy", "router-svc", "synchronous", "http"),
            conn("c05-router-core", "router-svc", "shortener-core", "synchronous", "grpc"),
            conn("c05-core-store", "shortener-core", "sql-store", "synchronous", "tcp"),
          ],
        },
      ],
    },
  },
  groundTruth: {
    id: "case-05-sync-chain-cascade",
    archetype: "01-url-shortener",
    category: "flawed",
    title: "Synchronous Chain Cascade Shortener",
    description: "Triggers STRUC-001 due to 4 synchronous hops.",
    expectedFindingRuleIds: ["STRUC-001"],
    expectedFindingSeverities: { warning: 1 },
    relativeFilePath: "benchmarks/cases/01-url-shortener/case-05-sync-chain-cascade.yaml",
  },
});

// =============================================================
// Archetype 2: Notification Platform (Cases 06 - 10)
// =============================================================

// Case 06: Production Grade Notification Platform
cases.push({
  dir: "02-notification-platform",
  filename: "case-06-production-grade.yaml",
  spec: {
    ...createSystem({
      project: "notification-platform-prod",
      desc: "Resilient Asynchronous Notification System with Outbox and DLQ",
      reqs: [
        { id: "REQ-01", cat: "functional", prio: "must", stmt: "Send multi-channel notifications." },
        { id: "NFR-01", cat: "throughput", prio: "must", stmt: "10,000 notifications/sec", target: { rps: 10000 } },
      ],
      externalSystems: [{ id: "email-gateway", name: "SendGrid Email Provider" }],
    }),
    architecture: {
      alternatives: [
        {
          id: "resilient-pipeline",
          name: "Outbox Queue Worker Pipeline",
          description: "Decoupled pipeline with outbox pattern, idempotent workers, and DLQ.",
          decisions: [
            {
              id: "ADR-001",
              title: "Transactional Outbox Pattern",
              choice: "Use transactional outbox to prevent dual writes.",
              context: "Prevent dual write inconsistencies between PostgreSQL and RabbitMQ.",
              status: "accepted",
            },
          ],
          components: [
            {
              id: "notify-api",
              name: "Notification Ingress API",
              type: "service",
              technology: "Go",
              responsibility: "Accepts requests and saves to Outbox table.",
              requirements: ["REQ-01", "NFR-01"],
              deployment: { replicas: 3 },
            },
            {
              id: "notify-db",
              name: "PostgreSQL Database",
              type: "relational_database",
              technology: "PostgreSQL 16",
              responsibility: "Holds notifications and outbox events.",
              data: { ownership: "notification-domain" },
              deployment: { replicas: 2 },
            },
            {
              id: "notify-queue",
              name: "RabbitMQ Notification Queue",
              type: "message_queue",
              technology: "RabbitMQ",
              responsibility: "Buffers notification messages.",
              messaging: { overload_policy: "drop_head_after_alarm", delivery_semantics: "at_least_once" },
            },
            {
              id: "notify-dlq",
              name: "Dead Letter Queue",
              type: "message_queue",
              technology: "RabbitMQ DLQ",
              responsibility: "Dead letter quarantine.",
              messaging: { overload_policy: "alert_operator" },
            },
            {
              id: "dispatch-worker",
              name: "Dispatch Worker",
              type: "background_worker",
              technology: "Node.js",
              responsibility: "Consumes messages, dedupes, and invokes third party email provider.",
              requirements: ["REQ-01"],
              deployment: { replicas: 4 },
              behavior: {
                idempotent: true,
                idempotency_key: "notification_id",
                retry_policy: { max_attempts: 3, backoff: "exponential", dead_letter_target: "notify-dlq" },
              },
            },
          ],
          connections: [
            conn("c06-user-api", "end-user", "notify-api", "synchronous", "https"),
            conn("c06-api-db", "notify-api", "notify-db", "synchronous", "tcp"),
            conn("c06-api-queue", "notify-api", "notify-queue", "asynchronous", "amqp"),
            conn("c06-queue-worker", "notify-queue", "dispatch-worker", "asynchronous", "amqp"),
            conn("c06-worker-gw", "dispatch-worker", "email-gateway", "synchronous", "https"),
          ],
        },
      ],
    },
  },
  groundTruth: {
    id: "case-06-production-grade",
    archetype: "02-notification-platform",
    category: "optimal",
    title: "Production Grade Notification Platform",
    description: "Fully compliant async architecture with Outbox ADR, DLQ, and idempotent worker.",
    expectedFindingRuleIds: [],
    expectedFindingSeverities: {},
    relativeFilePath: "benchmarks/cases/02-notification-platform/case-06-production-grade.yaml",
  },
});

// Case 07: Sync Chain Notification Platform
cases.push({
  dir: "02-notification-platform",
  filename: "case-07-sync-chain-cascade.yaml",
  spec: {
    ...createSystem({
      project: "notification-sync-chain",
      desc: "Synchronous Cascade in Notification Dispatching",
      reqs: [{ id: "REQ-01", cat: "functional", prio: "must", stmt: "Send notifications." }],
      externalSystems: [{ id: "sms-provider", name: "Twilio SMS" }],
    }),
    architecture: {
      alternatives: [
        {
          id: "sync-cascade",
          name: "Synchronous Dispatch Chain",
          description: "GW -> TemplateSvc -> RuleEngine -> ProviderRouter -> Provider (4 hops).",
          components: [
            {
              id: "notify-gw",
              name: "Notification Gateway",
              type: "api_gateway",
              technology: "Kong",
              responsibility: "Ingress.",
              requirements: ["REQ-01"],
              deployment: { replicas: 2 },
            },
            {
              id: "template-svc",
              name: "Template Engine Service",
              type: "service",
              technology: "Python",
              responsibility: "Renders templates.",
              deployment: { replicas: 2 },
            },
            {
              id: "rule-engine",
              name: "Notification Rules Service",
              type: "service",
              technology: "Java",
              responsibility: "User preferences.",
              deployment: { replicas: 2 },
            },
            {
              id: "router-svc",
              name: "Provider Router",
              type: "service",
              technology: "Go",
              responsibility: "Downstream router.",
              deployment: { replicas: 2 },
            },
          ],
          connections: [
            conn("c07-user-gw", "end-user", "notify-gw", "synchronous", "https"),
            conn("c07-gw-tmpl", "notify-gw", "template-svc", "synchronous", "http"),
            conn("c07-tmpl-rules", "template-svc", "rule-engine", "synchronous", "http"),
            conn("c07-rules-router", "rule-engine", "router-svc", "synchronous", "http"),
            conn("c07-router-sms", "router-svc", "sms-provider", "synchronous", "https"),
          ],
        },
      ],
    },
  },
  groundTruth: {
    id: "case-07-sync-chain-cascade",
    archetype: "02-notification-platform",
    category: "flawed",
    title: "Synchronous Cascade Notification Platform",
    description: "Triggers STRUC-001 (synchronous chain to external provider).",
    expectedFindingRuleIds: ["STRUC-001"],
    expectedFindingSeverities: { warning: 1 },
    relativeFilePath: "benchmarks/cases/02-notification-platform/case-07-sync-chain-cascade.yaml",
  },
});

// Case 08: Dual Write without Outbox
cases.push({
  dir: "02-notification-platform",
  filename: "case-08-dual-write-no-outbox.yaml",
  spec: {
    ...createSystem({
      project: "notification-dual-write",
      desc: "Notification API directly mutating DB and Kafka without Outbox pattern",
      reqs: [{ id: "REQ-01", cat: "functional", prio: "must", stmt: "Enqueue and log notifications." }],
    }),
    architecture: {
      alternatives: [
        {
          id: "dual-write-variant",
          name: "Direct Dual Write Handler",
          description: "API handler publishes to queue and writes to database without transactional outbox.",
          components: [
            {
              id: "notify-api",
              name: "Notification API",
              type: "service",
              technology: "Node.js",
              responsibility: "Accepts notification requests.",
              requirements: ["REQ-01"],
              deployment: { replicas: 2 },
            },
            {
              id: "notify-db",
              name: "Audit Database",
              type: "relational_database",
              technology: "PostgreSQL",
              responsibility: "Notification audit records.",
              data: { ownership: "notification-domain" },
              deployment: { replicas: 2 },
            },
            {
              id: "notify-queue",
              name: "Kafka Topic",
              type: "message_queue",
              technology: "Kafka",
              responsibility: "Event streaming.",
              messaging: { overload_policy: "bounded_retention" },
            },
            {
              id: "notify-worker",
              name: "Notification Worker",
              type: "background_worker",
              technology: "Go",
              responsibility: "Processes queue.",
              deployment: { replicas: 2 },
              behavior: { idempotent: true, idempotency_key: "id" },
            },
          ],
          connections: [
            conn("c08-user-api", "end-user", "notify-api", "synchronous", "https"),
            conn("c08-api-db", "notify-api", "notify-db", "synchronous", "tcp"),
            conn("c08-api-queue", "notify-api", "notify-queue", "asynchronous", "kafka"),
            conn("c08-queue-worker", "notify-queue", "notify-worker", "asynchronous", "kafka"),
          ],
        },
      ],
    },
  },
  groundTruth: {
    id: "case-08-dual-write-no-outbox",
    archetype: "02-notification-platform",
    category: "flawed",
    title: "Dual Write Notification Platform",
    description: "Triggers DATA-001 (dual write without Outbox).",
    expectedFindingRuleIds: ["DATA-001"],
    expectedFindingSeverities: { warning: 1 },
    relativeFilePath: "benchmarks/cases/02-notification-platform/case-08-dual-write-no-outbox.yaml",
  },
});

// Case 09: Missing DLQ
cases.push({
  dir: "02-notification-platform",
  filename: "case-09-missing-dlq-quarantine.yaml",
  spec: {
    ...createSystem({
      project: "notification-missing-dlq",
      desc: "Worker retries messages but lacks a DLQ quarantine target",
      reqs: [{ id: "REQ-01", cat: "functional", prio: "must", stmt: "Process notifications." }],
    }),
    architecture: {
      alternatives: [
        {
          id: "no-dlq-variant",
          name: "Retry Worker Without Dead Letter Target",
          description: "Worker retries failed notifications without quarantine.",
          components: [
            {
              id: "notify-queue",
              name: "SQS Queue",
              type: "message_queue",
              technology: "AWS SQS",
              responsibility: "Notification queue.",
              messaging: { overload_policy: "cloudwatch_alarm", delivery_semantics: "at_least_once" },
            },
            {
              id: "notify-worker",
              name: "Notification Worker",
              type: "background_worker",
              technology: "Go",
              responsibility: "Dispatches notifications with retries.",
              requirements: ["REQ-01"],
              deployment: { replicas: 3 },
              behavior: {
                idempotent: true,
                idempotency_key: "msg_id",
                retry_policy: { max_attempts: 5, backoff: "exponential" },
              },
            },
          ],
          connections: [
            conn("c09-user-queue", "end-user", "notify-queue", "asynchronous", "sqs"),
            conn("c09-queue-worker", "notify-queue", "notify-worker", "asynchronous", "sqs"),
          ],
        },
      ],
    },
  },
  groundTruth: {
    id: "case-09-missing-dlq-quarantine",
    archetype: "02-notification-platform",
    category: "flawed",
    title: "Missing DLQ Notification Platform",
    description: "Triggers REL-003 (worker retries without dead_letter_target).",
    expectedFindingRuleIds: ["REL-003"],
    expectedFindingSeverities: { warning: 1 },
    relativeFilePath: "benchmarks/cases/02-notification-platform/case-09-missing-dlq-quarantine.yaml",
  },
});

// Case 10: Unconsumed Queue
cases.push({
  dir: "02-notification-platform",
  filename: "case-10-unconsumed-queue-overload.yaml",
  spec: {
    ...createSystem({
      project: "notification-unconsumed-queue",
      desc: "Producer writes to queue with zero consumers",
      reqs: [{ id: "REQ-01", cat: "functional", prio: "must", stmt: "Buffer incoming events." }],
    }),
    architecture: {
      alternatives: [
        {
          id: "orphan-queue-variant",
          name: "Orphan Queue Architecture",
          description: "Ingress writes to event queue without consumer and without overload policy.",
          components: [
            {
              id: "ingress-api",
              name: "Ingress API",
              type: "service",
              technology: "Go",
              responsibility: "Ingress.",
              requirements: ["REQ-01"],
              deployment: { replicas: 2 },
            },
            {
              id: "orphan-queue",
              name: "Pending Events Queue",
              type: "message_queue",
              technology: "RabbitMQ",
              responsibility: "Buffer without consumers.",
            },
          ],
          connections: [
            conn("c10-user-api", "end-user", "ingress-api", "synchronous", "https"),
            conn("c10-api-queue", "ingress-api", "orphan-queue", "asynchronous", "amqp"),
          ],
        },
      ],
    },
  },
  groundTruth: {
    id: "case-10-unconsumed-queue-overload",
    archetype: "02-notification-platform",
    category: "flawed",
    title: "Unconsumed Queue Notification Platform",
    description: "Triggers SCAL-001 (unconsumed queue + missing overload policy).",
    expectedFindingRuleIds: ["SCAL-001"],
    expectedFindingSeverities: { error: 1, warning: 1 },
    relativeFilePath: "benchmarks/cases/02-notification-platform/case-10-unconsumed-queue-overload.yaml",
  },
});

// =============================================================
// Archetypes 3 - 10 (Templated, Cases 11 - 50)
// =============================================================

interface ArchetypeTemplate {
  archetypeDir: string;
  projectName: string;
  domain: string;
  entityName: string;
}

const templates: ArchetypeTemplate[] = [
  { archetypeDir: "03-ecommerce-checkout", projectName: "ecommerce-checkout", domain: "checkout", entityName: "Order" },
  { archetypeDir: "04-realtime-chat", projectName: "realtime-chat", domain: "chat", entityName: "Message" },
  { archetypeDir: "05-rag-pipeline", projectName: "rag-document-pipeline", domain: "doc", entityName: "Document" },
  { archetypeDir: "06-video-transcoding", projectName: "video-transcoding", domain: "video", entityName: "VideoJob" },
  { archetypeDir: "07-payment-ledger", projectName: "payment-ledger", domain: "ledger", entityName: "Transaction" },
  { archetypeDir: "08-iot-telemetry", projectName: "iot-telemetry", domain: "telemetry", entityName: "SensorReading" },
  { archetypeDir: "09-multitenant-saas", projectName: "multitenant-saas", domain: "tenant", entityName: "TenantWorkspace" },
  { archetypeDir: "10-feature-flagging", projectName: "feature-flagging", domain: "flag", entityName: "FeatureEval" },
];

let caseIndex = 11;

for (const tmpl of templates) {
  const { archetypeDir, projectName, domain, entityName } = tmpl;
  const ci = () => caseIndex.toString().padStart(2, "0");

  // 1. Optimal Case
  const optId = `case-${ci()}-optimal-resilient`;
  cases.push({
    dir: archetypeDir,
    filename: `${optId}.yaml`,
    spec: {
      ...createSystem({
        project: `${projectName}-optimal`,
        desc: `Optimal Resilient Architecture for ${entityName} Processing`,
        reqs: [
          { id: "REQ-01", cat: "functional", prio: "must", stmt: `Process ${entityName} operations.` },
          { id: "NFR-01", cat: "latency", prio: "must", stmt: "p99 response < 50ms", target: { p99_ms: 50 } },
        ],
      }),
      architecture: {
        alternatives: [
          {
            id: "optimal-pipeline",
            name: `Optimal ${entityName} Pipeline`,
            description: `Production-grade architecture with HA, outbox, idempotent worker, and DLQ.`,
            decisions: [
              { id: "ADR-001", title: "Transactional Outbox", choice: "Outbox Pattern", context: "Prevent dual write.", status: "accepted" },
            ],
            components: [
              {
                id: `${domain}-api`,
                name: `${entityName} API`,
                type: "service",
                technology: "Go",
                responsibility: `Ingress handler for ${entityName}.`,
                requirements: ["REQ-01", "NFR-01"],
                deployment: { replicas: 3 },
              },
              {
                id: `${domain}-db`,
                name: `${entityName} Database`,
                type: "relational_database",
                technology: "PostgreSQL 16",
                responsibility: `Stores ${entityName} records.`,
                data: { ownership: `${domain}-domain` },
                deployment: { replicas: 2 },
              },
              {
                id: `${domain}-queue`,
                name: `${entityName} Queue`,
                type: "message_queue",
                technology: "RabbitMQ",
                responsibility: `Buffers async ${entityName} jobs.`,
                messaging: { overload_policy: "alert_and_drop_oldest", delivery_semantics: "at_least_once" },
              },
              {
                id: `${domain}-dlq`,
                name: `${entityName} DLQ`,
                type: "message_queue",
                technology: "RabbitMQ DLQ",
                responsibility: "Quarantine queue.",
                messaging: { overload_policy: "alert_on_call" },
              },
              {
                id: `${domain}-worker`,
                name: `${entityName} Worker`,
                type: "background_worker",
                technology: "Rust",
                responsibility: `Processes ${entityName} jobs.`,
                requirements: ["REQ-01"],
                deployment: { replicas: 3 },
                behavior: {
                  idempotent: true,
                  idempotency_key: `${domain}_id`,
                  retry_policy: { max_attempts: 3, backoff: "exponential", dead_letter_target: `${domain}-dlq` },
                },
              },
            ],
            connections: [
              conn(`c${ci()}-user-api`, "end-user", `${domain}-api`, "synchronous", "https"),
              conn(`c${ci()}-api-db`, `${domain}-api`, `${domain}-db`, "synchronous", "tcp"),
              conn(`c${ci()}-api-queue`, `${domain}-api`, `${domain}-queue`, "asynchronous", "amqp"),
              conn(`c${ci()}-queue-worker`, `${domain}-queue`, `${domain}-worker`, "asynchronous", "amqp"),
            ],
          },
        ],
      },
    },
    groundTruth: {
      id: optId,
      archetype: archetypeDir,
      category: "optimal",
      title: `Optimal ${entityName} Architecture`,
      description: `0 findings expected.`,
      expectedFindingRuleIds: [],
      expectedFindingSeverities: {},
      relativeFilePath: `benchmarks/cases/${archetypeDir}/${optId}.yaml`,
    },
  });
  caseIndex++;

  // 2. SPOF (REL-004)
  const spofId = `case-${ci()}-spof-single-replica`;
  cases.push({
    dir: archetypeDir,
    filename: `${spofId}.yaml`,
    spec: {
      ...createSystem({
        project: `${projectName}-spof`,
        desc: `SPOF in ${entityName} Ingress`,
        reqs: [{ id: "REQ-01", cat: "functional", prio: "must", stmt: `Process ${entityName} requests.` }],
      }),
      architecture: {
        alternatives: [
          {
            id: "spof-alternative",
            name: "Single Replica Articulation Point",
            description: "Gateway with 1 replica; SPOF.",
            components: [
              {
                id: `${domain}-gw`,
                name: `${entityName} Gateway`,
                type: "api_gateway",
                technology: "Envoy",
                responsibility: "Single gateway instance.",
                requirements: ["REQ-01"],
                deployment: { replicas: 1 },
              },
              {
                id: `${domain}-svc`,
                name: `${entityName} Service`,
                type: "service",
                technology: "Go",
                responsibility: "Backend logic.",
                deployment: { replicas: 3 },
              },
              {
                id: `${domain}-db`,
                name: `${entityName} Store`,
                type: "relational_database",
                technology: "PostgreSQL",
                responsibility: "Datastore.",
                data: { ownership: `${domain}-domain` },
                deployment: { replicas: 2 },
              },
            ],
            connections: [
              conn(`c${ci()}-user-gw`, "end-user", `${domain}-gw`, "synchronous", "https"),
              conn(`c${ci()}-gw-svc`, `${domain}-gw`, `${domain}-svc`, "synchronous", "http"),
              conn(`c${ci()}-svc-db`, `${domain}-svc`, `${domain}-db`, "synchronous", "tcp"),
            ],
          },
        ],
      },
    },
    groundTruth: {
      id: spofId,
      archetype: archetypeDir,
      category: "flawed",
      title: `SPOF ${entityName} Ingress`,
      description: "Triggers REL-004.",
      expectedFindingRuleIds: ["REL-004"],
      expectedFindingSeverities: { warning: 1 },
      relativeFilePath: `benchmarks/cases/${archetypeDir}/${spofId}.yaml`,
    },
  });
  caseIndex++;

  // 3. Non-Idempotent Consumer (REL-002)
  const niId = `case-${ci()}-non-idempotent-worker`;
  cases.push({
    dir: archetypeDir,
    filename: `${niId}.yaml`,
    spec: {
      ...createSystem({
        project: `${projectName}-non-idempotent`,
        desc: `Non-idempotent Consumer for ${entityName}`,
        reqs: [{ id: "REQ-01", cat: "functional", prio: "must", stmt: `Process ${entityName} events.` }],
      }),
      architecture: {
        alternatives: [
          {
            id: "non-idempotent-alt",
            name: "Unsafe Consumer Under Duplicate Delivery",
            description: "Worker on at-least-once queue without idempotency.",
            components: [
              {
                id: `${domain}-queue`,
                name: `${entityName} Queue`,
                type: "message_queue",
                technology: "Kafka",
                responsibility: "Event streaming.",
                messaging: { overload_policy: "bounded_retention", delivery_semantics: "at_least_once" },
              },
              {
                id: `${domain}-worker`,
                name: `${entityName} Worker`,
                type: "background_worker",
                technology: "Python",
                responsibility: `Worker processing ${entityName}.`,
                requirements: ["REQ-01"],
                deployment: { replicas: 3 },
                behavior: { idempotent: false },
              },
            ],
            connections: [
              conn(`c${ci()}-user-queue`, "end-user", `${domain}-queue`, "asynchronous", "kafka"),
              conn(`c${ci()}-queue-worker`, `${domain}-queue`, `${domain}-worker`, "asynchronous", "kafka"),
            ],
          },
        ],
      },
    },
    groundTruth: {
      id: niId,
      archetype: archetypeDir,
      category: "flawed",
      title: `Non-Idempotent ${entityName} Consumer`,
      description: "Triggers REL-002.",
      expectedFindingRuleIds: ["REL-002"],
      expectedFindingSeverities: { critical: 1 },
      relativeFilePath: `benchmarks/cases/${archetypeDir}/${niId}.yaml`,
    },
  });
  caseIndex++;

  // 4. Shared Database (STRUC-002)
  const sdId = `case-${ci()}-shared-database-coupling`;
  cases.push({
    dir: archetypeDir,
    filename: `${sdId}.yaml`,
    spec: {
      ...createSystem({
        project: `${projectName}-shared-db`,
        desc: `Shared Database Coupling for ${entityName}`,
        reqs: [{ id: "REQ-01", cat: "functional", prio: "must", stmt: `Manage ${entityName} state.` }],
      }),
      architecture: {
        alternatives: [
          {
            id: "shared-db-alt",
            name: "Shared Database Anti-Pattern",
            description: "Two services directly mutating the same database.",
            components: [
              {
                id: `${domain}-read-svc`,
                name: `${entityName} Query Service`,
                type: "service",
                technology: "Go",
                responsibility: "Query service.",
                requirements: ["REQ-01"],
                deployment: { replicas: 2 },
              },
              {
                id: `${domain}-write-svc`,
                name: `${entityName} Mutation Service`,
                type: "service",
                technology: "Java",
                responsibility: "Write service.",
                requirements: ["REQ-01"],
                deployment: { replicas: 2 },
              },
              {
                id: `${domain}-master-db`,
                name: `${entityName} Shared Database`,
                type: "relational_database",
                technology: "PostgreSQL 16",
                responsibility: "Shared datastore.",
                data: { ownership: `${domain}-domain` },
                deployment: { replicas: 2 },
              },
            ],
            connections: [
              conn(`c${ci()}-user-read`, "end-user", `${domain}-read-svc`, "synchronous", "https"),
              conn(`c${ci()}-user-write`, "end-user", `${domain}-write-svc`, "synchronous", "https"),
              conn(`c${ci()}-read-db`, `${domain}-read-svc`, `${domain}-master-db`, "synchronous", "tcp"),
              conn(`c${ci()}-write-db`, `${domain}-write-svc`, `${domain}-master-db`, "synchronous", "tcp"),
            ],
          },
        ],
      },
    },
    groundTruth: {
      id: sdId,
      archetype: archetypeDir,
      category: "flawed",
      title: `Shared DB Coupling ${entityName}`,
      description: "Triggers STRUC-002.",
      expectedFindingRuleIds: ["STRUC-002"],
      expectedFindingSeverities: { error: 1 },
      relativeFilePath: `benchmarks/cases/${archetypeDir}/${sdId}.yaml`,
    },
  });
  caseIndex++;

  // 5. Unmapped Requirement (REQ-COV-001)
  const urId = `case-${ci()}-unmapped-requirement`;
  cases.push({
    dir: archetypeDir,
    filename: `${urId}.yaml`,
    spec: {
      ...createSystem({
        project: `${projectName}-unmapped-req`,
        desc: `Unmapped Compliance Requirement for ${entityName}`,
        reqs: [
          { id: "REQ-01", cat: "functional", prio: "must", stmt: `Process ${entityName} operations.` },
          { id: "REQ-COMPLY-01", cat: "functional", prio: "must", stmt: `Audit all ${entityName} transactions for compliance.` },
        ],
      }),
      architecture: {
        alternatives: [
          {
            id: "missing-req-mapping",
            name: "Unmapped Requirement Architecture",
            description: "Compliance req has no owning component.",
            components: [
              {
                id: `${domain}-svc`,
                name: `${entityName} Service`,
                type: "service",
                technology: "Go",
                responsibility: "Core handler.",
                requirements: ["REQ-01"],
                deployment: { replicas: 2 },
              },
              {
                id: `${domain}-db`,
                name: `${entityName} Database`,
                type: "relational_database",
                technology: "PostgreSQL",
                responsibility: "Datastore.",
                data: { ownership: `${domain}-domain` },
                deployment: { replicas: 2 },
              },
            ],
            connections: [
              conn(`c${ci()}-user-svc`, "end-user", `${domain}-svc`, "synchronous", "https"),
              conn(`c${ci()}-svc-db`, `${domain}-svc`, `${domain}-db`, "synchronous", "tcp"),
            ],
          },
        ],
      },
    },
    groundTruth: {
      id: urId,
      archetype: archetypeDir,
      category: "flawed",
      title: `Unmapped Requirement ${entityName}`,
      description: "Triggers REQ-COV-001.",
      expectedFindingRuleIds: ["REQ-COV-001"],
      expectedFindingSeverities: { error: 1 },
      relativeFilePath: `benchmarks/cases/${archetypeDir}/${urId}.yaml`,
    },
  });
  caseIndex++;
}

async function main() {
  console.log(`Generating ${cases.length} benchmark cases across 10 archetypes...`);
  const rootDir = path.resolve(import.meta.dirname || process.cwd(), "..");
  const casesDir = path.join(rootDir, "benchmarks/cases");
  const gtDir = path.join(rootDir, "benchmarks/expected-findings");
  await fs.mkdir(gtDir, { recursive: true });

  const gtIndex: Record<string, GroundTruthCase> = {};
  for (const c of cases) {
    const dir = path.join(casesDir, c.dir);
    await fs.mkdir(dir, { recursive: true });
    const fp = path.join(dir, c.filename);
    await fs.writeFile(fp, YAML.stringify(c.spec, { indent: 2 }), "utf-8");
    gtIndex[c.groundTruth.id] = c.groundTruth;
  }

  await fs.writeFile(path.join(gtDir, "ground-truth.json"), JSON.stringify(gtIndex, null, 2), "utf-8");
  console.log(`✓ Generated ${cases.length} cases and ground-truth index.`);
}

main().catch((err) => {
  console.error("Benchmark generation failed:", err);
  process.exit(1);
});
