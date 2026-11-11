import { LearningCard } from "./types.js";

export const LEARNING_CATALOG: LearningCard[] = [
  {
    id: "concept-backpressure",
    concept: "Backpressure & Queue Management",
    title: "Handling Producer-Consumer Speed Asymmetry",
    ruleIds: ["SCAL-001"],
    plainEnglishAnalogy:
      "Think of pouring water through a narrow kitchen funnel: if you pour faster than the spout drains, the funnel overflows unless you tell the person holding the pitcher to slow down.",
    summary: "Mechanisms to bound buffer accumulation and signal upstream producers when consumer throughput degrades.",
    whyItMatters: "Without backpressure, producers that outpace consumers cause unbounded memory or disk backlog growth. A transient downstream slowdown turns into hours of catastrophic recovery delay.",
    concreteFailureExample: "During an external email provider slowdown, API acceptance continues at 5,000 req/sec while workers only dispatch 1,000 req/sec. The queue swells to 20 million messages, exhausts node memory, and causes consumer timeouts.",
    mitigationOptions: [
      "Define explicit maximum queue backlog and message age thresholds.",
      "Implement client-facing rate limiting and HTTP 429 (Too Many Requests) when queue depth reaches capacity.",
      "Deploy consumer horizontal autoscaling triggered by queue message age.",
      "Configure load shedding for low-priority notification channels.",
    ],
    verificationApproach: "Run an analytical or discrete scenario simulating a 5x worker slowdown for 15 minutes to verify backlog bounds and recovery time within RTO.",
    furtherReading: [
      "Bounded-Buffer Backpressure & HTTP 429 Load Shedding",
      "ArchBench Rule SCAL-001",
    ],
  },
  {
    id: "concept-idempotency",
    concept: "At-Least-Once Delivery & Idempotency",
    title: "Guaranteeing Correctness Under Duplicate Delivery",
    ruleIds: ["REL-002"],
    plainEnglishAnalogy:
      "Pressing an elevator Call button 5 times in a row only summons one elevator, because the elevator remembers a request is already in progress. Idempotency-Keys work the exact same way for payments and webhooks.",
    summary: "Ensuring operations yield identical state effects regardless of how many times duplicate requests or messages are executed.",
    whyItMatters: "Distributed messaging systems (SQS, Kafka, RabbitMQ) cannot guarantee exactly-once delivery across network partitions without distributed two-phase commit. Network retries frequently produce duplicate deliveries.",
    concreteFailureExample: "A worker charges a user credit card and updates the database, but crashes before acknowledging the message to the queue. The queue redelivers the message to another worker replica, double-charging the customer.",
    mitigationOptions: [
      "Enforce unique business transaction idempotency keys (e.g., payment_id, notification_id).",
      "Check an atomic state store (e.g., Redis SETNX or SQL unique constraint insert) before processing side effects.",
      "Design domain operations as naturally commutative or upsert operations.",
    ],
    verificationApproach: "Run a scenario delivering identical messages concurrently or sequentially to verify deduplication behavior.",
    furtherReading: [
      "At-Least-Once Delivery & Atomic Idempotency Keys",
      "ArchBench Rule REL-002",
    ],
  },
  {
    id: "concept-outbox",
    concept: "Transactional Outbox Pattern & Dual Writes",
    title: "Atomic State Updates Across Database and Message Brokers",
    ruleIds: ["DATA-001"],
    plainEnglishAnalogy:
      "Instead of dropping cash in one mailbox and walking across the street to drop the receipt in another (where you might trip halfway!), put both cash and receipt inside the SAME sealed envelope.",
    summary: "Writing state changes and outbound event messages atomically in a single local database transaction.",
    whyItMatters: "Direct dual writes (writing to SQL DB then publishing to Kafka/RabbitMQ in an application handler) lack atomic commit guarantees. Crashing between the two steps results in permanent state desynchronization.",
    concreteFailureExample: "An API handler saves an order to PostgreSQL, but the server crashes before it can emit the 'OrderCreated' event to RabbitMQ. The customer sees their order confirmed, but the warehouse shipping worker never receives the event.",
    mitigationOptions: [
      "Transactional Outbox Pattern: Save event to an 'outbox' table in the same database transaction as the business entity.",
      "Deploy a dedicated outbox relay worker or Change Data Capture (CDC via Debezium) to publish outbox events to the message broker.",
      "Listen-to-yourself pattern using an append-only event log.",
    ],
    verificationApproach: "Inspect component connection graphs for dual outgoing edges to both database and message queue without an Outbox ADR.",
    furtherReading: [
      "Transactional Outbox Atomicity & CDC Relay Patterns",
      "ArchBench Rule DATA-001",
    ],
  },
  {
    id: "concept-sync-chains",
    concept: "Distributed Latency & Synchronous Call Coupling",
    title: "Preventing Compounding Latency and Availability Degradation",
    ruleIds: ["STRUC-001"],
    plainEnglishAnalogy:
      "Waiting on the phone while Support puts you on hold to call Billing, who puts Support on hold to call Shipping: one slow desk freezes every caller waiting at the front of the line.",
    summary: "Avoiding deep synchronous request chains where service A calls B, which calls C, which calls D before returning.",
    whyItMatters: "Synchronous call chains compound network latency and multiply failure probability. If each service has 99% availability, a 4-hop chain has only 0.99^4 = 96% availability.",
    concreteFailureExample: "A user checkout request synchronously calls the Auth Service, Cart Service, Inventory Service, and Payment Gateway. Any slowdown in Payment blocks threads across Cart and Auth, causing a cascading outage.",
    mitigationOptions: [
      "Convert non-essential operations to asynchronous event streams or queues.",
      "Consolidate tightly coupled services into a single modular deployable unit.",
      "Implement timeouts, circuit breakers, and cached fallback read models.",
    ],
    verificationApproach: "Run graph critical-path analysis to ensure synchronous call depth from external ingress to sink does not exceed 3 hops.",
    furtherReading: [
      "Dean & Barroso: The Tail at Scale (CACM 2013)",
      "ArchBench Rules STRUC-001 & STRUC-002",
    ],
  },
  {
    id: "concept-spof",
    concept: "Single Point of Failure (SPOF) & Articulation Points",
    title: "Eliminating Topological Chokepoints",
    ruleIds: ["REL-004"],
    plainEnglishAnalogy:
      "A suspension bridge held up by ONE single anchor bolt: no matter how thick the other steel cables are, if that single bolt snaps, nobody can cross.",
    summary: "Identifying nodes whose failure partitions the system network and ensuring they possess active redundancy.",
    whyItMatters: "A system is only as reliable as its weakest non-redundant component. If an articulation point has only 1 replica, any host failure causes total service disruption.",
    concreteFailureExample: "A system runs an API gateway with 1 container instance. An AWS node reboot takes the gateway offline for 4 minutes, failing 100% of incoming customer traffic despite backend services being healthy.",
    mitigationOptions: [
      "Deploy at least 2 replicas across distinct availability zones behind an active load balancer.",
      "Configure automatic horizontal pod autoscaling with minimum replica thresholds.",
      "Ensure stateless services handle failover seamlessly.",
    ],
    verificationApproach: "Execute Hopcroft-Tarjan articulation point analysis on the architecture graph and cross-reference with deployment replica counts.",
    furtherReading: [
      "Hopcroft-Tarjan Graph Articulation Points & Multi-AZ Redundancy",
      "ArchBench Rule REL-004",
    ],
  },
  {
    id: "concept-bounded-retries",
    concept: "Retry Storms & Exponential Backoff with Jitter",
    title: "Protecting Failing Downstream Systems from Overload",
    ruleIds: ["REL-001"],
    plainEnglishAnalogy:
      "If 1,000 callers hit redial at the exact same millisecond after a cafe's phone line drops, they crash the phone again. Waiting progressively longer plus randomizing each caller's wait lets the cafe breathe.",
    summary: "Bounding retry attempts and randomizing backoff intervals to prevent thundering herd behavior.",
    whyItMatters: "When an external service experiences transient degradation, thousands of client workers retrying immediately and continuously turn a minor hiccup into a prolonged, catastrophic total outage.",
    concreteFailureExample: "A payment gateway experiences a 10-second latency spike. 500 worker instances retry every second simultaneously with fixed backoff, hitting the gateway with 5,000 req/sec and crashing it completely.",
    mitigationOptions: [
      "Enforce maximum retry attempts (recommended: 3 to 5).",
      "Apply exponential backoff: interval = base * 2^attempt.",
      "Add randomized full jitter: wait_time = random(0, interval).",
      "Trip a circuit breaker when failure rate exceeds 50% over a 30-second window.",
    ],
    verificationApproach: "Inspect all component and connection retry policies to verify explicit max_attempts <= 10 and exponential backoff.",
    furtherReading: [
      "Full Jitter Exponential Backoff & Retry Budgets",
      "ArchBench Rule REL-001",
    ],
  },
  {
    id: "concept-dlq",
    concept: "Dead-Letter Queues & Poison Message Quarantine",
    title: "Isolating Corrupted Messages to Protect Consumer Workers",
    ruleIds: ["REL-003"],
    plainEnglishAnalogy:
      "An airport baggage scanner pulls torn suitcases off onto a side repair belt (`DLQ`) so one broken bag never stops the whole luggage carousel forever.",
    summary: "Routing messages that exceed maximum delivery attempts to a secondary quarantine queue for offline diagnosis.",
    whyItMatters: "A 'poison pill' message (e.g. malformed JSON or unhandled null field) that crashes worker parsing will be retried infinitely without a DLQ, consuming 100% of worker CPU and stalling all valid traffic.",
    concreteFailureExample: "A client sends a notification with an invalid Unicode character. Every worker that pulls it crashes with an unhandled exception. The queue redelivers it forever, bringing down all 12 worker processes.",
    mitigationOptions: [
      "Configure a dead-letter queue (DLQ) target on the message queue or worker retry policy.",
      "Set max retry delivery count before dead-letter routing (typically 3-5).",
      "Set up CloudWatch / Prometheus alerts on DLQ message depth > 0.",
    ],
    verificationApproach: "Verify that all background workers consuming from queues define an explicit dead_letter_target.",
    furtherReading: [
      "Poison Pill Quarantine & Dead-Letter Replay Queues",
      "ArchBench Rule REL-003",
    ],
  },
  {
    id: "concept-just-enough",
    concept: "JustEnough Architecture & Occam's Razor",
    title: "Earning Complexity Through Measurable Requirements",
    ruleIds: ["REQ-COV-001", "REQ-COV-002", "STRUC-002"],
    plainEnglishAnalogy:
      "Don't buy an 18-wheeler tractor-trailer to deliver neighborhood pizzas — start with a reliable delivery car (`Modular Monolith`) and upgrade only when measured volume proves you need it.",
    summary: "Selecting the least complex architecture that demonstrably satisfies known requirements and operating constraints.",
    whyItMatters: "Overengineering introduces immense cognitive load, operational fragility, multiple deployment pipelines, distributed debugging headaches, and high cloud bills without providing user value.",
    concreteFailureExample: "A startup team of 3 developers builds a 15-microservice Kubernetes system with Kafka for a product handling 2 requests per second. The team spends 80% of their time fixing deployment Helm charts and network policies instead of shipping product features.",
    mitigationOptions: [
      "Start with a well-structured modular monolith unless independent scaling, release cycles, or team ownership mandate distribution.",
      "Require every distributed infrastructure element (Kafka, Redis, K8s) to cite a specific non-functional requirement.",
      "Record explicit evolution triggers defining the measurable threshold that will justify moving to a more complex architecture.",
    ],
    verificationApproach: "Run JustEnough complexity assessment to inspect component-to-requirement traceability and detect speculative infrastructure.",
    furtherReading: [
      "Modular Monolith First & Concrete Evolution Triggers",
      "ArchBench JustEnough Rules REQ-COV-001/002",
    ],
  },
];

