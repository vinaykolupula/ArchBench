import { SystemDesignLesson } from "../types.js";
import { BREAK_AND_FIX_LABS } from "./labs.js";

export const LESSONS_RELIABILITY: SystemDesignLesson[] = [
  {
    id: "lesson-queues-streams",
    trackId: "track-reliability",
    order: 1,
    title: "Message Queues (SQS/RabbitMQ) vs Event Streams (Kafka)",
    subtitle: "Point-to-point transient task buffers vs immutable partitioned replay logs.",
    difficulty: "foundation",
    estimatedMinutes: 8,
    xpReward: 50,
    tags: ["kafka", "rabbitmq", "sqs", "pub-sub", "consumer-groups"],
    componentTypes: ["message_queue", "event_stream"],
    plainEnglishAnalogy:
      "A traditional queue (like SQS/RabbitMQ) is like a cafe order ticket spindle: once a cook pulls a ticket and cooks it, that ticket is gone forever. An append-only event log (like Kafka) is like a shared printed daily ledger: Billing, Fraud, and Analytics can all read the exact same events independently — and rewind back to Tuesday if someone deploys a bug.",
    keyTerms: [
      { term: "Consumer Group", plainMeaning: "A team of worker instances sharing a Kafka topic so each message is handled once by the team." },
      { term: "Partition Concurrency Cap", plainMeaning: "Inside one consumer group, at most one worker reads each Kafka partition at a time (12 pods on 4 partitions leaves 8 idle)." },
      { term: "Offset Replay", plainMeaning: "Remembering the numbered position (`offset`) where a team left off, allowing instant rewind during recovery." },
      { term: "Backpressure", plainMeaning: "Letting producers know consumers are full before queues fill RAM and crash the broker." },
    ],
    summary:
      "Traditional queues delete messages once ACKed; partitioned event streams retain immutable ordered logs so multiple independent consumer groups can replay history.",
    whyItMatters:
      "Picking SQS when 5 downstream services (Billing, Fraud, Analytics, Search) all need independent consumption requires complex SNS fan-out — whereas Kafka gives zero-copy multi-consumer fan-out natively via offsets.",
    coreEntities: [
      {
        name: "Task Queue (SQS / RabbitMQ)",
        category: "Point-to-Point Work",
        responsibility: "Distributes competing jobs across N workers; auto-deletes messages upon consumer ACK.",
        whenToUse: "Email sending, PDF rendering, per-item retries with built-in visibility timeout.",
      },
      {
        name: "Partitioned Log (Kafka / Pulsar)",
        category: "Append-Only Stream",
        responsibility: "Maintains strictly ordered messages per Partition Key; tracks consumer group offsets for replay.",
        whenToUse: "Clickstreams, audit/ledger streams, CDC outbox relays, analytics fan-out.",
      },
    ],
    tradeOffs: [
      {
        approach: "Queue (RabbitMQ / SQS)",
        pros: ["Simple worker auto-scaling", "Per-message delay & DLQ primitives out of the box"],
        cons: ["Cannot replay yesterday's events once consumed"],
        bestFor: "Async background tasks and job dispatch",
      },
      {
        approach: "Event Log (Kafka)",
        pros: ["Millions of msgs/sec sequential I/O", "Multiple independent consumers & time-travel replay"],
        cons: ["Strict ordering limits concurrency to # partitions; higher cluster operational footprint"],
        bestFor: "Event-driven architectures, stream processing, telemetry",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Remember Kafka's concurrency limit: within one topic, at most 1 consumer per partition in a consumer group can read concurrently — partition by `entity_id` only when strict order matters.",
        failurePrevented: "Stops teams from spinning up 50 Kafka consumer pods on a 4-partition topic wondering why 46 sit idle.",
        redFlagToAvoid: "Using Kafka as a general-purpose SQL database query engine.",
      },
    ],
    quizzes: [
      {
        id: "quiz-qs-1",
        scenarioPrompt:
          "You create a Kafka topic `orders` with 4 partitions. Under load, you scale your consumer group to 12 worker pods, yet throughput stops improving beyond 4 pods. Why?",
        options: [
          { id: "a", label: "Each partition can only be assigned to 1 active consumer inside a consumer group — 8 pods stay idle", explanation: "Correct! To utilize 12 workers in Kafka, the topic needs >= 12 partitions!" },
          { id: "b", label: "Kafka consumers require sticky sessions on DNS", explanation: "Partition assignment is coordinated by the Kafka Group Coordinator, independent of DNS." },
        ],
        correctOptionId: "a",
        xpReward: 45,
      },
    ],
    furtherReading: ["Competing-Consumer Task Queues vs Append-Only Event Logs", "Partitioned Topic Consumer Groups & Offset Replay"],
  },
  {
    id: "concept-backpressure",
    trackId: "track-reliability",
    order: 2,
    title: "Backpressure & Queue Overload Control [SCAL-001]",
    subtitle: "Bounding buffer growth when producers outrun downstream workers.",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    xpReward: 55,
    ruleIds: ["SCAL-001"],
    tags: ["backpressure", "queues", "load-shedding", "overload"],
    componentTypes: ["message_queue", "event_stream", "background_worker"],
    plainEnglishAnalogy:
      "Imagine pouring water through a narrow kitchen funnel: if the pitcher pours at 5 gallons/min while the spout drains at 1 gallon/min, the funnel overflows unless you shout \"Slow down!\" (`HTTP 429`) and close the tap (`Bounded Queue`). Unbounded queues turn a 5-minute glitch into a 4-hour memory-exhaustion crash.",
    keyTerms: [
      { term: "Queue Depth vs Queue Age", plainMeaning: "Count measures backlog size; Age measures how long the oldest job has waited — age catches stuck workers far earlier." },
      { term: "HTTP 429 & Retry-After", plainMeaning: "Standard server response politely asking callers to pause instead of crashing both tiers." },
      { term: "Load Shedding", plainMeaning: "Deliberately dropping low-priority requests (e.g., promo analytics) during emergencies so core checkouts stay green." },
      { term: "Bounded Buffer", plainMeaning: "Setting a strict max capacity on memory/queues so spikes reject cleanly instead of OOM-killing servers." },
    ],
    summary:
      "Mechanisms to cap backlog growth and return fast HTTP 429 / load shedding when consumer throughput drops below ingress rate.",
    whyItMatters:
      "Without backpressure, a transient downstream API slowdown causes millions of messages to pile up, blowing RAM budgets and delaying recovery for hours.",
    coreEntities: [
      {
        name: "Bounded Queue Policy",
        category: "Stability Control",
        responsibility: "Enforces max backlog depth, TTL expiry, and consumer autoscale triggers based on message age.",
        whenToUse: "Every asynchronous buffer in ArchSpec (`messaging.overload_policy`).",
      },
    ],
    tradeOffs: [
      {
        approach: "Fail-Fast Load Shedding (HTTP 429 / Drop Low-Priority)",
        pros: ["Protects core system latency", "Allows critical priority traffic through"],
        cons: ["Low-priority callers must handle 429 retries"],
        bestFor: "Ingress gateways protecting saturated worker queues",
      },
      {
        approach: "Unbounded Elastic Buffering",
        pros: ["Never rejects an HTTP 202"],
        cons: ["SLA death spiral: consumers spend hours chewing stale expired requests"],
        bestFor: "Rarely safe unless consumer backlog can burst-scale 20x",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Autoscale queue workers by Oldest Message Age (lag time), not just raw CPU % — workers blocked on slow downstream I/O sit at 5% CPU while lag explodes.",
        failurePrevented: "Prevents autoscaler blindness during external API slowdowns.",
        redFlagToAvoid: "Treating a queue as infinitely elastic memory that magically makes slow services fast.",
      },
    ],
    quizzes: [
      {
        id: "quiz-bp-1",
        scenarioPrompt:
          "Your email worker slows from 5,000/s to 500/s due to an ISP throttle. CPU stays at 8%. Why did CPU-based Kubernetes HPA fail to scale workers, and what protects the queue?",
        options: [
          { id: "a", label: "I/O-bound wait keeps CPU low; trigger KEDA/autoscaling on queue message age + add HTTP 429 overload policy", explanation: "Correct! Queue depth/age metrics + upstream load shedding keep the system bounded." },
          { id: "b", label: "Increase queue visibility timeout to 24 hours", explanation: "Longer visibility timeouts hide stuck tasks longer instead of resolving speed asymmetry." },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    lab: BREAK_AND_FIX_LABS["lab-spof-dlq-rescue"],
    furtherReading: ["Bounded-Buffer Queuing Theory & Producer Backpressure", "ArchBench Rule SCAL-001"],
  },
  {
    id: "concept-idempotency",
    trackId: "track-reliability",
    order: 3,
    title: "At-Least-Once Delivery & Idempotency [REL-002]",
    subtitle: "Making retries and duplicate queue deliveries 100% mathematically safe.",
    difficulty: "foundation",
    estimatedMinutes: 8,
    xpReward: 55,
    ruleIds: ["REL-002"],
    tags: ["idempotency", "at-least-once", "payments", "stripe"],
    componentTypes: ["background_worker", "service"],
    plainEnglishAnalogy:
      "Pressing an elevator \"Call\" button five times while impatient doesn't summon five elevators — because the controller knows one call is already active. An `Idempotency-Key` works the exact same way on `POST /pay`: if flaky Wi-Fi sends your payment retry three times, the server sees the same unique key and charges your card only ONCE.",
    keyTerms: [
      { term: "At-Least-Once Delivery", plainMeaning: "Queues guarantee messages won't be lost, which means rare network glitches WILL deliver the same message 2+ times." },
      { term: "Idempotency Key", plainMeaning: "A client-generated UUID per user action (e.g. clicking Pay) stored with a unique DB constraint to block duplicates." },
      { term: "Safe Atomic Deduplication", plainMeaning: "Claiming the key via `INSERT ... ON CONFLICT DO NOTHING` inside SQL before triggering card network side effects." },
      { term: "Deterministic Replay Response", plainMeaning: "Returning the saved receipt cleanly on retry instead of throwing a confusing `409 Conflict` to the mobile app." },
    ],
    summary:
      "Distributed brokers guarantee At-Least-Once delivery across crashes; idempotency keys ensure duplicate executions never create duplicate state mutations.",
    whyItMatters:
      "If a payment worker charges Visa and crashes 2ms before sending the queue ACK, SQS/RabbitMQ redelivers the job. Without an idempotency key, the customer is charged twice.",
    coreEntities: [
      {
        name: "Idempotency Key + Atomic Dedupe Store",
        category: "Correctness Guard",
        responsibility: "Client attaches UUID `idempotency_key`; server records `INSERT ... ON CONFLICT DO NOTHING` before side effects.",
        whenToUse: "Payments, bookings, notifications, any non-idempotent POST mutation.",
      },
    ],
    tradeOffs: [
      {
        approach: "Idempotent Keys + At-Least-Once",
        pros: ["Simpler & vastly faster than distributed 2PC exactly-once", "Safe against retries & replays"],
        cons: ["Requires storing seen key TTL window in DB or Redis"],
        bestFor: "99% of production payment, checkout, and webhook pipelines",
      },
      {
        approach: "At-Most-Once (No Retries)",
        pros: ["Zero duplicate writes"],
        cons: ["Drops real user transactions silently on transient network blips"],
        bestFor: "Non-critical UDP metrics beacons",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Store idempotency records inside the SAME database transaction as the business mutation so checking the key and saving the order are atomic.",
        failurePrevented: "Eliminates the race where Redis dedupe checks pass for two parallel retries simultaneously.",
        redFlagToAvoid: "Claiming Kafka 'Exactly-Once' magically protects external Stripe API HTTP calls from duplicates.",
      },
    ],
    quizzes: [
      {
        id: "quiz-idem-1",
        scenarioPrompt:
          "A mobile client loses LTE coverage right after hitting `POST /pay`, retries 3 seconds later, and hits a different backend container. How do you guarantee the card is charged exactly once?",
        options: [
          { id: "a", label: "Client generates an `Idempotency-Key` UUID per checkout attempt; backend uniquely constraints it in Postgres", explanation: "Correct! The second retry returns the cached initial receipt cleanly." },
          { id: "b", label: "Use HTTP PUT instead of POST without changing server logic", explanation: "HTTP verb conventions do not enforce server-side atomicity across retries." },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    lab: BREAK_AND_FIX_LABS["lab-spof-dlq-rescue"],
    furtherReading: ["At-Least-Once Delivery & Atomic Idempotency Keys", "ArchBench Rule REL-002"],
  },
  {
    id: "concept-bounded-retries",
    trackId: "track-reliability",
    order: 4,
    title: "Retry Storms, Exponential Backoff + Jitter & Circuit Breakers [REL-001]",
    subtitle: "Stop amplifying downstream outages into self-inflicted DDOS meltdowns.",
    difficulty: "intermediate",
    estimatedMinutes: 9,
    xpReward: 65,
    ruleIds: ["REL-001"],
    tags: ["retries", "jitter", "circuit-breaker", "thundering-herd", "resilience"],
    plainEnglishAnalogy:
      "If 1,000 people get disconnected from a restaurant phone line and hit redial at the EXACT same second (`Fixed Backoff`), the phone stays jammed forever (`Retry Storm`). Waiting slightly longer each attempt PLUS adding random seconds (`Full Jitter`) spreads callers smoothly — while a Circuit Breaker stops dialing altogether for 30s if the phone line is clearly dead.",
    keyTerms: [
      { term: "Thundering Herd / Retry Amplification", plainMeaning: "When thousands of callers retry failing requests in lockstep, turning a 2-second hiccup into a full outage." },
      { term: "Exponential Backoff + Full Jitter", plainMeaning: "Doubling wait times (`1s, 2s, 4s`) multiplied by a random number so synchronized storms scatter peacefully." },
      { term: "Circuit Breaker (CLOSED / OPEN / HALF-OPEN)", plainMeaning: "Automatically failing fast locally when error rates spike instead of burning threads waiting for dead timeouts." },
      { term: "Retry Budget (`<= 5`)", plainMeaning: "Limiting retries per hop so a 3-layer chain (`3 x 3 x 3 = 27x`) never explodes backend traffic." },
    ],
    summary:
      "Naive immediate or fixed-interval retries multiply load during brownouts; Exponential Backoff + Full Jitter spreads recovery, while Circuit Breakers shed dead dependencies locally.",
    whyItMatters:
      "In the live simulator below, watch 50 workers turn a 3-second glitch into a permanent collapse unless Jitter & Circuit Breaking (`CLOSED -> OPEN -> HALF-OPEN`) are enabled.",
    interactiveSim: "retry-circuit-breaker",
    coreEntities: [
      {
        name: "Full Jitter Exponential Backoff",
        category: "Retry Shaping",
        responsibility: "wait = random(0, min(cap, base * 2^attempt)) — desynchronizes retry waves cleanly.",
        whenToUse: "Every remote network call (`max_attempts <= 5`).",
      },
      {
        name: "Circuit Breaker State Machine",
        category: "Fail-Fast Fuse",
        responsibility: "Trips OPEN when error rate > threshold -> fast fails immediately without hitting saturated downstream -> probes HALF-OPEN.",
        whenToUse: "Calls to external vendors or critical shared microservices.",
      },
    ],
    tradeOffs: [
      {
        approach: "Fixed Interval Retries",
        pros: ["Predictable timer"],
        cons: ["Creates synchronized thundering-herd spikes crushing recovering servers"],
        bestFor: "Almost never in distributed microservices",
      },
      {
        approach: "Bounded Exponential + Jitter + Circuit Breaker",
        pros: ["Prevents self-DDOS", "Preserves worker thread pools via fail-fast OPEN state"],
        cons: ["Needs carefully tuned error-threshold & half-open probe intervals"],
        bestFor: "All resilient distributed RPC/HTTP edges",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Never retry at multiple layers simultaneously! If API Gateway retries 3x AND App Service retries 3x AND DB Client retries 3x, 1 failed call triggers 3 x 3 x 3 = 27 downstream requests.",
        failurePrevented: "Eliminates multiplicative retry amplification cascades.",
        redFlagToAvoid: "Setting `max_attempts: 50` with `fixed` backoff.",
      },
    ],
    quizzes: [
      {
        id: "quiz-retry-1",
        scenarioPrompt:
          "API Gateway has 3 retries, Order Service has 3 retries, and Inventory Service has 3 retries against Postgres. If Postgres stalls for 200ms, how much retry amplification hits Postgres per user request?",
        options: [
          { id: "a", label: "3 requests", explanation: "Too low — each layer amplifies its parent's retries multiplicatively!" },
          { id: "b", label: "27 requests (3 x 3 x 3 exponential retry cascade)", explanation: "Correct! Always concentrate retries at a single outer edge or attach an explicit Retry Budget." },
        ],
        correctOptionId: "b",
        xpReward: 50,
      },
    ],
    lab: BREAK_AND_FIX_LABS["lab-spof-dlq-rescue"],
    furtherReading: ["Exponential Backoff with Full Jitter & Retry Budgets", "Circuit Breaker State Machine & ArchBench Rule REL-001"],
  },
  {
    id: "concept-dlq",
    trackId: "track-reliability",
    order: 5,
    title: "Dead-Letter Queues & Poison Pill Quarantine [REL-003]",
    subtitle: "Isolating unprocessable payloads so 1 malformed JSON doesn't crash your entire worker cluster.",
    difficulty: "foundation",
    estimatedMinutes: 6,
    xpReward: 45,
    ruleIds: ["REL-003"],
    tags: ["dlq", "poison-pill", "workers", "queues"],
    componentTypes: ["message_queue", "background_worker"],
    plainEnglishAnalogy:
      "Think of an airport luggage belt: if one cracked suitcase spills onto the tracks and jams the scanner (`Poison Pill Message`), healthy workers keep picking it up and crashing on an infinite loop — freezing 10,000 normal passengers' bags behind it! A Dead-Letter Queue (`DLQ`) automatically pulls any bag that fails 3 tries onto a quiet side inspection table so valid traffic keeps zooming along.",
    keyTerms: [
      { term: "Poison Pill Message", plainMeaning: "A malformed payload or edge-case bug causing workers to crash identically on every redelivery attempt." },
      { term: "Max Receive / Retry Count", plainMeaning: "After `3–5` failed attempts, the broker stops blocking the main queue and moves the item aside." },
      { term: "Dead-Letter Queue (DLQ)", plainMeaning: "A quarantined side queue preserving failed events safely for engineer inspection and targeted replay." },
      { term: "DLQ Depth Alert", plainMeaning: "Pager/metric monitor firing whenever `dlq_messages > 0` so silent failures never go unnoticed." },
    ],
    summary:
      "Messages failing past `max_attempts` move to a Dead-Letter Queue (DLQ) for alerting and manual/automated replay instead of spinning infinitely.",
    whyItMatters:
      "A single poison message (corrupt protobuf, null user ref) will crash-loop every worker replica in turn unless evicted to a DLQ after 3–5 attempts.",
    coreEntities: [
      {
        name: "Dead-Letter Quarantine Channel",
        category: "Isolation",
        responsibility: "Stores exhausted payloads + error stack trace metadata; triggers on-call alert if depth > 0.",
        whenToUse: "Paired with every asynchronous `background_worker` consuming from a queue.",
      },
    ],
    tradeOffs: [
      {
        approach: "Quarantine to DLQ after N retries",
        pros: ["Unblocks healthy traffic immediately", "Zero silent data loss"],
        cons: ["Requires replay tooling once bug is fixed"],
        bestFor: "Every async production worker pipeline",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Pair every DLQ with an automated alerting monitor AND an idempotent 'redrive/replay' script once the bug is patched.",
        failurePrevented: "Prevents DLQs from turning into silent 'data graveyards' nobody ever checks.",
        redFlagToAvoid: "Adding retries without defining what happens when retries exhaust.",
      },
    ],
    quizzes: [
      {
        id: "quiz-dlq-1",
        scenarioPrompt:
          "1 malformed billing payload enters RabbitMQ. Worker 1 throws a NullPointerException and crashes; RabbitMQ immediately hands it to Worker 2, which crashes too. Within 30 seconds all 12 workers crash-loop. What missing feature prevented isolation?",
        options: [
          { id: "a", label: "A Dead-Letter Queue (`dead_letter_target`) bounded at 3 delivery attempts", explanation: "Correct! Routing poison pills out after 3–5 attempts saves the remaining 99.99% valid traffic." },
          { id: "b", label: "Switching RabbitMQ from TCP to UDP", explanation: "UDP drops packets unpredictably and breaks reliable messaging." },
        ],
        correctOptionId: "a",
        xpReward: 45,
      },
    ],
    lab: BREAK_AND_FIX_LABS["lab-spof-dlq-rescue"],
    furtherReading: ["Poison Message Quarantine & Dead-Letter Replay Pipelines", "ArchBench Rule REL-003"],
  },
  {
    id: "concept-spof",
    trackId: "track-reliability",
    order: 6,
    title: "Single Points of Failure & Articulation Points [REL-004]",
    subtitle: "Using Hopcroft-Tarjan graph theory to spot structural chokepoints before outages happen.",
    difficulty: "foundation",
    estimatedMinutes: 7,
    xpReward: 50,
    ruleIds: ["REL-004"],
    tags: ["spof", "high-availability", "multi-az", "graph-theory"],
    plainEnglishAnalogy:
      "Picture a suspension bridge held up by ONE single center bolt (`Articulation Point` / `Single Point of Failure`): it doesn't matter how thick the steel towers or side lanes are — if that one bolt snaps, nobody can cross. Running 2+ independent copies across separate buildings (`Multi-AZ`) removes every chokepoint bolt.",
    keyTerms: [
      { term: "Articulation Point / SPOF", plainMeaning: "Any single component whose crash disconnects callers from the system because zero backups stand beside it." },
      { term: "Multi-AZ Redundancy", plainMeaning: "Placing replica pods in separate datacenter buildings with independent power and fiber links." },
      { term: "Active-Active vs Active-Passive", plainMeaning: "Active-Active lets both replicas serve traffic right now; Active-Passive promotes a warm standby automatically on crash." },
      { term: "Graceful Zero-Downtime Drain", plainMeaning: "Shifting traffic cleanly to surviving nodes during deployments without dropping live user connections." },
    ],
    summary:
      "An articulation point is any node whose removal splits the architecture graph; running an articulation point at `replicas: 1` guarantees downtime on host loss.",
    whyItMatters:
      "ArchBench computes true graph articulation points deterministically and flags any stateful/stateless gateway or service at `replicas <= 1`.",
    coreEntities: [
      {
        name: "Multi-AZ Redundant Replicas (>= 2)",
        category: "HA Topology",
        responsibility: "Ensures active health-checked failover across independent physical Availability Zones.",
        whenToUse: "Every critical-path API gateway, service, cache, and primary DB.",
      },
    ],
    tradeOffs: [
      {
        approach: "Active-Active Multi-AZ (replicas >= 3)",
        pros: ["Instant failover, zero wasted standby hardware"],
        cons: ["Slightly higher cloud footprint (1 extra node baseline)"],
        bestFor: "Stateless gateways & core APIs",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Remember availability math: two 99% reliable components in SERIES drop combined availability to 0.99 * 0.99 = 98.01%, while two in PARALLEL raise it to 1 - (0.01)^2 = 99.99%!",
        failurePrevented: "Quantifies why parallel Multi-AZ replicas are non-negotiable for 99.99% SLAs.",
        redFlagToAvoid: "Putting 3 replicas inside the EXACT same single rack or Availability Zone.",
      },
    ],
    quizzes: [
      {
        id: "quiz-spof-1",
        scenarioPrompt:
          "Each microservice has 99.0% reliability. You place Gateway -> Service A -> Service B in parallel redundant pairs (`replicas >= 2` per tier). Wait: if ONLY Service B is left at 1 replica with 99.0% uptime while the rest are 99.99%, what caps the system availability?",
        options: [
          { id: "a", label: "System availability can never exceed the weakest single-point component (<= 99.0%)", explanation: "Correct! Series reliability multiplies `min/product`, so 1 unprotected SPOF throttles overall uptime." },
          { id: "b", label: "99.99% because the gateway has 3 replicas", explanation: "Gateway redundancy cannot heal an unreachable single downstream database or service." },
        ],
        correctOptionId: "a",
        xpReward: 45,
      },
    ],
    lab: BREAK_AND_FIX_LABS["lab-spof-dlq-rescue"],
    furtherReading: ["Tarjan Graph Articulation Points & Multi-AZ Redundancy", "ArchBench Rule REL-004"],
  },
  {
    id: "concept-outbox",
    trackId: "track-reliability",
    order: 7,
    title: "Transactional Outbox Pattern & Dual Writes [DATA-001]",
    subtitle: "Eliminating permanent DB-vs-Kafka desynchronization using local ACID commits + CDC relays.",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    xpReward: 70,
    ruleIds: ["DATA-001"],
    tags: ["outbox", "cdc", "debezium", "dual-write", "data-consistency"],
    plainEnglishAnalogy:
      "If you deposit money at Bank Counter A and then walk across the street to drop the receipt into Mailbox B (`Dual Write`), fainting on the crosswalk leaves the bank with your cash while the warehouse never gets notified! Instead, put BOTH your order AND the notification slip inside ONE sealed envelope at Counter A (`Transactional Outbox` inside one SQL commit), and let a reliable automated courier (`Debezium CDC`) carry the slip to Kafka afterward.",
    keyTerms: [
      { term: "Dual-Write Race Condition", plainMeaning: "Writing sequentially to SQL then Kafka from app code — any crash in between leaves half-completed phantom orders." },
      { term: "Transactional Outbox Table", plainMeaning: "A table inside the *same* SQL DB storing events atomically alongside your business row commit." },
      { term: "CDC (Change Data Capture)", plainMeaning: "Streaming committed SQL Write-Ahead Log rows straight into Kafka reliably with zero polling locks." },
      { term: "2PC (Two-Phase Commit)", plainMeaning: "Slow distributed locking across databases that stalls completely if any coordinator crashes mid-prepare." },
    ],
    summary:
      "Updating SQL and publishing to Kafka separately fails silently if the process crashes in between; writing business rows + an outbox event in 1 ACID transaction makes state atomic.",
    whyItMatters:
      "In high-scale fintech and e-commerce, Dual-Write crashes create phantom orders: customers are billed, SQL is updated, but Warehouse workers never see the event.",
    interactiveSim: "outbox-saga",
    coreEntities: [
      {
        name: "Transactional Outbox Table + CDC Relay",
        category: "Atomic Messaging",
        responsibility: "Saves `(domain row + outbox row)` in 1 commit; Debezium/poller publishes outbox to Kafka reliably.",
        whenToUse: "Every microservice updating its DB and notifying external brokers.",
      },
    ],
    tradeOffs: [
      {
        approach: "Transactional Outbox + Debezium CDC",
        pros: ["Avoids slow 2-Phase Commit", "Guarantees At-Least-Once event emission atomically"],
        cons: ["Consumers must still handle occasional duplicate delivery via Idempotency Keys"],
        bestFor: "Order checkout, fintech ledgers, notification triggers",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Pair Transactional Outbox (producer atomicity) with Consumer Idempotency (consumer dedupe) — together they deliver effective End-to-End Exactly-Once business behavior without heavy distributed 2PC.",
        failurePrevented: "Prevents silent lost events during pod OOM/SIGTERM kills.",
        redFlagToAvoid: "Thinking wrapping a `kafka.send()` inside a Postgres `BEGIN ... COMMIT` block makes Kafka roll back or commit with SQL!",
      },
    ],
    quizzes: [
      {
        id: "quiz-outbox-1",
        scenarioPrompt:
          "You put `await kafka.publish(event)` INSIDE a PostgreSQL `BEGIN ... COMMIT` block right before `COMMIT`. Wait — Postgres fails to `COMMIT` due to a lock conflict AFTER `kafka.publish()` succeeded! What went wrong?",
        options: [
          { id: "a", label: "Ghost Event! Warehouse ships the order that was rolled back in SQL because Kafka ignores SQL ROLLBACK", explanation: "Correct! Only writing the event to a local SQL Outbox table participates in SQL ROLLBACK/COMMIT!" },
          { id: "b", label: "Kafka automatically deletes the event on Postgres rollback", explanation: "Kafka brokers have zero visibility into your local SQL transaction rollback." },
        ],
        correctOptionId: "a",
        xpReward: 55,
      },
    ],
    lab: BREAK_AND_FIX_LABS["lab-dual-write-outbox"],
    furtherReading: ["Transactional Outbox Atomicity & CDC Relay Patterns", "ArchBench Rule DATA-001"],
  },
  {
    id: "concept-sync-chains",
    trackId: "track-reliability",
    order: 8,
    title: "Synchronous Call Depth & Cascading Latency [STRUC-001/002]",
    subtitle: "Why 5-hop microservice RPC chains destroy tail latency and how CQRS decouples reads.",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    xpReward: 55,
    ruleIds: ["STRUC-001", "STRUC-002"],
    tags: ["sync-chains", "tail-latency", "microservices", "stateful-ownership"],
    plainEnglishAnalogy:
      "Picture calling customer support and being kept on hold while Agent 1 calls Billing, who puts Agent 1 on hold to call Warehouse, who calls Shipping: if ANY single desk takes 5 seconds or hangs up, EVERY caller ahead of them stalls too! Keep synchronous hops shallow (`<= 2–3`) and put slow receipts/emails onto an async queue so customers hang up happily right away.",
    keyTerms: [
      { term: "Synchronous Hop Depth", plainMeaning: "How many services wait in a live line holding HTTP/gRPC threads open before the first caller sees a response." },
      { term: "Serial Availability Product", plainMeaning: "Four `99%` services chained in series only give `0.99^4 = 96.0%` combined uptime (~29 hours down/month!)." },
      { term: "P99 Fan-Out Amplification", plainMeaning: "If one request waits for 10 services simultaneously, the chance of at least one slow outlier jumps ~10x." },
      { term: "Database-Per-Service Ownership", plainMeaning: "Each domain owns its SQL schema privately instead of sharing secret backdoor joins into another service's tables." },
    ],
    summary:
      "Synchronous hop chains multiply P99 tail latency and compound outage risk; enforce dedicated database ownership per domain and offload non-critical hops asynchronously.",
    whyItMatters:
      "At P99, if 1 request makes 5 sequential microservice hops and each has a 1% chance of stalling, the chance ANY hop stalls rises to ~5%!",
    coreEntities: [
      {
        name: "Database-Per-Service Boundary",
        category: "Domain Isolation",
        responsibility: "Forbids random services from sharing mutable writes onto another service's SQL tables.",
        whenToUse: "All bounded contexts (ArchBench rule STRUC-002).",
      },
    ],
    tradeOffs: [
      {
        approach: "Async Fan-Out / CQRS Projections",
        pros: ["Keeps critical HTTP path <= 2 hops", "Independent failure domains"],
        cons: ["Eventual read projection lag (tens of ms)"],
        bestFor: "Checkout post-processing, activity timelines, search indexing",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Cite Google's 'Tail at Scale': deep synchronous fan-outs explode P99 latency; split non-blocking steps (receipts, analytics, emails) behind queues immediately.",
        failurePrevented: "Protects user-facing checkout P99 SLAs from non-critical downstream hiccups.",
        redFlagToAvoid: "Building 'Distributed Monoliths' where 8 microservices call each other synchronously in order to return 1 web page.",
      },
    ],
    quizzes: [
      {
        id: "quiz-sync-1",
        scenarioPrompt:
          "Checkout synchronously calls Auth -> Cart -> Pricing -> Shipping API -> Reward Points. The external Shipping API stalls for 8 seconds. How does Checkout behave?",
        options: [
          { id: "a", label: "All Checkout worker threads block waiting for Shipping, triggering global 504 timeouts across unrelated pages", explanation: "Correct! Decoupling non-blocking steps via queues + timeouts/circuit breakers isolates latency." },
          { id: "b", label: "HTTP magically skips Shipping and completes", explanation: "Synchronous calls block the caller thread until response or timeout." },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    lab: BREAK_AND_FIX_LABS["lab-sync-chain-decouple"],
    furtherReading: ["Dean & Barroso: The Tail at Scale (CACM 2013)", "ArchBench Rule STRUC-001"],
  },
  {
    id: "lesson-sagas-cqrs",
    trackId: "track-reliability",
    order: 9,
    title: "Multi-Step Sagas & CQRS Architecture",
    subtitle: "Replacing fragile distributed locks with Compensating Transactions and segregated Read/Write models.",
    difficulty: "principal",
    estimatedMinutes: 10,
    xpReward: 65,
    tags: ["sagas", "cqrs", "temporal", "compensation", "orchestration"],
    plainEnglishAnalogy:
      "Planning an entire vacation (Flight + Hotel + Rental Car) across three unrelated airlines is a Saga: instead of freezing all three databases under one giant lock, you reserve Flight, then reserve Hotel — and if Car Rental says \"Sold Out!\", your coordinator runs reverse undo steps (`CancelHotel`, `RefundFlight`) cleanly! CQRS simply separates the busy booking counter (`Write DB`) from a fast searchable travel brochure (`Read Projection`).",
    keyTerms: [
      { term: "Saga Pattern", plainMeaning: "Splitting one big multi-service workflow into local ACID steps paired with explicit backward undo (`Compensating`) actions." },
      { term: "Orchestration vs Choreography", plainMeaning: "Orchestration uses a central conductor (`Temporal`) directing steps; Choreography passes events blindly (`>4` steps gets tangled)." },
      { term: "Compensating Undo (Semantic Rollback)", plainMeaning: "Issuing an explicit credit refund or reservation cancel (not a DB `ROLLBACK`), which MUST be idempotent on retries." },
      { term: "CQRS (Command Query Separation)", plainMeaning: "Updating via normalized write tables while asynchronously feeding tailored fast views (like Elasticsearch) for heavy reads." },
    ],
    summary:
      "Sagas coordinate multi-service transactions using explicit compensating undo actions when step N fails; CQRS isolates complex read projections from transactional write paths.",
    whyItMatters:
      "Booking a trip (Reserve Flight -> Hold Hotel -> Charge Card) cannot use cross-vendor SQL locks. If Card fails at Step 3, a Saga compensates by cancelling Hotel and Flight cleanly.",
    interactiveSim: "outbox-saga",
    coreEntities: [
      {
        name: "Orchestrated Saga (Temporal / Step Functions)",
        category: "Workflow Engine",
        responsibility: "Central state machine driving steps sequentially, tracking retries, and triggering compensating undo steps.",
        whenToUse: "Complex 3+ service workflows (checkout fulfillment, fintech onboarding, travel booking).",
      },
      {
        name: "CQRS (Command Query Responsibility Segregation)",
        category: "Read/Write Split",
        responsibility: "Writes mutate normalized Postgres Commands; CDC projects denormalized search/feed rows into Elasticsearch/Redis Queries.",
        whenToUse: "High read/write asymmetry (100:1) or complex search/analytics views.",
      },
    ],
    tradeOffs: [
      {
        approach: "Orchestration Saga (Temporal)",
        pros: ["Single visible workflow graph, clean error recovery, zero cyclic spaghetti"],
        cons: ["Adds stateful workflow engine dependency"],
        bestFor: "Multi-step payments, order fulfillment, KYC workflows",
      },
      {
        approach: "Choreography (Event-Driven Pub/Sub)",
        pros: ["Zero central coordinator; tiny decoupling"],
        cons: ["Hard to trace or debug cycles across 6+ services when half-completed"],
        bestFor: "Simple 2–3 service async reactions",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Compensating transactions are NOT rollback magic — design idempotent semantic undo operations (e.g., `IssueRefund`, `ReleaseSeatHold`), and always put non-reversible steps (like charging money or shipping) LAST in the Saga!",
        failurePrevented: "Prevents awkward partial states where external emails/refunds fire prematurely.",
        redFlagToAvoid: "Attempting Distributed Two-Phase Commit (XA 2PC) across external HTTP third-party APIs.",
      },
    ],
    quizzes: [
      {
        id: "quiz-saga-1",
        scenarioPrompt:
          "In a Travel Booking Saga (Reserve Flight -> Charge Credit Card -> Send Receipt Email), why should 'Charge Card' or 'Send Final Receipt' happen AFTER internal inventory/hotel reservations?",
        options: [
          { id: "a", label: "Because Inventory reservations are cheap to compensate/cancel if external steps haven't fired yet — placing irreversible/costly actions last minimizes painful compensations", explanation: "Correct! Ordering steps around 'Pivot Transaction' boundaries makes Sagas clean and safe." },
          { id: "b", label: "Because TCP ports require alphabetical order", explanation: "Network transport order is irrelevant; business reversibility dictates Saga ordering." },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    furtherReading: ["Orchestrated vs Choreographed Compensating Sagas", "CQRS Read/Write Projection Decoupling"],
  },
  {
    id: "concept-just-enough",
    trackId: "track-reliability",
    order: 10,
    title: "JustEnough Architecture & Occam's Razor [REQ-COV-001/002]",
    subtitle: "Earning distributed complexity with measurable requirements and concrete Evolution Triggers.",
    difficulty: "foundation",
    estimatedMinutes: 8,
    xpReward: 55,
    ruleIds: ["REQ-COV-001", "REQ-COV-002"],
    tags: ["just-enough", "occams-razor", "monolith-first", "evolution-triggers"],
    plainEnglishAnalogy:
      "You wouldn't buy an 18-wheeler tractor-trailer to deliver neighborhood pizzas — nor build 15 Kubernetes microservices with Kafka for a prototype with 2 users per second! Start with a clean, modular monolith backed by reliable Postgres, and record clear measurable triggers (`\"Add Kafka when bursts exceed 5K writes/sec\"`) for when extra complexity is genuinely earned.",
    keyTerms: [
      { term: "JustEnough Architecture", plainMeaning: "Picking the simplest system that cleanly meets today's SLA requirements without guesswork bloat." },
      { term: "Speculative Complexity", plainMeaning: "Adding microservices, service meshes, or event streaming \"just in case we become Netflix someday.\"" },
      { term: "Evolution Trigger", plainMeaning: "A pre-agreed number (`\"Shard when primary CPU > 70%\"`) telling your team the exact day to split a tier." },
      { term: "Requirement Traceability", plainMeaning: "Every box in your diagram must justify itself against a real functional or SLA requirement." },
    ],
    summary:
      "Every piece of infrastructure must map to a measurable requirement; speculative microservices or ungrounded Kafka clusters violate engineering discipline.",
    whyItMatters:
      "Principal engineers get hired not for drawing the biggest box diagram, but for defending the SIMPLEST system that satisfies the SLA — paired with concrete evolution triggers telling the team when to split next.",
    coreEntities: [
      {
        name: "Evolution Trigger",
        category: "Growth Guardrail",
        responsibility: "Explicit metric rule (e.g. 'Add Redis when DB read CPU > 70% or P99 > 60ms at > 3k QPS').",
        whenToUse: "Always when intentionally deferring premature distributed components in an ADR.",
      },
    ],
    tradeOffs: [
      {
        approach: "Modular Monolith First + Triggers",
        pros: ["1 deployment pipeline, zero network hops, blazing fast feature shipping"],
        cons: ["Requires strong module boundaries so future extraction is clean"],
        bestFor: "Teams < 15 engineers & workloads < 10k RPS",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "In an interview, explicitly state: 'At 2,000 RPS I will start with a Modular Monolith + Multi-AZ Postgres, and our Evolution Trigger to extract the Ingestion Worker is hitting > 8k write QPS or divergent release cadence.'",
        failurePrevented: "Demonstrates L5/Staff pragmatism instead of blind resume-driven development.",
        redFlagToAvoid: "Saying 'We must use Kubernetes + Istio Service Mesh + Kafka' without citing a single throughput/team requirement.",
      },
    ],
    quizzes: [
      {
        id: "quiz-je-1",
        scenarioPrompt:
          "A 4-engineer startup is launching an internal HR Expense Portal serving 300 employees (~5 peak RPS). One engineer proposes 9 microservices, Kafka, Cassandra, and Redis Cluster. Why does ArchBench flag this as Speculative Complexity?",
        options: [
          { id: "a", label: "Zero NFRs justify distributed sharding or Kafka at 5 RPS — operational cognitive overhead crushes velocity without user benefit", explanation: "Correct! Complexity must always be earned by measurable NFR targets or team ownership constraints." },
          { id: "b", label: "Kafka cannot run with fewer than 50 developers", explanation: "The flaw is unjustified complexity cost relative to actual 5 RPS requirements." },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    furtherReading: ["Modular Monolith First & Concrete Evolution Triggers", "ArchBench JustEnough Rules REQ-COV-001/002"],
  },
];

