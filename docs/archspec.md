# ArchSpec v0.1 Specification Format Guide

**ArchSpec** is the formal, versioned YAML/JSON architecture modeling specification powering the ArchBench framework.

---

## 1. Top-Level Specification Structure

```yaml
archbench:
  spec_version: "0.1"
  project: string                  # Alphanumeric identifier (e.g. notification-platform)
  description: string              # Human-readable architectural brief
  authors: [string]                # Contributing architects or AI agents

system:
  context:
    users: [User]                  # Upstream clients, users, or consumer applications
    external_systems: [External]   # Downstream third-party providers or legacy backends
  requirements: [Requirement]      # Functional and non-functional requirements
  constraints: [Constraint]        # Team, regulatory, or deployment boundaries
  assumptions: [Assumption]        # Explicit design assumptions and confidence levels

architecture:
  alternatives: [Alternative]      # One or more candidate architecture proposals
```

---

## 2. Requirement Modeling

Requirements link directly to components and decisions:

```yaml
requirements:
  - id: REQ-001
    category: functional
    priority: must                 # must | should | may
    statement: "Accept notification requests over authenticated REST API."
    verification: architecture_check

  - id: NFR-THROUGHPUT-001
    category: throughput
    priority: must
    statement: "Handle 5,000 requests per second at peak."
    target:
      requests_per_second_peak: 5000
    verification: capacity_analysis
```

---

## 3. Component Modeling

Components represent deployables, datastores, brokers, and gateways:

```yaml
components:
  - id: api-service
    name: "Notification API Service"
    type: service                  # application, service, api_gateway, relational_database, etc.
    technology: "Go / Gin"
    responsibility: "Accepts HTTP payloads, validates auth tokens, and writes to Outbox."
    requirements:
      - REQ-001
      - NFR-THROUGHPUT-001
    deployment:
      replicas: 3
    behavior:
      retry_policy:
        max_attempts: 3
        backoff: exponential
        dead_letter_target: api-dlq
```

---

## 4. Connection Modeling

Connections represent directed communication channels:

```yaml
connections:
  - id: conn-api-db
    from: api-service
    to: postgres-db
    protocol: synchronous          # synchronous | asynchronous
    transport: tcp                 # https, tcp, grpc, amqp, kafka
    purpose: "Persist notification entities and outbox events."
    timeout_ms: 250
```

---

## 5. Architectural Decision Records (ADRs)

```yaml
decisions:
  - id: ADR-001
    title: "Transactional Outbox Pattern for Delivery Dispatch"
    status: accepted               # proposed | accepted | superseded | deprecated | rejected
    context: "Prevent dual write state desynchronization between database and queue."
    choice: "Write entity and outbox event in a single local ACID transaction."
    alternatives:
      - "Direct dual write to RabbitMQ from API handler."
    consequences:
      - "Eliminates dual-write inconsistency."
      - "Requires dedicated outbox relay worker."
    requirements:
      - REQ-001
    evolution_triggers:
      - id: TRIG-001
        metric: "outbox_table_growth_rate_gb_day"
        threshold: "> 50"
        action: "Deploy Debezium Change Data Capture (CDC) engine."
```

