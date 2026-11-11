import { BreakAndFixLab } from "../types.js";

/**
 * Validated ArchSpec v0.1 Break-and-Fix interactive labs.
 * Each broken YAML is schema-valid so ArchBench parses it cleanly,
 * evaluates deterministic rules, and rewards the user when repaired!
 */
export const BREAK_AND_FIX_LABS: Record<string, BreakAndFixLab> = {
  "lab-dual-write-outbox": {
    id: "lab-dual-write-outbox",
    title: "Rescue the Lost Order Events (Dual-Write Hazard)",
    missionBrief:
      "The Order API writes directly to PostgreSQL and RabbitMQ without a Transactional Outbox ADR. Launch this lab in Topology/Health, inspect DATA-001, and repair the spec.",
    labGoalPlainEnglish:
      "Prevent lost orders if the server crashes between saving to Postgres and messaging RabbitMQ: document a Transactional Outbox decision (`decisions:`) so both happen atomically inside one SQL commit.",
    starterYamlSnippet: `decisions:
  - id: ADR-001
    title: "Transactional Outbox Pattern for Order Events"
    status: accepted
    context: "Prevent orphaned orders if pod crashes before RabbitMQ ACK."
    choice: "Persist order + outbox event in one SQL transaction; Debezium CDC relays asynchronously."
    requirements: [REQ-ORDER-01]`,
    targetRuleIds: ["DATA-001"],
    startingScore: 95,
    targetScore: 100,
    xpReward: 75,
    hintSteps: [
      "Inspect Health Dashboard finding DATA-001 targeting 'order-api'.",
      "Open the YAML tab and add a decision under architecture.alternatives[0].decisions with title/choice documenting the 'Transactional Outbox' pattern + CDC relay.",
      "Click 'Re-evaluate Specification' to reach 100 / 100.",
    ],
    solutionSummary:
      "Added an accepted ADR-001 enforcing the Transactional Outbox Pattern so state changes and outbox events commit atomically in PostgreSQL before async relay.",
    brokenArchSpecYaml: `archbench:
  spec_version: "0.1"
  project: lab-dual-write-order
  description: "Order service directly dual-writing to SQL DB and Message Queue."
system:
  context:
    users:
      - id: customer
        name: "Shopper"
  requirements:
    - id: REQ-ORDER-01
      category: functional
      priority: must
      statement: "Create customer orders and emit fulfillment events reliably."
      verification: architecture_check
architecture:
  alternatives:
    - id: broken-dual-write
      name: "Naive Dual-Write Service"
      description: "Writes directly to PostgreSQL then publishes to RabbitMQ in app code."
      decisions: []
      components:
        - id: order-api
          name: "Order Ingress API"
          type: service
          technology: "Go / HTTP"
          responsibility: "Creates orders and emits events."
          requirements: [REQ-ORDER-01]
          deployment:
            replicas: 3
        - id: orders-db
          name: "Orders PostgreSQL DB"
          type: relational_database
          technology: "PostgreSQL 16"
          responsibility: "Stores authoritative orders."
          requirements: [REQ-ORDER-01]
          data:
            ownership: "orders-domain"
        - id: fulfillment-queue
          name: "Fulfillment Queue"
          type: message_queue
          technology: "RabbitMQ"
          responsibility: "Queues warehouse dispatch jobs."
          requirements: [REQ-ORDER-01]
          messaging:
            delivery_semantics: at_least_once
            overload_policy: "shed_excess"
        - id: warehouse-worker
          name: "Warehouse Worker"
          type: background_worker
          technology: "Rust"
          responsibility: "Consumes fulfillment jobs idempotently."
          requirements: [REQ-ORDER-01]
          deployment:
            replicas: 2
          behavior:
            idempotent: true
            idempotency_key: "order_id"
            retry_policy:
              max_attempts: 3
              backoff: exponential
              dead_letter_target: fulfillment-dlq
        - id: fulfillment-dlq
          name: "Fulfillment DLQ"
          type: message_queue
          technology: "RabbitMQ DLQ"
          responsibility: "Dead letter quarantine queue."
          messaging:
            overload_policy: "alert_ops"
      connections:
        - id: c1
          from: customer
          to: order-api
          protocol: synchronous
          transport: https
        - id: c2
          from: order-api
          to: orders-db
          protocol: synchronous
          transport: tcp
        - id: c3
          from: order-api
          to: fulfillment-queue
          protocol: asynchronous
          transport: amqp
        - id: c4
          from: fulfillment-queue
          to: warehouse-worker
          protocol: asynchronous
          transport: amqp`,
    solutionArchSpecYaml: `archbench:
  spec_version: "0.1"
  project: lab-dual-write-order
  description: "Order service safely using Transactional Outbox + CDC."
system:
  context:
    users:
      - id: customer
        name: "Shopper"
  requirements:
    - id: REQ-ORDER-01
      category: functional
      priority: must
      statement: "Create customer orders and emit fulfillment events reliably."
      verification: architecture_check
architecture:
  alternatives:
    - id: transactional-outbox-fixed
      name: "Transactional Outbox + CDC Architecture"
      description: "Saves order and outbox row atomically in PostgreSQL before async relay."
      decisions:
        - id: ADR-001
          title: "Adopt Transactional Outbox Pattern for Order Events"
          status: accepted
          context: "Direct dual writes to PostgreSQL and RabbitMQ risk partial crash state drift."
          choice: "Persist domain mutation and outbox record inside the same local ACID transaction; relay via CDC."
          requirements: [REQ-ORDER-01]
      components:
        - id: order-api
          name: "Order Ingress API"
          type: service
          technology: "Go / HTTP"
          responsibility: "Creates orders and records outbox events atomically."
          requirements: [REQ-ORDER-01]
          deployment:
            replicas: 3
        - id: orders-db
          name: "Orders PostgreSQL DB"
          type: relational_database
          technology: "PostgreSQL 16"
          responsibility: "Stores authoritative orders and outbox table."
          requirements: [REQ-ORDER-01]
          data:
            ownership: "orders-domain"
        - id: fulfillment-queue
          name: "Fulfillment Queue"
          type: message_queue
          technology: "RabbitMQ"
          responsibility: "Queues warehouse dispatch jobs."
          requirements: [REQ-ORDER-01]
          messaging:
            delivery_semantics: at_least_once
            overload_policy: "shed_excess"
        - id: warehouse-worker
          name: "Warehouse Worker"
          type: background_worker
          technology: "Rust"
          responsibility: "Consumes fulfillment jobs idempotently."
          requirements: [REQ-ORDER-01]
          deployment:
            replicas: 2
          behavior:
            idempotent: true
            idempotency_key: "order_id"
            retry_policy:
              max_attempts: 3
              backoff: exponential
              dead_letter_target: fulfillment-dlq
        - id: fulfillment-dlq
          name: "Fulfillment DLQ"
          type: message_queue
          technology: "RabbitMQ DLQ"
          responsibility: "Dead letter quarantine queue."
          messaging:
            overload_policy: "alert_ops"
      connections:
        - id: c1
          from: customer
          to: order-api
          protocol: synchronous
          transport: https
        - id: c2
          from: order-api
          to: orders-db
          protocol: synchronous
          transport: tcp
        - id: c3
          from: order-api
          to: fulfillment-queue
          protocol: asynchronous
          transport: amqp
        - id: c4
          from: fulfillment-queue
          to: warehouse-worker
          protocol: asynchronous
          transport: amqp`,
  },

  "lab-spof-dlq-rescue": {
    id: "lab-spof-dlq-rescue",
    title: "Harden the Single-Node Payment Pipeline (SPOF + Missing DLQ)",
    missionBrief:
      "This payment gateway runs with 1 API replica (SPOF), unbounded fixed retries, no idempotency, and no Dead-Letter Queue. Open the lab, inspect Health findings, and harden it to 100 / 100.",
    labGoalPlainEnglish:
      "Add backup replicas so one crash doesn't stop checkouts, cap queue backpressure, prevent duplicate credit card charges with an Idempotency Key, limit retries with exponential backoff, and send corrupted payloads to a side DLQ.",
    starterYamlSnippet: `# Under ingress-api: deployment.replicas: 3
# Under charge-queue -> messaging:
overload_policy: "throttle_429_and_autoscale"
# Add a DLQ component (id: charge-dlq, type: message_queue), then on charge-worker:
behavior:
  idempotent: true
  idempotency_key: "charge_uuid"
  retry_policy:
    max_attempts: 4
    backoff: exponential
    dead_letter_target: charge-dlq`,
    targetRuleIds: ["REL-001", "REL-002", "REL-003", "REL-004", "SCAL-001"],
    startingScore: 60,
    targetScore: 100,
    xpReward: 75,
    hintSteps: [
      "Scale 'ingress-api' deployment.replicas from 1 to 3 across AZs (fixes REL-004).",
      "Add messaging.overload_policy: 'throttle_429' on 'charge-queue' (fixes SCAL-001).",
      "Set 'charge-worker' behavior.idempotent: true, backoff: exponential, max_attempts: 4, and dead_letter_target: 'charge-dlq' (fixes REL-001, REL-002, REL-003).",
    ],
    solutionSummary:
      "Eliminated articulation-point SPOFs, added queue overload bounds, enabled transaction idempotency, bounded exponential retries, and quarantined poison messages to a DLQ.",
    brokenArchSpecYaml: `archbench:
  spec_version: "0.1"
  project: lab-fragile-payments
  description: "Fragile payment workflow with SPOFs, unbounded fixed retries, and no DLQ."
system:
  context:
    users:
      - id: merchant
        name: "Merchant Checkout"
    external_systems:
      - id: bank-rail
        name: "Card Network"
        category: external_provider
  requirements:
    - id: REQ-CHARGE-01
      category: functional
      priority: must
      statement: "Process card payments safely without double-charges or downtime."
      verification: architecture_check
architecture:
  alternatives:
    - id: fragile-setup
      name: "Unprotected Single-Instance Pipeline"
      description: "Single gateway node, no queue backpressure policy, fixed retries without DLQ."
      components:
        - id: ingress-api
          name: "Payment Ingress Gateway"
          type: api_gateway
          technology: "Nginx"
          responsibility: "Routes merchant charge requests."
          requirements: [REQ-CHARGE-01]
          deployment:
            replicas: 1
        - id: charge-queue
          name: "Charge Job Queue"
          type: message_queue
          technology: "SQS"
          responsibility: "Buffers charge dispatch tasks."
          requirements: [REQ-CHARGE-01]
          messaging:
            delivery_semantics: at_least_once
        - id: charge-worker
          name: "Charge Worker"
          type: background_worker
          technology: "Node.js"
          responsibility: "Submits charges to Card Network."
          requirements: [REQ-CHARGE-01]
          deployment:
            replicas: 2
          behavior:
            idempotent: false
            retry_policy:
              max_attempts: 25
              backoff: fixed
      connections:
        - id: c1
          from: merchant
          to: ingress-api
          protocol: synchronous
          transport: https
        - id: c2
          from: ingress-api
          to: charge-queue
          protocol: asynchronous
          transport: https
        - id: c3
          from: charge-queue
          to: charge-worker
          protocol: asynchronous
          transport: https
        - id: c4
          from: charge-worker
          to: bank-rail
          protocol: synchronous
          transport: https`,
    solutionArchSpecYaml: `archbench:
  spec_version: "0.1"
  project: lab-fragile-payments
  description: "Hardened payment pipeline with Multi-AZ replicas, bounded jitter, idempotency, and DLQ."
system:
  context:
    users:
      - id: merchant
        name: "Merchant Checkout"
    external_systems:
      - id: bank-rail
        name: "Card Network"
        category: external_provider
  requirements:
    - id: REQ-CHARGE-01
      category: functional
      priority: must
      statement: "Process card payments safely without double-charges or downtime."
      verification: architecture_check
architecture:
  alternatives:
    - id: hardened-pipeline
      name: "Hardened Resilient Payment Pipeline"
      description: "Multi-AZ redundant gateway, bounded backpressure queue, exponential backoff, idempotency, and DLQ."
      components:
        - id: ingress-api
          name: "Payment Ingress Gateway"
          type: api_gateway
          technology: "AWS ALB / Envoy"
          responsibility: "Routes merchant charge requests across AZs."
          requirements: [REQ-CHARGE-01]
          deployment:
            replicas: 3
        - id: charge-queue
          name: "Charge Job Queue"
          type: message_queue
          technology: "SQS"
          responsibility: "Buffers charge dispatch tasks with overload protection."
          requirements: [REQ-CHARGE-01]
          messaging:
            delivery_semantics: at_least_once
            overload_policy: "throttle_429_and_autoscale"
        - id: charge-dlq
          name: "Charge Dead-Letter Queue"
          type: message_queue
          technology: "SQS DLQ"
          responsibility: "Quarantines exhausted poison charge payloads."
          messaging:
            overload_policy: "alert_oncall"
        - id: charge-worker
          name: "Charge Worker"
          type: background_worker
          technology: "Node.js"
          responsibility: "Submits idempotent charges to Card Network."
          requirements: [REQ-CHARGE-01]
          deployment:
            replicas: 4
          behavior:
            idempotent: true
            idempotency_key: "charge_uuid"
            retry_policy:
              max_attempts: 4
              backoff: exponential
              dead_letter_target: charge-dlq
      connections:
        - id: c1
          from: merchant
          to: ingress-api
          protocol: synchronous
          transport: https
        - id: c2
          from: ingress-api
          to: charge-queue
          protocol: asynchronous
          transport: https
        - id: c3
          from: charge-queue
          to: charge-worker
          protocol: asynchronous
          transport: https
        - id: c4
          from: charge-worker
          to: bank-rail
          protocol: synchronous
          transport: https`,
  },

  "lab-sync-chain-decouple": {
    id: "lab-sync-chain-decouple",
    title: "Break the 5-Hop Synchronous Cascading Chain",
    missionBrief:
      "User checkout synchronously chains through Gateway -> Auth -> Cart -> Pricing -> Shipping -> Ledger (5 hops). Any 1% latency spike cascades globally. Convert non-critical hops to async queues.",
    labGoalPlainEnglish:
      "Users should get their checkout confirmation quickly without waiting on slower post-order shipping calculations. Keep only Auth + Checkout Core -> DB synchronous (<= 3 hops), and push shipping work onto an async queue.",
    starterYamlSnippet: `# Shorten connections to: buyer -> api-gw -> checkout-core -> orders-db (synchronous)
# Then offload shipping asynchronously:
- id: c4
  from: checkout-core
  to: fulfillment-bus
  protocol: asynchronous
  transport: kafka`,
    targetRuleIds: ["STRUC-001"],
    startingScore: 80,
    targetScore: 100,
    xpReward: 75,
    hintSteps: [
      "Open Topology Canvas and trace the red synchronous call chain (STRUC-001).",
      "Decouple downstream Notification & Analytics/Shipping legs via an async message_queue.",
      "Click Re-evaluate until synchronous call depth <= 3 hops.",
    ],
    solutionSummary:
      "Truncated synchronous request path to 2 hops (Gateway -> Core Checkout -> DB) and offloaded shipping & receipt steps onto an async queue.",
    brokenArchSpecYaml: `archbench:
  spec_version: "0.1"
  project: lab-sync-cascade
  description: "Fragile 5-hop synchronous service call chain."
system:
  context:
    users:
      - id: buyer
        name: "Buyer"
  requirements:
    - id: REQ-CHK-01
      category: latency
      priority: must
      statement: "Checkout confirmation must respond under 150ms P99."
      target:
        p99_latency_ms: 150
      verification: capacity_analysis
architecture:
  alternatives:
    - id: deep-sync-chain
      name: "Deep 5-Hop Synchronous Chain"
      description: "Every downstream dependency blocks the caller HTTP thread."
      components:
        - id: api-gw
          name: "API Gateway"
          type: api_gateway
          technology: "Envoy"
          responsibility: "Routes ingress."
          requirements: [REQ-CHK-01]
          deployment: { replicas: 3 }
        - id: auth-svc
          name: "Auth Service"
          type: service
          technology: "Go"
          responsibility: "Validates token."
          requirements: [REQ-CHK-01]
          deployment: { replicas: 3 }
        - id: cart-svc
          name: "Cart Service"
          type: service
          technology: "Go"
          responsibility: "Fetches cart."
          requirements: [REQ-CHK-01]
          deployment: { replicas: 3 }
        - id: pricing-svc
          name: "Pricing Engine"
          type: service
          technology: "Python"
          responsibility: "Computes taxes & promos."
          requirements: [REQ-CHK-01]
          deployment: { replicas: 3 }
        - id: shipping-svc
          name: "Shipping Estimator"
          type: service
          technology: "Java"
          responsibility: "Queries carrier rates and persists shipping quotes."
          requirements: [REQ-CHK-01]
          deployment: { replicas: 3 }
        - id: orders-db
          name: "Orders & Quotes DB"
          type: relational_database
          technology: "PostgreSQL"
          responsibility: "Authoritative checkout & shipping quote store."
          requirements: [REQ-CHK-01]
          data: { ownership: "checkout-domain" }
      connections:
        - id: c1
          from: buyer
          to: api-gw
          protocol: synchronous
          transport: https
        - id: c2
          from: api-gw
          to: auth-svc
          protocol: synchronous
          transport: grpc
        - id: c3
          from: auth-svc
          to: cart-svc
          protocol: synchronous
          transport: grpc
        - id: c4
          from: cart-svc
          to: pricing-svc
          protocol: synchronous
          transport: grpc
        - id: c5
          from: pricing-svc
          to: shipping-svc
          protocol: synchronous
          transport: grpc
        - id: c6
          from: shipping-svc
          to: orders-db
          protocol: synchronous
          transport: tcp`,
    solutionArchSpecYaml: `archbench:
  spec_version: "0.1"
  project: lab-sync-cascade
  description: "Shallow synchronous path with async post-checkout event decoupling."
system:
  context:
    users:
      - id: buyer
        name: "Buyer"
  requirements:
    - id: REQ-CHK-01
      category: latency
      priority: must
      statement: "Checkout confirmation must respond under 150ms P99."
      target:
        p99_latency_ms: 150
      verification: capacity_analysis
architecture:
  alternatives:
    - id: async-decoupled
      name: "Shallow Sync Core + Async Event Bus"
      description: "Responds in 2 hops; post-order fulfillment flows asynchronously via Outbox."
      decisions:
        - id: ADR-SYNC
          title: "Transactional Outbox + Shallow Sync Core"
          status: accepted
          context: "Deep sync chains compound tail latency and risk failure cascades."
          choice: "Commit checkout + outbox row in orders-db and relay post-order shipping via Kafka."
          requirements: [REQ-CHK-01]
      components:
        - id: api-gw
          name: "API Gateway"
          type: api_gateway
          technology: "Envoy"
          responsibility: "Terminates TLS and verifies JWT locally."
          requirements: [REQ-CHK-01]
          deployment: { replicas: 3 }
        - id: checkout-core
          name: "Checkout Core Service"
          type: service
          technology: "Go"
          responsibility: "Handles cart validation and pricing synchronously."
          requirements: [REQ-CHK-01]
          deployment: { replicas: 3 }
        - id: orders-db
          name: "Orders & Outbox DB"
          type: relational_database
          technology: "PostgreSQL"
          responsibility: "Stores checkout rows and outbox table."
          requirements: [REQ-CHK-01]
          data: { ownership: "checkout-domain" }
        - id: fulfillment-bus
          name: "Fulfillment Event Stream"
          type: event_stream
          technology: "Kafka"
          responsibility: "Broadcasts OrderConfirmed events."
          requirements: [REQ-CHK-01]
          messaging:
            delivery_semantics: at_least_once
            overload_policy: "partition_backpressure"
        - id: shipping-worker
          name: "Shipping Fulfillment Worker"
          type: background_worker
          technology: "Java"
          responsibility: "Arranges carrier dispatch asynchronously."
          requirements: [REQ-CHK-01]
          deployment: { replicas: 3 }
          behavior:
            idempotent: true
            idempotency_key: "order_id"
            retry_policy:
              max_attempts: 4
              backoff: exponential
              dead_letter_target: shipping-dlq
        - id: shipping-dlq
          name: "Shipping DLQ"
          type: message_queue
          technology: "Kafka DLQ"
          responsibility: "Quarantines failed dispatches."
          messaging:
            overload_policy: "alert_ops"
      connections:
        - id: c1
          from: buyer
          to: api-gw
          protocol: synchronous
          transport: https
        - id: c2
          from: api-gw
          to: checkout-core
          protocol: synchronous
          transport: grpc
        - id: c3
          from: checkout-core
          to: orders-db
          protocol: synchronous
          transport: tcp
        - id: c4
          from: checkout-core
          to: fulfillment-bus
          protocol: asynchronous
          transport: kafka
        - id: c5
          from: fulfillment-bus
          to: shipping-worker
          protocol: asynchronous
          transport: kafka`,
  },
};
