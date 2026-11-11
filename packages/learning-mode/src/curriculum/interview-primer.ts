import {
  CapacityEstimationInput,
  DeliveryFrameworkStage,
  FlashcardItem,
  InterviewCaseStudy,
  LatencyNumberItem,
} from "../types.js";

/**
 * 4-Step Delivery Framework (45-Minute Senior/Staff Playbook)
 */
export const DELIVERY_FRAMEWORK_STAGES: DeliveryFrameworkStage[] = [
  {
    stepNumber: 1,
    id: "step-requirements",
    title: "Requirements & Scale Constraints",
    timeBudgetMinutes: "0 - 5 min",
    plainExplanation:
      "Don't start drawing boxes yet! Spend 5 minutes agreeing on what features you are building ('Functional') vs how fast, reliable, and huge it must be ('Non-Functional' like latency, consistency, and daily users).",
    objective:
      "Lock down the exact problem boundaries before drawing a single box. Separate what the system does (functional) from how well it must perform (non-functional) and derive rough QPS + Storage envelopes.",
    checklist: [
      "Identify 3-4 core Functional Requirements (explicitly state what is Out of Scope).",
      "Clarify Non-Functional SLAs: Read/Write ratio, consistency model (strong vs eventual), p99 latency budget, availability target.",
      "Do 60-second Back-of-the-Envelope math ONLY for numbers that change architectural decisions (DB count, RAM cache sizing, egress bandwidth).",
      "Confirm hard constraints: DAU, data retention period, media vs metadata sizes.",
    ],
    whatToSayOutLoud:
      "\"I'll focus on the 3 core flows for our v1 scope and explicitly keep analytics/admin dashboards out of scope unless you'd like me to include them. Let's align on consistency: does a payment require strong ACID serializability while the social timeline can tolerate 2 seconds of eventual consistency?\"",
    timeTrapToAvoid:
      "Spending 15 minutes calculating exact server wattages or writing JSON schemas when only order-of-magnitude storage (TB vs PB) and QPS (1k vs 100k) steer architecture choices.",
  },
  {
    stepNumber: 2,
    id: "step-entities-api",
    title: "Core Entities & Public API Contract",
    timeBudgetMinutes: "5 - 12 min",
    plainExplanation:
      "Name the main things you are storing (like User, Order, Ticket) and sketch 3–5 clean API endpoints (`POST /orders`, `GET /feed`) so data flow and safety headers (`Idempotency-Key`) are settled before wiring boxes.",
    objective:
      "Define the primary domain nouns (Entities) and concrete API endpoints/events so data ownership and idempotency keys are obvious before topology drawing.",
    checklist: [
      "List 3-5 core Entities (e.g., User, Order, LedgerEntry, OutboxEvent, RideMatch).",
      "Write 3-5 clean REST / gRPC / WebSocket signatures with request parameters and responses.",
      "Identify security & pagination details: Cursor pagination for infinite feeds, `Idempotency-Key` headers for mutating POST endpoints, auth identity via JWT claims (never trust client `user_id`).",
    ],
    whatToSayOutLoud:
      "\"Before drawing infrastructure, here are our 4 core entities and public APIs. Notice `POST /v1/orders` requires an `Idempotency-Key` header so mobile retries over spotty cellular networks never double-charge.\"",
    timeTrapToAvoid:
      "Writing full ORM DDL migrations with 40 columns — stick to primary keys, shard keys, and core foreign identifiers.",
  },
  {
    stepNumber: 3,
    id: "step-high-level",
    title: "High-Level Architecture & Data Flow",
    timeBudgetMinutes: "12 - 28 min",
    plainExplanation:
      "Now draw the happy path end-to-end: Client -> Gateway/Load Balancer -> Service -> Database/Cache. Explain simply why you picked Postgres vs NoSQL/Redis, and keep background jobs (emails, videos) off the waiting checkout thread.",
    objective:
      "Trace every Functional Requirement end-to-end across a clean diagram: Client -> Edge/LB -> Stateless Services -> Primary DBs + Async Queues.",
    checklist: [
      "Draw the happy-path read and write paths sequentially — explain why each hop exists.",
      "Choose explicit database families matching access patterns (PostgreSQL for ACID relations/money, DynamoDB/Cassandra for massive append/KV writes, Redis for ephemeral state/caching).",
      "Decouple slow side effects (emails, thumbnails, fanout) asynchronously via Kafka/RabbitMQ + Workers instead of blocking sync chains.",
      "Verify every core functional requirement from Step 1 is demonstrably satisfied on the diagram.",
    ],
    whatToSayOutLoud:
      "\"Tracing Functional Requirement #1: the client hits our API Gateway (rate limited via Redis), calls the Order Service, commits the row + outbox event in PostgreSQL, and returns 201 Created in ~25ms while downstream fulfillment runs asynchronously.\"",
    timeTrapToAvoid:
      "Dropping 15 boxes (Kafka + Elasticsearch + Flink + Redis + Neo4j) onto the board at minute 6 without justifying why a simpler PostgreSQL DB wasn't enough first.",
  },
  {
    stepNumber: 4,
    id: "step-deep-dives",
    title: "Deep Dives, Bottlenecks & JustEnough Trade-Offs",
    timeBudgetMinutes: "28 - 45 min",
    plainExplanation:
      "Put on a stress-tester hat and try to break your own diagram: what melts at 10x traffic (e.g. celebrities, ticket spikes, server crashes)? Fix the weakest 2–3 points clearly instead of guessing blindly.",
    objective:
      "Proactively stress-test your own diagram for Single Points of Failure, hot-key celebrities, race conditions, failure recovery, and Occam JustEnough simplification.",
    checklist: [
      "Attack Read & Write bottlenecks: Sharding strategy, Celebrity/Hot-key mitigation, Hybrid Push/Pull fanout, Cache stampede leases.",
      "Eliminate distributed failure modes: Transactional Outbox vs dual writes, Redlock/DB optimistic locking for Ticketmaster double-booking, Bounded retries + exponential jitter + DLQs.",
      "Add observability & degradation plans: How does the system shed load gracefully (degrade recommendations before killing checkout)?",
    ],
    whatToSayOutLoud:
      "\"Looking at our high-level design, two spots break under 10x load or a crash: first, publishing to Kafka right after DB commit creates a dual-write split-brain; second, Taylor Swift posting breaks write fanout. Let me walk through Transactional Outbox and Hybrid Fanout to solve both.\"",
    timeTrapToAvoid:
      "Waiting passively for the interviewer to point out obvious flaws — Staff+ candidates proactively critique and fortify their own weak spots.",
  },
];

/**
 * Jeff Dean & Peter Norvig "Numbers Every Engineer Should Know" (Modern NVMe + Cloud calibrated)
 */
export const LATENCY_LADDER: LatencyNumberItem[] = [
  {
    id: "lat-l1",
    operation: "L1 Cache Reference",
    category: "cpu",
    nanoseconds: 1,
    displayTime: "1 ns",
    humanScaleAnalogy: "1 second (instant heartbeat)",
    architecturalTakeaway: "Keep hot tight-loop counters aligned in CPU cachelines; avoid false sharing across threads.",
  },
  {
    id: "lat-branch",
    operation: "CPU Branch Mispredict",
    category: "cpu",
    nanoseconds: 3,
    displayTime: "3 ns",
    humanScaleAnalogy: "3 seconds",
    architecturalTakeaway: "Predictable sorted scans beat unpredictable pointer chasing in high-frequency matching engines.",
  },
  {
    id: "lat-l2",
    operation: "L2 Cache Reference",
    category: "cpu",
    nanoseconds: 4,
    displayTime: "4 ns",
    humanScaleAnalogy: "4 seconds",
    architecturalTakeaway: "Fits ~256KB-1MB per core; 25x faster than jumping out to main RAM.",
  },
  {
    id: "lat-mutex",
    operation: "Mutex Lock / Unlock",
    category: "cpu",
    nanoseconds: 17,
    displayTime: "17 ns",
    humanScaleAnalogy: "17 seconds",
    architecturalTakeaway: "Uncontended locks are tiny; lock-free queues only matter when thousands of threads contend.",
  },
  {
    id: "lat-ram",
    operation: "Main Memory (RAM) Reference",
    category: "memory",
    nanoseconds: 100,
    displayTime: "100 ns",
    humanScaleAnalogy: "1.5 minutes",
    architecturalTakeaway: "100x slower than L1 cache; explains why in-memory Redis reads are basically free locally before network TCP.",
  },
  {
    id: "lat-compress",
    operation: "Compress 1 KB with Snappy / LZ4",
    category: "cpu",
    nanoseconds: 2000,
    displayTime: "2 µs",
    humanScaleAnalogy: "33 minutes",
    architecturalTakeaway: "Compressing JSON/Protobuf takes microseconds yet saves milliseconds of WAN network transfer!",
  },
  {
    id: "lat-ram-seq",
    operation: "Read 1 MB Sequentially from RAM",
    category: "memory",
    nanoseconds: 10000,
    displayTime: "10 µs (0.01 ms)",
    humanScaleAnalogy: "2.8 hours",
    architecturalTakeaway: "Contiguous array/vector scans throughput >100 GB/s internally.",
  },
  {
    id: "lat-nvme-read",
    operation: "NVMe SSD 4KB Random Read",
    category: "disk",
    nanoseconds: 100000,
    displayTime: "100 µs (0.1 ms)",
    humanScaleAnalogy: "1.1 days",
    architecturalTakeaway: "Modern NVMe is ~100x faster than spinning HDDs, making B-Trees dramatically faster than legacy assumptions.",
  },
  {
    id: "lat-dc-rtt",
    operation: "Round Trip Within Same Datacenter (AZ)",
    category: "network",
    nanoseconds: 500000,
    displayTime: "500 µs (0.5 ms)",
    humanScaleAnalogy: "6 days",
    architecturalTakeaway: "10 microservice hops sequentially inside the same AZ add only ~5ms pure RTT, plus serialization overhead.",
  },
  {
    id: "lat-nvme-seq",
    operation: "Read 1 MB Sequentially from NVMe SSD",
    category: "disk",
    nanoseconds: 1000000,
    displayTime: "1 ms",
    humanScaleAnalogy: "11 days",
    architecturalTakeaway: "Append-only Kafka logs and LSM SSTable compactions saturate full sequential NVMe bandwidth.",
  },
  {
    id: "lat-cross-az",
    operation: "Cross-AZ Synchronous Replication RTT",
    category: "network",
    nanoseconds: 2000000,
    displayTime: "2 ms",
    humanScaleAnalogy: "23 days",
    architecturalTakeaway: "Synchronous Raft/Paxos quorum writes across 3 AZs stay well under 5ms p99.",
  },
  {
    id: "lat-hdd-seek",
    operation: "Spinning Disk (HDD) Random Seek",
    category: "disk",
    nanoseconds: 5000000,
    displayTime: "5 ms",
    humanScaleAnalogy: "2 months",
    architecturalTakeaway: "50,000x slower than RAM — why unindexed table scans on archival HDD storage stall entire clusters.",
  },
  {
    id: "lat-cross-region",
    operation: "Cross-Continent Packet (US West <-> US East)",
    category: "network",
    nanoseconds: 70000000,
    displayTime: "70 ms",
    humanScaleAnalogy: "2.2 YEARS",
    architecturalTakeaway: "Speed of light in fiber forbids tight chatty RPC loops across oceans — terminate TLS & read from regional edges/CDNs!",
  },
  {
    id: "lat-global-rtt",
    operation: "Transoceanic Packet (California <-> Tokyo/Europe)",
    category: "network",
    nanoseconds: 150000000,
    displayTime: "150 ms",
    humanScaleAnalogy: "4.7 YEARS",
    architecturalTakeaway: "Never run synchronous ACID multi-phase commit globally for interactive requests; use local-write async replication or CRDTs.",
  },
];

export interface CapacityPreset {
  id: string;
  label: string;
  description: string;
  input: CapacityEstimationInput;
}

export const CAPACITY_PRESETS: CapacityPreset[] = [
  {
    id: "preset-tinyurl",
    label: "URL Shortener (TinyURL)",
    description: "Read-heavy (100:1), tiny 0.5KB link payloads, 5-year durable retention.",
    input: {
      dailyActiveUsers: 100000000,
      actionsPerUserPerDay: 5,
      readToWriteRatio: 100,
      payloadSizeKb: 0.5,
      retentionYears: 5,
      peakMultiplier: 3,
      replicationFactor: 3,
      cacheHotSetPercent: 20,
    },
  },
  {
    id: "preset-twitter",
    label: "Social Feed (X / Twitter)",
    description: "500M DAU, balanced reads & media-linked tweets (~2KB metadata), 5x peak surge.",
    input: {
      dailyActiveUsers: 500000000,
      actionsPerUserPerDay: 12,
      readToWriteRatio: 50,
      payloadSizeKb: 2,
      retentionYears: 5,
      peakMultiplier: 5,
      replicationFactor: 3,
      cacheHotSetPercent: 20,
    },
  },
  {
    id: "preset-uber",
    label: "Ride Telemetry (Uber GPS Ping)",
    description: "Write-heavy location stream: drivers ping every 4 sec during active shifts.",
    input: {
      dailyActiveUsers: 5000000,
      actionsPerUserPerDay: 600,
      readToWriteRatio: 0.5,
      payloadSizeKb: 0.25,
      retentionYears: 1,
      peakMultiplier: 4,
      replicationFactor: 3,
      cacheHotSetPercent: 30,
    },
  },
  {
    id: "preset-whatsapp",
    label: "Realtime Chat (WhatsApp)",
    description: "1B DAU sending ~40 messages/day, near 1:1 read/write ratio, transient + short retention.",
    input: {
      dailyActiveUsers: 1000000000,
      actionsPerUserPerDay: 40,
      readToWriteRatio: 1.5,
      payloadSizeKb: 0.4,
      retentionYears: 1,
      peakMultiplier: 3,
      replicationFactor: 3,
      cacheHotSetPercent: 15,
    },
  },
];

/**
 * 15 End-to-End System Design Interview Case Studies with schema-valid ArchSpecs.
 */
export const INTERVIEW_CASE_STUDIES: InterviewCaseStudy[] = [
  {
    id: "case-url-shortener",
    title: "Design a URL Shortener (TinyURL / bit.ly)",
    companyAnalog: "Bitly / TinyURL",
    difficulty: "foundation",
    category: "Web & KV Storage",
    scaleBadge: "100:1 Read/Write | ~10K+ Redirect QPS",
    plainOverview:
      "At its heart, TinyURL is a giant phonebook mapping a 7-letter short code (`4xK9qP2`) back to a long URL and returning a fast redirect. Since 100 people click links for every 1 link created, Redis RAM caching solves almost all speed pain — while Base62 encoding or Snowflake counters prevent duplicate short codes.",
    functionalRequirements: [
      "Given a long URL, generate a unique short alias (`https://short.ly/4xK9qP2`).",
      "HTTP 301/302 redirect short aliases to original URLs in <20ms globally.",
      "Optional custom aliases and automatic TTL expiration.",
    ],
    nonFunctionalRequirements: [
      "Extremely Read-Heavy (~100:1 read-to-write ratio).",
      "Zero short-code collisions; short URLs should be non-predictable.",
      "99.99% availability on redirects.",
    ],
    backOfEnvelopeNotes: [
      "100M new URLs/month ~= 40 writes/sec; Redirects at 100:1 ~= 4,000-12,000 peak read QPS.",
      "7-character Base62 (`[0-9a-zA-Z]`) supports 62^7 = 3.5 TRILLION unique keys (lasts >100 years at 100M/mo).",
      "Storage: 500 bytes/row * 6B URLs over 5 yrs = 3 TB total (easily sharded KV or partitioned PostgreSQL + Redis).",
    ],
    coreEntities: ["ShortLink(short_code PK, long_url, user_id, expires_at)", "RangeCounterBatch"],
    keyApis: [
      { method: "POST", path: "/api/v1/urls", purpose: "Create short code with optional alias & expiry" },
      { method: "GET", path: "/:shortCode", purpose: "Return HTTP 302 Location redirect (+ async click event)" },
    ],
    deepDives: [
      {
        topic: "301 vs 302 Redirect Status Code",
        bottleneck: "HTTP 301 Permanent Redirect tells browsers to cache permanently, blinding your click analytics.",
        solution: "Use HTTP 302 Found when tracking real-time click analytics/A-B splits; use 301 only to maximize CDN offload.",
      },
      {
        topic: "Collision-Free Short Code Generation",
        bottleneck: "MD5/SHA hashing + truncating to 7 chars hits occasional DB uniqueness collisions requiring retry loops.",
        solution: "Use Distributed ZooKeeper/Redis Range Counter Leases (each app server claims 10,000 ID block) encoded in Base62 + bit-shuffle so codes are O(1) unique yet unguessable.",
      },
    ],
    seniorHook:
      "Explain why Redis caching the hot 20% of short codes handles ~80% of redirects at sub-millisecond RAM latency, and track analytics asynchronously via Kafka so DB/Kafka hiccups never break link redirects.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-url-shortener
  description: "High-throughput URL shortener with Base62 key service, Redis redirect cache, and async click analytics."
system:
  context:
    users:
      - id: web-user
        name: "Browser / Link Clicker"
  requirements:
    - id: REQ-REDIRECT
      category: availability
      priority: must
      statement: "Serve HTTP 302 redirects in <20ms p99 with zero single points of failure."
      verification: architecture_check
architecture:
  alternatives:
    - id: shortener-prod
      name: "Redis-Cached Base62 Shortener"
      decisions:
        - id: ADR-01
          title: "HTTP 302 Redirects + Async Click Stream"
          status: accepted
          context: "Synchronous analytics writes add latency and blast radius to redirects."
          choice: "Serve 302 from Redis/KV immediately and publish click telemetry asynchronously."
          requirements: [REQ-REDIRECT]
      components:
        - id: edge-lb
          name: "Anycast Edge Load Balancer"
          type: load_balancer
          responsibility: "Terminates TLS and distributes redirect traffic across stateless servers."
          requirements: [REQ-REDIRECT]
          deployment:
            replicas: 2
        - id: url-api
          name: "URL Redirect & Shorten API"
          type: service
          technology: "Go / HTTP"
          responsibility: "Hashes/encodes Base62 ranges and executes fast Redis lookups."
          requirements: [REQ-REDIRECT]
          deployment:
            replicas: 4
        - id: hot-url-cache
          name: "Hot URL Redis Cache"
          type: cache
          technology: "Redis Cluster"
          responsibility: "Serves top 20% viral links (<1ms latency)."
          requirements: [REQ-REDIRECT]
        - id: url-kv-store
          name: "Sharded Link KV Store"
          type: key_value_store
          technology: "DynamoDB / Cassandra"
          responsibility: "Durable Base62 -> LongURL mapping store."
          requirements: [REQ-REDIRECT]
          data:
            ownership: "links-domain"
        - id: clicks-queue
          name: "Click Analytics Stream"
          type: event_stream
          technology: "Kafka"
          responsibility: "Decouples telemetry ingestion from user redirect latency."
          requirements: [REQ-REDIRECT]
          messaging:
            overload_policy: "drop_oldest"
      connections:
        - id: u1
          from: web-user
          to: edge-lb
          protocol: synchronous
          transport: https
        - id: u2
          from: edge-lb
          to: url-api
          protocol: synchronous
          transport: http
        - id: u3
          from: url-api
          to: hot-url-cache
          protocol: synchronous
          transport: tcp
        - id: u4
          from: url-api
          to: url-kv-store
          protocol: synchronous
          transport: https
        - id: u5
          from: url-api
          to: clicks-queue
          protocol: asynchronous
          transport: kafka`,
  },
  {
    id: "case-rate-limiter",
    title: "Design a Distributed API Rate Limiter",
    companyAnalog: "Stripe / Cloudflare Gateway",
    difficulty: "foundation",
    category: "API Infrastructure",
    scaleBadge: "1M RPS | <2ms Overhead | Atomic Lua",
    plainOverview:
      "Think of a bouncer standing in front of your API fleet with a shared counter in Redis. Every request runs a tiny single-step Redis script (`EVALSHA`) checking how many tokens this user has left in their Token Bucket — adding <2ms latency while blocking noisy abusers with `HTTP 429`.",
    functionalRequirements: [
      "Throttle traffic per User/API-Key/IP using configurable sliding window or token bucket rules.",
      "Return HTTP 429 Too Many Requests with `X-RateLimit-Remaining` and `Retry-After` headers.",
    ],
    nonFunctionalRequirements: [
      "<2ms p99 overhead on critical API path.",
      "Fail-open option during Redis outages to avoid self-inflicted platform downtime.",
    ],
    backOfEnvelopeNotes: [
      "10M active API keys * ~64 bytes per bucket = ~640 MB total RAM (fits effortlessly in a single small Redis cluster!).",
    ],
    coreEntities: ["RateLimitPolicy(tier, burst, refill_per_sec)", "TokenBucketKey(user:endpoint)"],
    keyApis: [
      { method: "ANY", path: "/v1/* (Middleware)", purpose: "Intercept gateway request, run EVALSHA Lua script, attach 429 or pass" },
    ],
    deepDives: [
      {
        topic: "Preventing Race Conditions Across Gateways",
        bottleneck: "Read-modify-write GET+SET allows concurrent requests to overwrite each other and bypass quotas.",
        solution: "Run atomic Redis Lua scripts (`EVALSHA`) combining timestamp check, token refill, and decrement in one single-threaded operation.",
      },
    ],
    seniorHook:
      "Always pair centralized Redis enforcement with rule config hot-reloading pushed via pub/sub so ops teams can tighten limits mid-DDoS without redeploying gateways.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-rate-limiter
  description: "API Gateway middleware enforcing atomic Redis Lua token buckets."
system:
  context:
    users:
      - id: api-caller
        name: "Developer SDK Client"
  requirements:
    - id: REQ-RL-01
      category: availability
      priority: must
      statement: "Enforce global API rate limits in <2ms without race conditions."
      verification: architecture_check
architecture:
  alternatives:
    - id: redis-lua-limiter
      name: "Edge Gateway + Redis Lua Token Bucket"
      decisions:
        - id: ADR-RL
          title: "Atomic Redis Lua EVALSHA Token Bucket"
          status: accepted
          context: "Stateless gateways require shared atomic counters."
          choice: "Run token bucket math atomically inside Redis Lua; fail-open on Redis timeout."
          requirements: [REQ-RL-01]
      components:
        - id: api-gw
          name: "Distributed API Gateway Fleet"
          type: api_gateway
          technology: "Envoy / NGINX"
          responsibility: "Extracts API key, queries Redis limiter, and emits 429 headers."
          requirements: [REQ-RL-01]
          deployment:
            replicas: 4
        - id: rl-redis
          name: "Rate Limiter Redis Cluster"
          type: cache
          technology: "Redis Cluster + Lua"
          responsibility: "Atomic token bucket state per tenant/key."
          requirements: [REQ-RL-01]
        - id: downstream-svc
          name: "Protected Core API"
          type: service
          technology: "Go"
          responsibility: "Handles validated non-throttled requests."
          requirements: [REQ-RL-01]
          deployment:
            replicas: 3
        - id: policy-db
          name: "Quota Rules Config DB"
          type: relational_database
          technology: "PostgreSQL"
          responsibility: "Authoritative tier quotas synced to gateways."
          requirements: [REQ-RL-01]
          data:
            ownership: "gateway-control-plane"
      connections:
        - id: r1
          from: api-caller
          to: api-gw
          protocol: synchronous
          transport: https
        - id: r2
          from: api-gw
          to: rl-redis
          protocol: synchronous
          transport: tcp
        - id: r3
          from: api-gw
          to: downstream-svc
          protocol: synchronous
          transport: grpc`,
  },
  {
    id: "case-news-feed",
    title: "Design a Social News Feed & Timeline (X / Instagram)",
    companyAnalog: "X (Twitter) / Instagram",
    difficulty: "intermediate",
    category: "Feeds & Fanout",
    scaleBadge: "300M DAU | Hybrid Push/Pull Fanout",
    plainOverview:
      "Opening Twitter can't run an expensive SQL join across 500 followed friends every load. For normal users, posting pushes your post ID directly into each friend's pre-built Redis inbox (`Fanout-on-Write`). For celebrities with 50M followers, we skip pushing 50M times and instead merge celebrity posts right when readers scroll (`Hybrid Pull`).",
    functionalRequirements: [
      "Publish posts containing text, image/video media URLs, and mentions.",
      "Render personalized home timeline sorted chronologically / ranked by engagement with cursor pagination.",
    ],
    nonFunctionalRequirements: [
      "Timeline read latency <150ms p99; newly created posts visible within 2-5 seconds.",
      "Handles celebrity accounts (50M+ followers) without stalling worker queues.",
    ],
    backOfEnvelopeNotes: [
      "Fanout cost: if an average user has 300 followers, 1M posts/sec expands to 300M writes if pure push — BUT 1 celebrity post with 50M followers creates an immediate worker cliff.",
    ],
    coreEntities: ["User", "Post", "FollowGraph(follower_id, followee_id)", "UserFeedSortedSet(user_id -> [post_id])"],
    keyApis: [
      { method: "POST", path: "/v1/posts", purpose: "Persist post + trigger async fanout" },
      { method: "GET", path: "/v1/feed?cursor=&limit=20", purpose: "Fetch ranked feed hydrated from Redis + merged celebrity posts" },
    ],
    deepDives: [
      {
        topic: "Fanout-on-Write vs Fanout-on-Read (The Hybrid Answer)",
        bottleneck: "Pure Push chokes on celebrities (50M follower writes per tweet). Pure Pull hammers DB joins for ordinary users following 500 people.",
        solution: "Hybrid Fanout: Fanout-on-Write (Push into Redis Sorted Sets `ZADD`) for normal users (<10K followers), and Fanout-on-Read (Pull & merge at read time) ONLY for celebrities the user follows!",
      },
    ],
    seniorHook:
      "Distinguish between precomputed Feed ID lists (`ZSET user_id -> post_ids`) vs full post hydration: only cache compact 8-byte Post IDs per user feed and batch-hydrate post payloads/counts via Redis MGET.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-news-feed
  description: "Hybrid push/pull social timeline engine with Redis Sorted Set feeds."
system:
  context:
    users:
      - id: reader
        name: "Social App User"
  requirements:
    - id: REQ-FEED-01
      category: availability
      priority: must
      statement: "Serve home timeline reads under 150ms without celebrity fanout storms."
      verification: architecture_check
architecture:
  alternatives:
    - id: hybrid-fanout
      name: "Hybrid Push/Pull Timeline Engine"
      decisions:
        - id: ADR-FEED
          title: "Hybrid Fanout (Push Normal Users, Pull Celebrities)"
          status: accepted
          context: "Writing 50M timeline entries on every celebrity post exhausts queues."
          choice: "Use Transactional Outbox to push standard accounts via workers; merge celebrity posts at read time."
          requirements: [REQ-FEED-01]
      components:
        - id: api-gw
          name: "Feed API Gateway"
          type: api_gateway
          responsibility: "Routes post creation and paginated timeline reads."
          requirements: [REQ-FEED-01]
          deployment:
            replicas: 4
        - id: feed-service
          name: "Timeline Mixer Service"
          type: service
          technology: "Go"
          responsibility: "Merges precomputed Redis user timeline with followed celebrity posts."
          requirements: [REQ-FEED-01]
          deployment:
            replicas: 4
        - id: post-db
          name: "Posts Primary DB"
          type: relational_database
          technology: "PostgreSQL + Shards"
          responsibility: "Stores authoritative posts and outbox events."
          requirements: [REQ-FEED-01]
          data:
            ownership: "posts-domain"
        - id: feed-cache
          name: "Redis Feed ZSET + Post Cache"
          type: cache
          technology: "Redis Cluster"
          responsibility: "Pre-materialized inbox post IDs + hot post JSON."
          requirements: [REQ-FEED-01]
        - id: fanout-queue
          name: "Fanout Topic"
          type: event_stream
          technology: "Kafka"
          responsibility: "Buffers new post IDs for background follower delivery."
          requirements: [REQ-FEED-01]
          messaging:
            overload_policy: "shed_excess"
        - id: fanout-worker
          name: "Fanout Delivery Workers"
          type: background_worker
          responsibility: "Pushes post IDs into active followers' Redis timelines."
          requirements: [REQ-FEED-01]
          deployment:
            replicas: 4
          behavior:
            idempotent: true
            idempotency_key: "post_id"
            retry_policy:
              max_attempts: 4
              backoff: exponential
              dead_letter_target: fanout-dlq
        - id: fanout-dlq
          name: "Fanout DLQ"
          type: message_queue
          responsibility: "Captures poison fanout events."
          messaging:
            overload_policy: "alert_ops"
      connections:
        - id: f1
          from: reader
          to: api-gw
          protocol: synchronous
          transport: https
        - id: f2
          from: api-gw
          to: feed-service
          protocol: synchronous
          transport: grpc
        - id: f3
          from: feed-service
          to: post-db
          protocol: synchronous
          transport: tcp
        - id: f4
          from: feed-service
          to: feed-cache
          protocol: synchronous
          transport: tcp
        - id: f5
          from: feed-service
          to: fanout-queue
          protocol: asynchronous
          transport: kafka
        - id: f6
          from: fanout-queue
          to: fanout-worker
          protocol: asynchronous
          transport: kafka`,
  },
  {
    id: "case-whatsapp-chat",
    title: "Design Real-Time 1:1 & Group Chat (WhatsApp / Discord)",
    companyAnalog: "WhatsApp / Slack / Discord",
    difficulty: "intermediate",
    category: "Realtime Messaging",
    scaleBadge: "1B DAU | 50M Concurrent WebSockets",
    plainOverview:
      "Phones keep persistent two-way WebSocket tunnels open to Stateful Chat Gateways. When Alice messages Bob, Redis tells Alice's gateway which server Bob's phone is connected to so it forwards live (or drops the message into an offline inbox database + Push Notification if Bob's phone is in airplane mode).",
    functionalRequirements: [
      "Low-latency bidirectional 1:1 & small group chat (<100 members) with Sent/Delivered/Read receipts.",
      "Offline message inbox storage when recipient is disconnected.",
    ],
    nonFunctionalRequirements: [
      "End-to-end delivery under 100ms when both users are online.",
      "Causal ordering of messages within each conversation.",
    ],
    backOfEnvelopeNotes: [
      "50M simultaneous stateful WebSockets across ~1,000 Erlang/Go gateway nodes (~50K connections per box with epoll/kqueue tuning).",
    ],
    coreEntities: ["ChatGatewaySession", "PresenceStore(user_id -> gateway_host, last_seen)", "Message(conv_id PK, msg_id SK/Snowflake)"],
    keyApis: [
      { method: "WS", path: "wss://chat.example.com/socket", purpose: "Persistent multiplexed frame stream (`send_msg`, `ack`, `typing`)" },
      { method: "GET", path: "/v1/sync?last_msg_id=", purpose: "Catch-up sync on reconnect for offline messages" },
    ],
    deepDives: [
      {
        topic: "Stateful WebSocket Routing Across Servers",
        bottleneck: "Alice holds a persistent WebSocket to ChatServer-A while Bob is connected to ChatServer-B; standard HTTP round-robin LB cannot forward push frames to Bob.",
        solution: "Store `user_id -> chat_server_id` in Redis Session Registry; ChatServer-A routes messages via internal gRPC / pub-sub straight to ChatServer-B (or writes to Offline KV Store + Push Notification if offline).",
      },
      {
        topic: "Group Chat Amplification: WhatsApp Small Groups vs Discord Large Servers",
        bottleneck: "Sending one message to a 500-person group multiplies egress 500x; a 500K-member Discord server melts per-user outboxes.",
        solution: "Fanout-on-write inbox copies for small WhatsApp groups (<500 members); channel-partitioned Kafka/Cassandra timeline pulled by active viewers for massive Discord channels.",
      },
    ],
    seniorHook:
      "Never maintain heartbeats too aggressively (5s timeouts cause thundering reconnect storms on cellular subways); debounce presence status updates in Redis with 30-60s TTL + jitter.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-realtime-chat
  description: "Stateful WebSocket gateway cluster with Redis session routing and Cassandra partition ordering."
system:
  context:
    users:
      - id: mobile-client
        name: "Mobile / Web Chat Client"
  requirements:
    - id: REQ-CHAT-01
      category: availability
      priority: must
      statement: "Deliver real-time bidirectional messages with durable offline fallback and strict per-channel ordering."
      verification: architecture_check
architecture:
  alternatives:
    - id: ws-mesh-chat
      name: "Stateful WebSocket Gateways + Channel Store"
      decisions:
        - id: ADR-CHAT
          title: "Snowflake Time-Ordered Clustering Key in Wide-Column Store"
          status: accepted
          context: "Chat history grows endlessly and appends sequentially per conversation."
          choice: "Partition Cassandra/ScyllaDB by channel_id with Snowflake msg_id clustering key."
          requirements: [REQ-CHAT-01]
      components:
        - id: ws-gateway
          name: "Stateful WebSocket Gateway Fleet"
          type: service
          technology: "Go / Elixir"
          responsibility: "Holds persistent TLS WebSockets and dispatches incoming frames."
          requirements: [REQ-CHAT-01]
          deployment:
            replicas: 6
        - id: session-redis
          name: "Session & Presence Redis"
          type: cache
          technology: "Redis Cluster"
          responsibility: "Maps online user_id -> gateway_node_id and heartbeat TTLs."
          requirements: [REQ-CHAT-01]
        - id: message-router
          name: "Internal Chat Router"
          type: event_stream
          technology: "NATS / Kafka"
          responsibility: "Publishes cross-gateway frames and offline push triggers."
          requirements: [REQ-CHAT-01]
          messaging:
            overload_policy: "shed_excess"
        - id: message-kv
          name: "Chat History Wide-Column DB"
          type: key_value_store
          technology: "Cassandra / ScyllaDB"
          responsibility: "Stores append-heavy message logs ordered by Snowflake ID."
          requirements: [REQ-CHAT-01]
          data:
            ownership: "messaging-domain"
        - id: push-worker
          name: "APNs / FCM Push Worker"
          type: background_worker
          responsibility: "Delivers push wakes for offline recipients."
          requirements: [REQ-CHAT-01]
          deployment:
            replicas: 3
          behavior:
            idempotent: true
            idempotency_key: "msg_id"
            retry_policy:
              max_attempts: 3
              backoff: exponential
              dead_letter_target: push-dlq
        - id: push-dlq
          name: "Push Notification DLQ"
          type: message_queue
          responsibility: "Quarantines expired device tokens."
          messaging:
            overload_policy: "alert_ops"
      connections:
        - id: c1
          from: mobile-client
          to: ws-gateway
          protocol: synchronous
          transport: wss
        - id: c2
          from: ws-gateway
          to: session-redis
          protocol: synchronous
          transport: tcp
        - id: c3
          from: ws-gateway
          to: message-kv
          protocol: synchronous
          transport: cql
        - id: c4
          from: ws-gateway
          to: message-router
          protocol: asynchronous
          transport: nats
        - id: c5
          from: message-router
          to: push-worker
          protocol: asynchronous
          transport: nats`,
  },
  {
    id: "case-notification-system",
    title: "Design a Multi-Channel Notification System",
    companyAnalog: "Courier / Twilio / Airbnb Notifications",
    difficulty: "foundation",
    category: "Messaging & Workers",
    scaleBadge: "100M Push/Email/SMS/Day | Priority Queues",
    plainOverview:
      "Calling Apple Push, Twilio SMS, or SendGrid synchronously inside checkout slows down the user and crashes if Twilio blinks. Instead, APIs write a notification request + `Idempotency-Key` into separate priority queues (OTP resets jump ahead of promo marketing), and workers retry safely using Backoff + DLQs.",
    functionalRequirements: [
      "Send transactional OTPs, order alerts, and promotional campaigns across Push (APNs/FCM), Email, and SMS.",
      "Honor user opt-out preferences, quiet hours, and rate caps.",
    ],
    nonFunctionalRequirements: [
      "OTPs/Security alerts must NEVER wait behind 10M marketing blasts (priority isolation).",
      "At-least-once delivery with strict per-notification deduplication.",
    ],
    backOfEnvelopeNotes: [
      "Separate Kafka topics by Priority x Channel (`critical-sms`, `bulk-email`) so slow bulk marketing providers never cause head-of-line blocking for OTP logins.",
    ],
    coreEntities: ["NotificationRequest", "UserChannelPreference", "DeliveryAuditLog"],
    keyApis: [
      { method: "POST", path: "/v1/notifications/send", purpose: "Validate template, check preferences, enqueue per channel" },
    ],
    deepDives: [
      {
        topic: "Preventing Duplicate Alerts Across Retries",
        bottleneck: "Provider webhooks time out after delivering an SMS, causing a blind retry that texts the user 3 times.",
        solution: "Attach a deterministic `notification_id` deduplication check in Redis/DB and pass vendor-supported idempotency keys downstream.",
      },
    ],
    seniorHook:
      "Emphasize Bulkhead Topic Isolation (high-priority OTP topics vs bulk marketing topics) + Circuit Breakers around sluggish third-party SMS carriers.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-notification-platform
  description: "Priority-isolated notification dispatcher with template rendering and idempotent channel workers."
system:
  context:
    users:
      - id: caller-svc
        name: "Internal Product Service"
  requirements:
    - id: REQ-NOTIF-01
      category: availability
      priority: must
      statement: "Deliver priority alerts reliably without head-of-line blocking or duplicate sends."
      verification: architecture_check
architecture:
  alternatives:
    - id: priority-bulkhead-notif
      name: "Priority-Isolated Multi-Channel Pipeline"
      decisions:
        - id: ADR-NOTIF
          title: "Priority Topic Segregation + Outbox"
          status: accepted
          context: "Bulk email blasts previously starved OTP SMS queues."
          choice: "Segregate OTP vs Bulk topics and commit notification log before queueing."
          requirements: [REQ-NOTIF-01]
      components:
        - id: notif-api
          name: "Notification Ingestion API"
          type: service
          technology: "Go"
          responsibility: "Checks user opt-out preferences and persists notification event."
          requirements: [REQ-NOTIF-01]
          deployment:
            replicas: 3
        - id: notif-db
          name: "Notification Ledger & Preferences DB"
          type: relational_database
          technology: "PostgreSQL"
          responsibility: "User preferences, audit logs, and outbox table."
          requirements: [REQ-NOTIF-01]
          data:
            ownership: "notifications-domain"
        - id: otp-queue
          name: "Priority & Channel Queues"
          type: message_queue
          technology: "Kafka / SQS"
          responsibility: "Priority-partitioned dispatch queues for SMS, Email, Push."
          requirements: [REQ-NOTIF-01]
          messaging:
            overload_policy: "shed_bulk_first"
        - id: channel-worker
          name: "Channel Dispatch Worker"
          type: background_worker
          responsibility: "Calls SendGrid/Twilio/FCM with circuit breakers and idempotency keys."
          requirements: [REQ-NOTIF-01]
          deployment:
            replicas: 4
          behavior:
            idempotent: true
            idempotency_key: "notification_id"
            retry_policy:
              max_attempts: 4
              backoff: exponential
              dead_letter_target: notif-dlq
        - id: notif-dlq
          name: "Notification DLQ"
          type: message_queue
          responsibility: "Quarantines failed deliveries for inspection."
          messaging:
            overload_policy: "alert_ops"
        - id: vendor-gateway
          name: "External SMS/Email Providers"
          type: external_provider
          responsibility: "Twilio, SendGrid, APNs, FCM endpoints."
          requirements: [REQ-NOTIF-01]
      connections:
        - id: n1
          from: caller-svc
          to: notif-api
          protocol: synchronous
          transport: grpc
        - id: n2
          from: notif-api
          to: notif-db
          protocol: synchronous
          transport: tcp
        - id: n3
          from: notif-api
          to: otp-queue
          protocol: asynchronous
          transport: kafka
        - id: n4
          from: otp-queue
          to: channel-worker
          protocol: asynchronous
          transport: kafka
        - id: n5
          from: channel-worker
          to: vendor-gateway
          protocol: synchronous
          transport: https`,
  },
  {
    id: "case-uber-dispatch",
    title: "Design Ride-Hailing Geo Dispatch (Uber / Lyft)",
    companyAnalog: "Uber / Lyft / DoorDash",
    difficulty: "principal",
    category: "Geospatial & Matching",
    scaleBadge: "1M Active Drivers | 250K Loc Pings/sec | H3 Grid",
    plainOverview:
      "Every 4 seconds, 1 million cars send GPS coordinates (`250K pings/sec`). Writing that directly to SQL melts the disk, so Uber updates ephemeral in-memory hexagon grid cells (`H3`) in RAM (`Redis/Go`). When you tap Request Ride, the dispatcher scans your surrounding H3 hexagons and atomically locks one nearby driver.",
    functionalRequirements: [
      "Drivers stream live GPS locations every 4 seconds; riders see nearby vehicles and request rides.",
      "Match 1 rider to 1 available driver atomically (never double-dispatch two riders to the same driver).",
    ],
    nonFunctionalRequirements: [
      "Low-latency high-churn ephemeral location writes (~250K-1M pings/sec).",
      "Strong transactional integrity on `Trip` state transitions (`REQUESTED -> OFFERED -> ACCEPTED`).",
    ],
    backOfEnvelopeNotes: [
      "1M active drivers / 4 sec = 250,000 GPS location writes/sec; only latest coordinate matters (store in ephemeral Geo Redis/Ring-sharded memory, NOT heavy relational disk indexes!).",
    ],
    coreEntities: ["DriverLiveCell(driver_id, h3_cell, lat, lng, status)", "Trip(trip_id, rider_id, driver_id, state)"],
    keyApis: [
      { method: "PUT", path: "/v1/drivers/location", purpose: "Update active driver GPS & H3 cell index" },
      { method: "POST", path: "/v1/trips/request", purpose: "Trigger nearby H3 search + atomic driver dispatch lock" },
    ],
    deepDives: [
      {
        topic: "Atomic Driver Offer Locking (No Double-Dispatch)",
        bottleneck: "Two nearby riders dispatch simultaneously and select the same top-ranked driver.",
        solution: "Acquire a short 15-second Redis lease (`SET driver_offer:{id} trip_id NX EX 15`) before sending the ride push offer; commit final match inside a PostgreSQL ACID transaction on accept.",
      },
    ],
    seniorHook:
      "Explain why H3 Hexagons outperform squares (Geohash) for ETA dispatching and surge pricing: every surrounding neighbor hexagon is strictly equidistant from the center.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-uber-dispatch
  description: "High-churn H3 geospatial location ingestion + atomic trip matching."
system:
  context:
    users:
      - id: rider-driver-app
        name: "Rider & Driver Mobile Apps"
  requirements:
    - id: REQ-DISPATCH-01
      category: availability
      priority: must
      statement: "Ingest 250K+ GPS pings/sec and guarantee atomic single-driver trip matching."
      verification: architecture_check
architecture:
  alternatives:
    - id: h3-geo-dispatch
      name: "Sharded H3 In-Memory Grid + ACID Trip Core"
      decisions:
        - id: ADR-GEO
          title: "Separate Ephemeral Geo Location Store from Trip ACID Ledger"
          status: accepted
          context: "250K updates/sec would overwhelm transactional SQL row locks."
          choice: "Route live GPS pings to Redis Geo/H3 shards; store immutable Trip states in PostgreSQL."
          requirements: [REQ-DISPATCH-01]
      components:
        - id: api-gw
          name: "Mobile Edge Gateway"
          type: api_gateway
          responsibility: "Routes GPS telemetry streams and ride requests."
          requirements: [REQ-DISPATCH-01]
          deployment:
            replicas: 4
        - id: location-svc
          name: "Location Ingestion Service"
          type: service
          technology: "Go"
          responsibility: "Indexes driver coordinates into H3 cell buckets."
          requirements: [REQ-DISPATCH-01]
          deployment:
            replicas: 4
        - id: geo-redis
          name: "Regional H3 Geo Redis Shards"
          type: cache
          technology: "Redis Cluster"
          responsibility: "Stores volatile active driver coordinates with 30s TTL."
          requirements: [REQ-DISPATCH-01]
        - id: dispatch-svc
          name: "Matching & Trip Service"
          type: service
          technology: "Go"
          responsibility: "Queries k-ring H3 neighbors, computes ETA, locks candidate drivers."
          requirements: [REQ-DISPATCH-01]
          deployment:
            replicas: 3
        - id: trips-db
          name: "Trips PostgreSQL DB"
          type: relational_database
          technology: "PostgreSQL"
          responsibility: "Authoritative transactional trip states and payments."
          requirements: [REQ-DISPATCH-01]
          data:
            ownership: "trips-domain"
        - id: telemetry-stream
          name: "Trip Telemetry Kafka"
          type: event_stream
          technology: "Kafka"
          responsibility: "Asynchronous archive of driver paths for ML ETA & receipts."
          requirements: [REQ-DISPATCH-01]
          messaging:
            overload_policy: "drop_oldest"
      connections:
        - id: u1
          from: rider-driver-app
          to: api-gw
          protocol: synchronous
          transport: https
        - id: u2
          from: api-gw
          to: location-svc
          protocol: synchronous
          transport: grpc
        - id: u3
          from: location-svc
          to: geo-redis
          protocol: synchronous
          transport: tcp
        - id: u4
          from: api-gw
          to: dispatch-svc
          protocol: synchronous
          transport: grpc
        - id: u5
          from: dispatch-svc
          to: geo-redis
          protocol: synchronous
          transport: tcp
        - id: u6
          from: dispatch-svc
          to: trips-db
          protocol: synchronous
          transport: tcp
        - id: u7
          from: location-svc
          to: telemetry-stream
          protocol: asynchronous
          transport: kafka`,
  },
  {
    id: "case-youtube-streaming",
    title: "Design a Video Streaming Pipeline (YouTube / Netflix)",
    companyAnalog: "YouTube / Netflix",
    difficulty: "intermediate",
    category: "Media & Storage",
    scaleBadge: "Direct S3 Pre-Signed | DAG Transcoding | HLS CDN",
    plainOverview:
      "Never stream a 5GB raw `.mov` file through your API server or force phones to buffer all 5GB on slow Wi-Fi. Creators upload straight to S3 via a temporary Presigned URL, workers slice videos into tiny 4-second chunks (`360p/720p/4K` HLS segments), and local neighborhood CDNs serve viewers nearby segments seamlessly.",
    functionalRequirements: [
      "Upload multi-gigabyte raw videos reliably with pause/resume.",
      "Transcode raw video into multiple resolutions (360p, 720p, 1080p, 4K) & adaptive HLS/DASH segments.",
    ],
    nonFunctionalRequirements: [
      "Never stream video bytes through stateless App API tier.",
      "Smooth bitrate switching without buffering via edge CDNs.",
    ],
    backOfEnvelopeNotes: [
      "If top 5% videos drive 80%+ traffic, push popular HLS chunks exclusively to Tier-1 Edge POPs while serving long-tail videos on-demand from Object Storage origin.",
    ],
    coreEntities: ["VideoAsset(id, status, manifest_url)", "TranscodeChunkJob(video_id, gop_segment_id, codec)"],
    keyApis: [
      { method: "POST", path: "/v1/videos/upload-session", purpose: "Issue pre-signed multipart Object Storage upload URLs" },
      { method: "GET", path: "/v1/videos/:id/manifest.m3u8", purpose: "Return HLS adaptive playlist pointing to CDN segments" },
    ],
    deepDives: [
      {
        topic: "GOP-Split Parallel Video Transcoding",
        bottleneck: "Single-machine FFmpeg takes 3 hours to transcode a 1-hour 4K movie sequentially.",
        solution: "Split uploaded video at Group-of-Pictures (GOP) keyframes into 10-second chunks in S3 and run hundreds of parallel GPU/CPU transcoding workers concurrently.",
      },
    ],
    seniorHook:
      "Draw clear separation between Control Plane (metadata, auth, pre-signed URL orchestration) and Heavy Data Plane (direct multipart S3 upload + CDN HLS delivery).",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-youtube-pipeline
  description: "Pre-signed S3 video ingestion, GOP DAG transcoding fleet, and HLS CDN edge playback."
system:
  context:
    users:
      - id: creator-viewer
        name: "Creators & Viewers"
  requirements:
    - id: REQ-VID-01
      category: availability
      priority: must
      statement: "Upload and transcode multi-GB videos asynchronously and stream via CDN with zero API server binary proxying."
      verification: architecture_check
architecture:
  alternatives:
    - id: dag-hls-streaming
      name: "Direct-to-S3 + Async Transcode DAG + HLS"
      decisions:
        - id: ADR-VID
          title: "GOP-Split Parallel Transcoding, Transactional Outbox & Pre-Signed Uploads"
          status: accepted
          context: "Sequential video encoding and API server file proxying don't scale."
          choice: "Use S3 pre-signed multipart URLs, Transactional Outbox metadata writes, and parallel transcode tasks via Kafka."
          requirements: [REQ-VID-01]
      components:
        - id: video-api
          name: "Video Control Plane API"
          type: service
          technology: "Go"
          responsibility: "Issues pre-signed upload URLs and serves video metadata."
          requirements: [REQ-VID-01]
          deployment:
            replicas: 3
        - id: video-meta-db
          name: "Video Catalog DB"
          type: relational_database
          technology: "PostgreSQL"
          responsibility: "Stores titles, permissions, HLS manifest paths, and outbox events."
          requirements: [REQ-VID-01]
          data:
            ownership: "media-catalog"
        - id: raw-blob-store
          name: "Object Storage (Raw & Transcoded HLS)"
          type: object_storage
          technology: "S3 + CloudFront CDN"
          responsibility: "Stores multipart raw uploads and encoded HLS segments."
          requirements: [REQ-VID-01]
          data:
            ownership: "media-blobs"
        - id: transcode-queue
          name: "Transcode Segment Queue"
          type: message_queue
          technology: "Kafka"
          responsibility: "Dispatches independent GOP transcode jobs."
          requirements: [REQ-VID-01]
          messaging:
            overload_policy: "backpressure_pause"
        - id: transcode-worker
          name: "FFmpeg Transcoder Fleet"
          type: background_worker
          responsibility: "Produces 360p/720p/1080p/4K HLS chunks idempotently."
          requirements: [REQ-VID-01]
          deployment:
            replicas: 8
          behavior:
            idempotent: true
            idempotency_key: "chunk_id"
            retry_policy:
              max_attempts: 3
              backoff: exponential
              dead_letter_target: transcode-dlq
        - id: transcode-dlq
          name: "Corrupt Video DLQ"
          type: message_queue
          responsibility: "Isolates corrupt codecs."
          messaging:
            overload_policy: "alert_ops"
      connections:
        - id: v1
          from: creator-viewer
          to: video-api
          protocol: synchronous
          transport: https
        - id: v2
          from: creator-viewer
          to: raw-blob-store
          protocol: synchronous
          transport: https
        - id: v3
          from: video-api
          to: video-meta-db
          protocol: synchronous
          transport: tcp
        - id: v4
          from: video-api
          to: transcode-queue
          protocol: asynchronous
          transport: kafka
        - id: v5
          from: transcode-queue
          to: transcode-worker
          protocol: asynchronous
          transport: kafka
        - id: v6
          from: transcode-worker
          to: raw-blob-store
          protocol: synchronous
          transport: https`,
  },
  {
    id: "case-search-autocomplete",
    title: "Design Search Autocomplete / Typeahead (Google Search Bar)",
    companyAnalog: "Google / Amazon Typeahead",
    difficulty: "intermediate",
    category: "Search & Caching",
    scaleBadge: "50K Typeahead QPS | <25ms p99 | Cached Top-K Trie",
    plainOverview:
      "You only have `< 25 ms` between keystrokes! Searching every database text index on each keystroke fails fast, so autocomplete stores a read-only RAM Trie where EVERY letter prefix (`\"sys\"`) already pre-cached its Top 5 popular phrases. Live searches log to Kafka asynchronously and rebuild new Trie snapshots offline.",
    functionalRequirements: [
      "Given a typed prefix (`\"sys\"`), return top 5-10 popular matching search phrases instantly.",
    ],
    nonFunctionalRequirements: [
      "<25ms p99 query response globally.",
      "Freshness within ~1 hour for rising trends; strict profanity/spam moderation filter.",
    ],
    backOfEnvelopeNotes: [
      "Every search word averages 5 keystrokes -> 5x QPS amplification on autocomplete edge! Aggressive CDN/browser caching on common 1-3 character prefixes absorbs >80% traffic.",
    ],
    coreEntities: ["TrieSnapshot(prefix -> topK[])", "AggregatedQueryFrequencyLog"],
    keyApis: [
      { method: "GET", path: "/v1/suggest?q=syst", purpose: "Return cached top-K completions sorted by recency-decayed frequency" },
    ],
    deepDives: [
      {
        topic: "Decoupling Hot Query Path from Write Aggregation",
        bottleneck: "Updating a live Trie in memory per keystroke creates massive mutex contention and slows reads.",
        solution: "Sample user queries into Kafka -> MapReduce/Spark hourly aggregator -> build immutable Trie -> blue-green swap onto read-only Trie servers.",
      },
    ],
    seniorHook:
      "Add client-side debouncing (e.g. 100ms), `Cache-Control: max-age=3600` on CDN edges for popular short prefixes, and prefix Trie sharding by first two characters (`aa-az`, `ba-bz`).",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-search-autocomplete
  description: "Sub-25ms cached Top-K Trie fleet fed by offline sampled search log aggregation."
system:
  context:
    users:
      - id: searcher
        name: "Search Bar User"
  requirements:
    - id: REQ-AC-01
      category: availability
      priority: must
      statement: "Serve top-10 prefix suggestions under 25ms globally without lock contention."
      verification: architecture_check
architecture:
  alternatives:
    - id: topk-trie-cdn
      name: "Edge Cached Top-K Trie Servers + Offline Builder"
      decisions:
        - id: ADR-AC
          title: "Immutable Trie Snapshots Built Offline"
          status: accepted
          context: "Live mutations on Trie root nodes cause heavy lock contention."
          choice: "Rebuild Top-K Trie snapshots offline from sampled Kafka logs and hot-swap atomically."
          requirements: [REQ-AC-01]
      components:
        - id: suggest-lb
          name: "CDN + L7 Load Balancer"
          type: load_balancer
          responsibility: "Caches popular short prefixes (e.g., 'a', 'sy') at the edge."
          requirements: [REQ-AC-01]
          deployment:
            replicas: 2
        - id: trie-service
          name: "In-Memory Top-K Trie Service"
          type: search_engine
          technology: "Rust / Go Trie Cache"
          responsibility: "Returns precomputed top-10 completions in O(prefix_len)."
          requirements: [REQ-AC-01]
          deployment:
            replicas: 4
        - id: query-log-stream
          name: "Sampled Query Log Stream"
          type: event_stream
          technology: "Kafka"
          responsibility: "Streams 1-10% sampled search completions asynchronously."
          requirements: [REQ-AC-01]
          messaging:
            overload_policy: "drop_oldest"
        - id: trie-builder
          name: "Offline Trie Snapshot Worker"
          type: background_worker
          responsibility: "Computes weighted Top-K scores, applies blocklists, writes new Trie blob."
          requirements: [REQ-AC-01]
          deployment:
            replicas: 2
          behavior:
            idempotent: true
            idempotency_key: "snapshot_hour"
            retry_policy:
              max_attempts: 3
              backoff: fixed
              dead_letter_target: trie-dlq
        - id: trie-dlq
          name: "Snapshot Job DLQ"
          type: message_queue
          responsibility: "Quarantines failed snapshot builds."
          messaging:
            overload_policy: "alert_ops"
        - id: trie-snapshot-s3
          name: "Trie Snapshots S3 Bucket"
          type: object_storage
          responsibility: "Stores immutable serialized Trie artifacts pulled by read fleet."
          requirements: [REQ-AC-01]
      connections:
        - id: a1
          from: searcher
          to: suggest-lb
          protocol: synchronous
          transport: https
        - id: a2
          from: suggest-lb
          to: trie-service
          protocol: synchronous
          transport: http
        - id: a3
          from: trie-service
          to: query-log-stream
          protocol: asynchronous
          transport: kafka
        - id: a4
          from: query-log-stream
          to: trie-builder
          protocol: asynchronous
          transport: kafka
        - id: a5
          from: trie-builder
          to: trie-snapshot-s3
          protocol: synchronous
          transport: https`,
  },
  {
    id: "case-ticketmaster",
    title: "Design High-Contention Ticket Booking (Ticketmaster / Taylor Swift Drops)",
    companyAnalog: "Ticketmaster / StubHub",
    difficulty: "principal",
    category: "Transactions & Concurrency",
    scaleBadge: "1M Waiting Buyers -> 50K Seats | Zero Double-Booking",
    plainOverview:
      "When 1 million fans try clicking 50,000 seats at 10:00 AM sharp, slamming PostgreSQL locks crashes every server. First, a Virtual Waiting Room Edge Queue admits manageable batches smoothly; then Redis grants temporary 10-minute checkout holds before Postgres confirms `status = 'SOLD'` atomically (`WHERE status = 'AVAILABLE'`).",
    functionalRequirements: [
      "Select specific arena seats, hold them exclusively for 10 minutes during Stripe checkout, and issue tickets.",
    ],
    nonFunctionalRequirements: [
      "Zero double-booking EVER (strict linearizability per seat).",
      "Survive flash-sale thundering herds of 1M users refreshing at 10:00:00 AM.",
    ],
    backOfEnvelopeNotes: [
      "Writing `1M` contending DB transactions for 50K seats collapses PostgreSQL under row-lock wait timeouts; only admit 50K users through a Virtual Waiting Room into checkout!",
    ],
    coreEntities: ["Seat(seat_id, event_id, status, hold_until, version)", "TicketOrder(order_id, idempotency_key, payment_status)"],
    keyApis: [
      { method: "POST", path: "/v1/events/:id/holds", purpose: "Temporarily reserve seats with 10m expiry via ACID lock / version CAS" },
      { method: "POST", path: "/v1/orders/confirm", purpose: "Confirm payment idempotently and finalize `SOLD` transition" },
    ],
    deepDives: [
      {
        topic: "Two-Layer Contention Shield: Virtual Waiting Queue + DB Pessimistic/Optimistic Lock",
        bottleneck: "A raw database cannot survive 500K concurrent lock attempts on Section A Seat 1.",
        solution: "Step 1: Put excessive buyers into a Kafka/Redis Virtual Waiting Queue trickling controlled RPS through; Step 2: Acquire seat reservation cleanly using `SELECT ... FOR UPDATE SKIP LOCKED` or Optimistic `version` CAS + Redis soft-hold TTL.",
      },
    ],
    seniorHook:
      "Always pair a seat's checkout hold with an expiration timestamp (`hold_expires_at`) rather than relying solely on a cron delete — queries filter `WHERE status='AVAILABLE' OR hold_expires_at < NOW()` so expired holds heal immediately at query time.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-ticketmaster
  description: "Virtual waiting room + strict PostgreSQL seat-reservation locking + idempotent payment checkout."
system:
  context:
    users:
      - id: ticket-buyer
        name: "Concert Ticket Buyer"
  requirements:
    - id: REQ-TM-01
      category: functional
      priority: must
      statement: "Prevent double-selling any seat while absorbing flash-sale thundering herds."
      verification: architecture_check
architecture:
  alternatives:
    - id: waiting-room-acid
      name: "Waiting Queue Shield + ACID Seat Locking"
      decisions:
        - id: ADR-TM
          title: "Virtual Waiting Queue + PostgreSQL Optimistic Version / Row Lock"
          status: accepted
          context: "Flash drops send 1M buyers for 50K finite seats simultaneously."
          choice: "Gate access via Redis waiting room tokens; enforce zero double-booking in PostgreSQL ACID transactions."
          requirements: [REQ-TM-01]
      components:
        - id: edge-gw
          name: "Waiting Room Edge Gateway"
          type: api_gateway
          responsibility: "Issues FIFO queue tokens before letting users load the interactive seat map."
          requirements: [REQ-TM-01]
          deployment:
            replicas: 4
        - id: wait-redis
          name: "Virtual Waiting Room & Hold Cache"
          type: cache
          technology: "Redis Cluster"
          responsibility: "Tracks active checkout tokens and caches read-heavy arena availability maps."
          requirements: [REQ-TM-01]
        - id: booking-svc
          name: "Seat Reservation Service"
          type: service
          technology: "Go"
          responsibility: "Executes atomic seat holds and idempotent order commits."
          requirements: [REQ-TM-01]
          deployment:
            replicas: 4
        - id: seats-db
          name: "Seats & Orders PostgreSQL DB"
          type: relational_database
          technology: "PostgreSQL (Partitioned by event_id)"
          responsibility: "Authoritative transactional seat state and outbox ledger."
          requirements: [REQ-TM-01]
          data:
            ownership: "ticketing-domain"
        - id: stripe-psp
          name: "External Payment Processor"
          type: external_provider
          responsibility: "Stripe payment intent confirmation with idempotency keys."
          requirements: [REQ-TM-01]
      connections:
        - id: t1
          from: ticket-buyer
          to: edge-gw
          protocol: synchronous
          transport: https
        - id: t2
          from: edge-gw
          to: wait-redis
          protocol: synchronous
          transport: tcp
        - id: t3
          from: edge-gw
          to: booking-svc
          protocol: synchronous
          transport: grpc
        - id: t4
          from: booking-svc
          to: seats-db
          protocol: synchronous
          transport: tcp
        - id: t5
          from: booking-svc
          to: wait-redis
          protocol: synchronous
          transport: tcp
        - id: t6
          from: booking-svc
          to: stripe-psp
          protocol: synchronous
          transport: https`,
  },
  {
    id: "case-web-crawler",
    title: "Design a Distributed Web Crawler (Search & AI Corpus Ingestion)",
    companyAnalog: "Googlebot / CommonCrawl",
    difficulty: "intermediate",
    category: "Distributed Workers",
    scaleBadge: "1B Pages/Month | Politeness Queues | Bloom Dedupe",
    plainOverview:
      "A polite crawler works like a careful librarian: a URL Frontier feeds per-website queues so workers don't accidentally DDoS small blogs (`Politeness`), a Bloom Filter quickly rejects URLs already visited (`Dedupe`), and headless/HTTP fetchers store clean HTML pages onto S3 for search & AI indexing.",
    functionalRequirements: [
      "Crawl billions of web pages starting from seed URLs, extract outbound links, and archive HTML safely.",
      "Honor `robots.txt` rules and never DDoS a host with concurrent scraping bursts.",
    ],
    nonFunctionalRequirements: [
      "Politeness per host (max 1 req/sec per domain).",
      "Deduplicate infinite URL traps (`?page=999999`) and identical HTML content.",
    ],
    backOfEnvelopeNotes: [
      "1B pages/month ~= 400 pages/sec avg (2K peak); at 500KB HTML avg = 500 TB raw HTML/month stored in Object Storage.",
    ],
    coreEntities: ["URLFrontierHostQueue(host -> delayed FIFO)", "URLSeenBloomFilter", "ContentHashStore(SimHash)"],
    keyApis: [
      { method: "ASYNC", path: "Frontier -> FetchWorker -> HTMLParser -> Dedup", purpose: "Continuous distributed pipeline" },
    ],
    deepDives: [
      {
        topic: "Per-Host Politeness Queuing (Front vs Back Queues)",
        bottleneck: "A single naive FIFO queue dispatches 50 workers to hit `en.wikipedia.org` simultaneously, getting your IP banned.",
        solution: "Mercator Dual-Queue Frontier: Front Queues prioritize by domain rank/freshness; Back Queues strictly bind ONE queue per hostname with a consistent hash router so only 1 worker polls any host every N seconds.",
      },
    ],
    seniorHook:
      "Explain Crawler Traps (`calendar.site/2099/05/...`) + SimHash fuzzy content fingerprinting to avoid indexing identical mirrored pages millions of times.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-web-crawler
  description: "Mercator front/back politeness frontier crawler with Bloom filter URL deduplication."
system:
  context:
    users:
      - id: seed-ops
        name: "Crawler Scheduler"
  requirements:
    - id: REQ-CRAWL-01
      category: availability
      priority: must
      statement: "Respect per-host politeness limits and avoid duplicate crawling traps."
      verification: architecture_check
architecture:
  alternatives:
    - id: politeness-frontier
      name: "Mercator Politeness Frontier Architecture"
      decisions:
        - id: ADR-CRAWL
          title: "Consistent-Hashed Per-Host Back Queues + Bloom Deduplication"
          status: accepted
          context: "Shared FIFO queues accidentally DDoS single domains."
          choice: "Route URLs by domain hash to isolated host-throttled queues and check Bloom/KV filters."
          requirements: [REQ-CRAWL-01]
      components:
        - id: frontier-mgr
          name: "Priority & Politeness Frontier"
          type: message_queue
          technology: "Partitioned Kafka / RocksDB"
          responsibility: "Enforces priority scheduling and per-domain cooldown windows."
          requirements: [REQ-CRAWL-01]
          messaging:
            overload_policy: "backpressure_pause"
        - id: fetch-worker
          name: "DNS & HTTP Fetch Workers"
          type: background_worker
          responsibility: "Fetches HTML politely using cached DNS + robots.txt evaluator."
          requirements: [REQ-CRAWL-01]
          deployment:
            replicas: 8
          behavior:
            idempotent: true
            idempotency_key: "url_hash"
            retry_policy:
              max_attempts: 3
              backoff: exponential
              dead_letter_target: crawl-dlq
        - id: crawl-dlq
          name: "Unreachable Host DLQ"
          type: message_queue
          responsibility: "Quarantines dead domains and timeouts."
          messaging:
            overload_policy: "drop_oldest"
        - id: html-store
          name: "Crawled Corpus Object Store"
          type: object_storage
          technology: "S3 / GCS"
          responsibility: "Stores immutable compressed HTML WARC archives."
          requirements: [REQ-CRAWL-01]
        - id: dedup-kv
          name: "URL & SimHash Dedup Store"
          type: key_value_store
          technology: "RocksDB / Bloom Filter"
          responsibility: "Sub-millisecond check if normalized URL or SimHash already indexed."
          requirements: [REQ-CRAWL-01]
          data:
            ownership: "crawler-index"
      connections:
        - id: w1
          from: seed-ops
          to: frontier-mgr
          protocol: asynchronous
          transport: kafka
        - id: w2
          from: frontier-mgr
          to: fetch-worker
          protocol: asynchronous
          transport: kafka
        - id: w3
          from: fetch-worker
          to: html-store
          protocol: synchronous
          transport: https
        - id: w4
          from: fetch-worker
          to: dedup-kv
          protocol: synchronous
          transport: tcp`,
  },
  {
    id: "case-payment-ledger",
    title: "Design an ACID Double-Entry Payment Ledger (Stripe / PayPal)",
    companyAnalog: "Stripe / Robinhood / Adyen",
    difficulty: "principal",
    category: "FinTech & Consistency",
    scaleBadge: "Zero Lost Cents | Double-Entry | Idempotent Saga",
    plainOverview:
      "Never store money in `float` decimals or overwrite `balance = balance - 10`! Every movement writes TWO append-only integer (`cents`) entries (`Debit Buyer -$10`, `Credit Seller +$10`) summing to ZERO in one SQL ACID commit, guarded by an `Idempotency-Key` so retrying flaky card networks never double-charges.",
    functionalRequirements: [
      "Execute peer-to-peer transfers and merchant checkouts using an immutable append-only double-entry ledger.",
      "Integrate reliably with slow external Payment Service Providers (PSPs / Card Networks).",
    ],
    nonFunctionalRequirements: [
      "Strict ACID serializability for balance updates (`SUM(debits) == SUM(credits)`).",
      "100% safe against client retries, webhook duplicates, and mid-flight server crashes.",
    ],
    backOfEnvelopeNotes: [
      "Always store currency in integer minor units (cents / micro-dollars), NEVER IEEE-754 floating point (`0.1 + 0.2 !== 0.3`).",
    ],
    coreEntities: ["Account(id, currency, balance_version)", "LedgerEntry(tx_id, account_id, debit_credit, amount_cents)"],
    keyApis: [
      { method: "POST", path: "/v1/transfers", purpose: "Idempotent debit/credit ledger posting + async PSP capture" },
    ],
    deepDives: [
      {
        topic: "No Distributed 2PC Across External Banks — Use Ledger Saga + Reconciliation",
        bottleneck: "You cannot run a database XA lock across Stripe/Visa while your PostgreSQL transaction stays open.",
        solution: "Record `PENDING` double-entry rows + Transactional Outbox locally -> call PSP with `Idempotency-Key` -> finalize `SETTLED` or write reversing compensating entry on failure -> run daily T+1 batch reconciliation.",
      },
    ],
    seniorHook:
      "Never store mutable `account.balance -= amount` as the sole truth! Append immutable debit/credit rows to a double-entry ledger (maintaining a materialized balance snapshot protected by optimistic locking) AND add automated reconciliation jobs.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-payment-ledger
  description: "Double-entry immutable PostgreSQL ledger with Transactional Outbox and idempotent PSP workers."
system:
  context:
    users:
      - id: buyer-app
        name: "Checkout Client"
  requirements:
    - id: REQ-PAY-01
      category: availability
      priority: must
      statement: "Guarantee zero duplicate charges and double-entry balance invariants under retries and crashes."
      verification: architecture_check
architecture:
  alternatives:
    - id: double-entry-outbox
      name: "Double-Entry Ledger + Outbox + Reconciliation"
      decisions:
        - id: ADR-PAY
          title: "Transactional Outbox + Double-Entry Append Ledger"
          status: accepted
          context: "External bank calls cannot participate in database 2PC locks."
          choice: "Commit pending double-entry rows + outbox event in PostgreSQL, then settle via idempotent PSP worker."
          requirements: [REQ-PAY-01]
      components:
        - id: pay-gw
          name: "Payments API Gateway"
          type: api_gateway
          responsibility: "Validates HMAC signatures and enforces Idempotency-Key extraction."
          requirements: [REQ-PAY-01]
          deployment:
            replicas: 3
        - id: ledger-svc
          name: "Double-Entry Ledger Service"
          type: service
          technology: "Go"
          responsibility: "Enforces balanced debit/credit pairs in integer minor cents."
          requirements: [REQ-PAY-01]
          deployment:
            replicas: 3
        - id: ledger-db
          name: "Immutable Ledger PostgreSQL DB"
          type: relational_database
          technology: "PostgreSQL (Serializable)"
          responsibility: "Double-entry accounting tables and transactional outbox."
          requirements: [REQ-PAY-01]
          data:
            ownership: "payments-ledger"
        - id: settlement-queue
          name: "PSP Settlement Queue"
          type: message_queue
          technology: "Kafka"
          responsibility: "Dispatches async PSP capture calls decoupled from web thread."
          requirements: [REQ-PAY-01]
          messaging:
            overload_policy: "backpressure_pause"
        - id: psp-worker
          name: "PSP Capture & Webhook Worker"
          type: background_worker
          responsibility: "Calls external PSP idempotently and records settling ledger entries."
          requirements: [REQ-PAY-01]
          deployment:
            replicas: 3
          behavior:
            idempotent: true
            idempotency_key: "payment_intent_id"
            retry_policy:
              max_attempts: 5
              backoff: exponential
              dead_letter_target: pay-dlq
        - id: pay-dlq
          name: "Unsettled Payment DLQ"
          type: message_queue
          responsibility: "Triggers manual reconciliation alerts on permanent PSP failures."
          messaging:
            overload_policy: "alert_ops"
        - id: card-psp
          name: "Card Network / Stripe PSP"
          type: external_provider
          responsibility: "Executes card authorization and clearing."
          requirements: [REQ-PAY-01]
      connections:
        - id: p1
          from: buyer-app
          to: pay-gw
          protocol: synchronous
          transport: https
        - id: p2
          from: pay-gw
          to: ledger-svc
          protocol: synchronous
          transport: grpc
        - id: p3
          from: ledger-svc
          to: ledger-db
          protocol: synchronous
          transport: tcp
        - id: p4
          from: ledger-svc
          to: settlement-queue
          protocol: asynchronous
          transport: kafka
        - id: p5
          from: settlement-queue
          to: psp-worker
          protocol: asynchronous
          transport: kafka
        - id: p6
          from: psp-worker
          to: card-psp
          protocol: synchronous
          transport: https`,
  },
  {
    id: "case-google-docs",
    title: "Design Real-Time Collaborative Editing (Figma / Google Docs)",
    companyAnalog: "Figma / Notion / Google Docs",
    difficulty: "principal",
    category: "Realtime & CRDTs",
    scaleBadge: "CRDT / OT Merge | Multiplayer WebSockets | Snapshots",
    plainOverview:
      "When two teammates type in the same Google Doc offline or over patchy Wi-Fi, comparing wall clocks fails. Docs keep WebSocket rooms pinned to a Room server per active doc, storing every character/shape operation using mathematical merge rules (`CRDTs` or `OT`) so every screen ends up identical no matter what order edits arrive.",
    functionalRequirements: [
      "Multiple editors simultaneously edit the same rich document offline or online with deterministic convergence.",
      "Broadcast live cursor presence and persist checkpoint version snapshots to S3/SQL.",
    ],
    nonFunctionalRequirements: [
      "<50ms regional peer sync broadcast.",
      "Zero lost keystrokes when a laptop reconnects from a flight.",
    ],
    backOfEnvelopeNotes: [
      "Document editing rooms require sticky routing: ALL collaborators viewing Doc #8412 must connect to the SAME regional authoritative doc worker or shared CRDT mesh.",
    ],
    coreEntities: ["DocRoom(doc_id, crdt_ops_log)", "CheckpointSnapshot(doc_id, version, blob_url)"],
    keyApis: [
      { method: "WS", path: "wss://collab.example.com/docs/:docId", purpose: "Stream binary Yjs/Automerge CRDT state vectors & cursors" },
    ],
    deepDives: [
      {
        topic: "Operational Transformation (OT) vs CRDTs",
        bottleneck: "Naive character-index patching (`insert 'X' at index 5`) scrambles text if two peers edit before index 5 simultaneously.",
        solution: "Use OT (central authority transforms indices sequentially, like Google Docs) or Conflict-Free Replicated Data Types (CRDTs like Yjs/Figma fractional IDs that converge identically peer-to-peer even after offline edits).",
      },
    ],
    seniorHook:
      "Consistent hash sticky rooms (`hash(doc_id) -> CollabServer`) keep active CRDT doc trees warm in RAM while compacting deltas periodically into Object Storage checkpoints so history doesn't grow forever.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-collaborative-docs
  description: "Consistent-hashed multiplayer WebSocket room servers syncing CRDT deltas with S3 snapshots."
system:
  context:
    users:
      - id: editor-client
        name: "Browser Editor Client"
  requirements:
    - id: REQ-COLLAB-01
      category: availability
      priority: must
      statement: "Guarantee deterministic multiplayer document convergence without server single points of failure."
      verification: architecture_check
architecture:
  alternatives:
    - id: crdt-sticky-rooms
      name: "Sticky CRDT Room Servers + Snapshot Compactor"
      decisions:
        - id: ADR-CRDT
          title: "Consistent Hashing to Collab Rooms, Outbox & CRDT Deltas"
          status: accepted
          context: "Broadcasting every keystroke through cold DB rows causes 500ms lag."
          choice: "Hash doc_id to warm in-memory WebSocket CRDT room nodes; checkpoint via Transactional Outbox and async snapshot compactor."
          requirements: [REQ-COLLAB-01]
      components:
        - id: room-router
          name: "Consistent-Hash WS Load Balancer"
          type: load_balancer
          responsibility: "Routes all peers of the same doc_id to the same multiplayer server."
          requirements: [REQ-COLLAB-01]
          deployment:
            replicas: 2
        - id: collab-room-svc
          name: "Multiplayer CRDT Room Fleet"
          type: service
          technology: "Rust / Yjs"
          responsibility: "Merges CRDT ops in RAM, broadcasts deltas, and checkpoints snapshots."
          requirements: [REQ-COLLAB-01]
          deployment:
            replicas: 4
        - id: meta-db
          name: "Documents Permissions & Metadata DB"
          type: relational_database
          technology: "PostgreSQL"
          responsibility: "Stores ACL permissions, workspace folders, and snapshot pointers."
          requirements: [REQ-COLLAB-01]
          data:
            ownership: "docs-domain"
        - id: ops-stream
          name: "CRDT Ops Checkpoint Stream"
          type: event_stream
          technology: "Kafka"
          responsibility: "Streams delta batches to async snapshot compactor."
          requirements: [REQ-COLLAB-01]
          messaging:
            overload_policy: "backpressure_pause"
        - id: snapshot-store
          name: "Document Snapshots Object Store"
          type: object_storage
          technology: "S3"
          responsibility: "Persists compacted binary CRDT document states."
          requirements: [REQ-COLLAB-01]
          data:
            ownership: "docs-snapshots"
        - id: snapshot-compactor
          name: "CRDT Snapshot Compactor Worker"
          type: background_worker
          responsibility: "Compacts streamed deltas into S3 snapshots idempotently."
          requirements: [REQ-COLLAB-01]
          deployment:
            replicas: 2
          behavior:
            idempotent: true
            idempotency_key: "doc_checkpoint_seq"
            retry_policy:
              max_attempts: 3
              backoff: exponential
              dead_letter_target: ops-dlq
        - id: ops-dlq
          name: "Compaction DLQ"
          type: message_queue
          responsibility: "Captures failed compaction batches."
          messaging:
            overload_policy: "alert_ops"
      connections:
        - id: d1
          from: editor-client
          to: room-router
          protocol: synchronous
          transport: wss
        - id: d2
          from: room-router
          to: collab-room-svc
          protocol: synchronous
          transport: wss
        - id: d3
          from: collab-room-svc
          to: meta-db
          protocol: synchronous
          transport: tcp
        - id: d4
          from: collab-room-svc
          to: ops-stream
          protocol: asynchronous
          transport: kafka
        - id: d5
          from: ops-stream
          to: snapshot-compactor
          protocol: asynchronous
          transport: kafka
        - id: d6
          from: snapshot-compactor
          to: snapshot-store
          protocol: synchronous
          transport: https`,
  },
  {
    id: "case-distributed-cache",
    title: "Design a Distributed Cache Cluster (Redis / Memcached)",
    companyAnalog: "Redis Enterprise / ElastiCache",
    difficulty: "intermediate",
    category: "Storage & Cache",
    scaleBadge: "1M Reads/sec | Consistent Hash Ring | Stampede Defense",
    plainOverview:
      "When 1M reads/sec outgrow one Redis box, clients route keys across shards using a Consistent Hash Ring with virtual nodes so adding/losing a cache box barely disturbs cached keys. Protect hot keys with Request Coalescing (`Singleflight`) so one expired entry doesn't unleash 10,000 identical Postgres queries.",
    functionalRequirements: [
      "Store billions of hot KV pairs in RAM across dozens of horizontally scalable cache nodes with sub-millisecond reads.",
    ],
    nonFunctionalRequirements: [
      "Minimize key reshuffling when nodes autoscale or crash.",
      "Protect backend databases from Cache Stampedes and Hot-Key overload.",
    ],
    backOfEnvelopeNotes: [
      "Modulo `hash(k) % N` redistributes nearly 100% of cached keys on a single node failure! Consistent Hashing with ~150 virtual nodes/server restricts reshuffling to `1/N` keys.",
    ],
    coreEntities: ["ConsistentHashRing(vnodes)", "PartitionShard(primary, read_replicas)"],
    keyApis: [
      { method: "TCP", path: "GET / SETEX / EVALSHA", purpose: "Sub-millisecond binary protocol commands via connection pool" },
    ],
    deepDives: [
      {
        topic: "Solving the 3 Cache Killer Bugs",
        bottleneck: "Penetration (missing keys query DB repeatedly), Stampede (expired hot key sends 10K DB hits at once), Avalanche (mass simultaneous TTL expiry).",
        solution: "Use Bloom Filters for non-existent keys (Penetration), Singleflight / Mutex lease per cache miss (Stampede), and randomized TTL jitter `+rand(0..300s)` (Avalanche).",
      },
    ],
    seniorHook:
      "Contrast Redis Cluster hash-slots (16384 slots partitioned cleanly, built-in Lua + ZSET data structures + RDB/AOF) vs simpler Memcached (multithreaded raw slab allocation with zero persistence).",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-distributed-cache
  description: "Consistent-hashed Redis shard cluster shielded by Singleflight request coalescing."
system:
  context:
    users:
      - id: app-clients
        name: "Internal Microservices"
  requirements:
    - id: REQ-CACHE-01
      category: availability
      priority: must
      statement: "Serve sub-2ms cached lookups while resisting stampedes and shard hot-spots."
      verification: architecture_check
architecture:
  alternatives:
    - id: vnode-cache-cluster
      name: "Virtual-Node Hash Ring + Replica Shards"
      decisions:
        - id: ADR-CACHE
          title: "Consistent Hash Slots + Singleflight Miss Coalescing"
          status: accepted
          context: "Cache stampedes and modulo rebalancing overload backend databases."
          choice: "Shard via consistent hash slots with replica promotion and app-side Singleflight locks."
          requirements: [REQ-CACHE-01]
      components:
        - id: cache-proxy
          name: "Smart Cache Client / Twemproxy"
          type: load_balancer
          responsibility: "Maintains hash ring topology and coalesces duplicate miss requests."
          requirements: [REQ-CACHE-01]
          deployment:
            replicas: 3
        - id: cache-shards
          name: "Consistent-Hashed Redis Shards"
          type: cache
          technology: "Redis Cluster (Primary + Replica per Shard)"
          responsibility: "In-memory LRU storage partitioned by 16384 hash slots."
          requirements: [REQ-CACHE-01]
        - id: origin-db
          name: "Origin Backing Database"
          type: relational_database
          technology: "PostgreSQL"
          responsibility: "Cold source of truth loaded only on cache misses."
          requirements: [REQ-CACHE-01]
          data:
            ownership: "origin-store"
      connections:
        - id: cc1
          from: app-clients
          to: cache-proxy
          protocol: synchronous
          transport: tcp
        - id: cc2
          from: cache-proxy
          to: cache-shards
          protocol: synchronous
          transport: tcp
        - id: cc3
          from: cache-proxy
          to: origin-db
          protocol: synchronous
          transport: tcp`,
  },
  {
    id: "case-metrics-pipeline",
    title: "Design Real-Time Metrics & Monitoring System (Datadog / Prometheus)",
    companyAnalog: "Datadog / Prometheus / VictoriaMetrics",
    difficulty: "intermediate",
    category: "Observability",
    scaleBadge: "10M Metrics/sec | TSDB Compression | Downsampling",
    plainOverview:
      "Collecting millions of server heartbeats every second in standard SQL fails immediately. Collectors batch tiny `(timestamp, value)` streams through Kafka into an append-only Time-Series DB that compresses nearly unchanged metrics (`42%, 42%, 43%`) by ~10x and avoids high-cardinality IDs like `user_id` inside metric tags.",
    functionalRequirements: [
      "Collect high-frequency telemetry (CPU, RPS, latency histograms) from 100K hosts, alert on anomalies within 30 seconds, and graph dashboards.",
    ],
    nonFunctionalRequirements: [
      "Write-heavy ingestion must buffer cleanly via Kafka so alerting never drops critical outage signals.",
      "Keep query dashboards fast across 1-year windows via automated 1m/1h rollups.",
    ],
    backOfEnvelopeNotes: [
      "10M metric points/sec compressed via Gorilla XOR/Delta-of-Delta (~1.4 bytes/point) = ~14 MB/sec raw compressed writes.",
    ],
    coreEntities: ["TimeSeriesKey(name, sorted_tags)", "DownsampledRollup(1m, 5m, 1h)"],
    keyApis: [
      { method: "POST", path: "/v1/metrics/ingest", purpose: "Accept batched protobuf OpenTelemetry gauge/histogram vectors" },
    ],
    deepDives: [
      {
        topic: "Controlling Label Cardinality Bombs",
        bottleneck: "Accidental user-ID tags spawn 50M unique series keys, exhausting TSDB inverted index memory.",
        solution: "Enforce gateway cardinality quotas per metric family, reject unbound dynamic tags, and isolate full request-level metadata into trace/log stores.",
      },
    ],
    seniorHook:
      "Always decouple ingestion (`Agent -> Kafka -> TSDB`) AND explain histogram merging (DDSketch / HDR) rather than averaging already-computed pod p99 values.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-metrics-tsdb
  description: "High-throughput telemetry ingestion via Kafka buffers, TSDB shards, and Query/Alert evaluators."
system:
  context:
    users:
      - id: fleet-agents
        name: "Host OTel Collectors"
  requirements:
    - id: REQ-OBS-01
      category: availability
      priority: must
      statement: "Ingest 10M metric points/sec reliably during incidents without dropping alerting signals."
      verification: architecture_check
architecture:
  alternatives:
    - id: kafka-buffered-tsdb
      name: "Kafka-Buffered Time-Series Architecture"
      decisions:
        - id: ADR-TSDB
          title: "Gorilla Compression + Async Rollup Compaction"
          status: accepted
          context: "Uncompressed metrics blow up SSD IOPS over 1-year retention."
          choice: "Use delta-of-delta Gorilla TSDB blocks and background downsampling jobs."
          requirements: [REQ-OBS-01]
      components:
        - id: ingest-gw
          name: "Telemetry Ingestion Gateway"
          type: api_gateway
          responsibility: "Validates cardinality limits and batches protobuf streams into Kafka."
          requirements: [REQ-OBS-01]
          deployment:
            replicas: 4
        - id: metrics-stream
          name: "Metrics Kafka Bus"
          type: event_stream
          technology: "Kafka"
          responsibility: "Absorbs monitoring traffic bursts if storage tier pauses."
          requirements: [REQ-OBS-01]
          messaging:
            overload_policy: "backpressure_pause"
        - id: tsdb-writer
          name: "TSDB Consumer & Rollup Workers"
          type: background_worker
          responsibility: "Aggregates 1m/5m histograms and writes compressed chunks."
          requirements: [REQ-OBS-01]
          deployment:
            replicas: 4
          behavior:
            idempotent: true
            idempotency_key: "series_window_id"
            retry_policy:
              max_attempts: 3
              backoff: fixed
              dead_letter_target: tsdb-dlq
        - id: tsdb-dlq
          name: "Invalid Telemetry DLQ"
          type: message_queue
          responsibility: "Captures malformed metric schemas."
          messaging:
            overload_policy: "drop_oldest"
        - id: tsdb-store
          name: "Distributed TSDB Storage"
          type: observability
          technology: "VictoriaMetrics / Mimir"
          responsibility: "Stores time-partitioned compressed series + inverted tag index."
          requirements: [REQ-OBS-01]
      connections:
        - id: m1
          from: fleet-agents
          to: ingest-gw
          protocol: synchronous
          transport: grpc
        - id: m2
          from: ingest-gw
          to: metrics-stream
          protocol: asynchronous
          transport: kafka
        - id: m3
          from: metrics-stream
          to: tsdb-writer
          protocol: asynchronous
          transport: kafka
        - id: m4
          from: tsdb-writer
          to: tsdb-store
          protocol: synchronous
          transport: tcp`,
  },
  {
    id: "case-enterprise-rag",
    title: "Design an Enterprise AI Search & RAG Copilot",
    companyAnalog: "Perplexity / Glean / Enterprise RAG",
    difficulty: "principal",
    category: "AI Infrastructure",
    scaleBadge: "Hybrid BM25+HNSW | ACL Pre-Filter | Semantic Cache",
    plainOverview:
      "Instead of letting an LLM guess company policies from memory, RAG slices private PDFs into meaning-encoded chunks (`Vectors`), blends keyword + vector results (`Hybrid Search`), checks document permissions *inside* the index before ranking (`ACL Pre-Filter`), and streams cited answers back via SSE.",
    functionalRequirements: [
      "Ingest Slack/Jira/Drive updates continuously, index chunked embeddings, and stream grounded answers with citations.",
      "Strictly enforce user document ACL permissions — never cite confidential docs to unauthorized users.",
    ],
    nonFunctionalRequirements: [
      "<1.5s time-to-first-token (TTFT) via semantic caching and parallel hybrid retrieval.",
    ],
    backOfEnvelopeNotes: [
      "100M document chunks x 1536 dims (int8 scalar quantized = 1.5KB/vec) ~= 150GB RAM across a 4-node HNSW cluster.",
    ],
    coreEntities: ["DocChunk(chunk_id, acl_principals[], embedding, text)", "SemanticCacheEntry"],
    keyApis: [
      { method: "POST", path: "/v1/copilot/query", purpose: "Check semantic cache -> parallel BM25+HNSW w/ ACL pre-filter -> stream LLM tokens" },
    ],
    deepDives: [
      {
        topic: "ACL Security Pre-Filtering + Hybrid Fusion",
        bottleneck: "Filtering ACLs after taking Top-10 vectors drops legitimate docs; dense vectors alone miss exact ticket codes (`ARCH-402`).",
        solution: "Pass `user_group_ids` bitmask pre-filter inside BOTH HNSW vector traversal and BM25 lexical search, then combine scores via Reciprocal Rank Fusion (RRF) + Cross-Encoder Reranker.",
      },
    ],
    seniorHook:
      "Never store raw chunk text twice in HNSW RAM — keep only `(chunk_id, vector, acl_bitmask)` in fast vector memory and hydrate top-20 chunk texts from KV/S3 prior to reranking.",
    archSpecYaml: `archbench:
  spec_version: "0.1"
  project: interview-enterprise-rag
  description: "Semantic-cached Enterprise RAG with ACL-filtered HNSW+BM25 hybrid search and SSE streaming."
system:
  context:
    users:
      - id: employee
        name: "Enterprise User"
  requirements:
    - id: REQ-RAG-01
      category: availability
      priority: must
      statement: "Deliver cited AI answers respecting strict document ACL permissions."
      verification: architecture_check
architecture:
  alternatives:
    - id: hybrid-acl-rag
      name: "Hybrid HNSW+BM25 + Semantic Cache RAG"
      decisions:
        - id: ADR-RAG
          title: "Pre-Filtered Hybrid Retrieval + Semantic Cache"
          status: accepted
          context: "Post-retrieval ACL filtering returns empty prompts; LLM inference is costly."
          choice: "Pre-filter index queries by ACL group principals and cache recurring question clusters."
          requirements: [REQ-RAG-01]
      components:
        - id: rag-gw
          name: "AI Copilot Gateway (Token Limiter)"
          type: api_gateway
          responsibility: "Enforces token/minute rate limits and streams SSE responses."
          requirements: [REQ-RAG-01]
          deployment:
            replicas: 3
        - id: rag-orch
          name: "RAG Orchestrator Service"
          type: service
          technology: "Python / FastAPI"
          responsibility: "Executes semantic cache check, hybrid RRF fusion, and prompt construction."
          requirements: [REQ-RAG-01]
          deployment:
            replicas: 3
        - id: semantic-cache
          name: "Semantic Response Cache"
          type: cache
          technology: "Redis + Vector"
          responsibility: "Returns cached grounded answers for >0.95 cosine matches."
          requirements: [REQ-RAG-01]
        - id: hybrid-index
          name: "Hybrid Vector + BM25 Search Engine"
          type: search_engine
          technology: "Qdrant + OpenSearch"
          responsibility: "Performs ACL-filtered HNSW vector + lexical search."
          requirements: [REQ-RAG-01]
          deployment:
            replicas: 3
        - id: llm-provider
          name: "Hosted LLM Inference Engine"
          type: external_provider
          responsibility: "Generates cited streaming answers under timeout & fallback circuit breakers."
          requirements: [REQ-RAG-01]
      connections:
        - id: g1
          from: employee
          to: rag-gw
          protocol: synchronous
          transport: https
        - id: g2
          from: rag-gw
          to: rag-orch
          protocol: synchronous
          transport: grpc
        - id: g3
          from: rag-orch
          to: semantic-cache
          protocol: synchronous
          transport: tcp
        - id: g4
          from: rag-orch
          to: hybrid-index
          protocol: synchronous
          transport: grpc
        - id: g5
          from: rag-orch
          to: llm-provider
          protocol: synchronous
          transport: https`,
  },
];

/**
 * 42 High-Yield Anki-Style Spaced Repetition System Design Flashcards
 */
export const FLASHCARD_DECK: FlashcardItem[] = [
  // Category 1: Numbers & Math
  {
    id: "fc-1",
    category: "Numbers & Math",
    front: "How many seconds are in one day (useful for QPS math)?",
    simpleHint: "Think 24 hours * 60 minutes * 60 seconds (~round up to 100K in your head).",
    back: "86,400 seconds (~10^5 in quick head math). 100M requests/day ~= 1,150 RPS avg (or ~1K RPS).",
    seniorTip: "Multiply by 2x to 5x for peak-to-average surge QPS.",
  },
  {
    id: "fc-2",
    category: "Numbers & Math",
    front: "How many unique strings can 7-character Base62 (`[0-9a-zA-Z]`) represent?",
    simpleHint: "26 lowercase + 26 uppercase + 10 digits = 62 symbols, raised to the 7th power.",
    back: "62^7 ~= 3.52 TRILLION unique keys.",
    seniorTip: "Even generating 1,000 TinyURL links/second takes >110 years to exhaust 7-char Base62.",
  },
  {
    id: "fc-3",
    category: "Numbers & Math",
    front: "How fast is an NVMe random read vs same-datacenter network RTT vs cross-continent packet?",
    simpleHint: "One local SSD disk read takes ~0.1ms; crossing one datacenter rack takes ~0.5ms; crossing the US takes ~70ms.",
    back: "NVMe read: ~0.1ms (100 µs) | Same-AZ TCP RTT: ~0.5ms | Cross-Continent (US East<->West): ~70ms.",
    seniorTip: "A cross-ocean sync call is ~140x slower than a local same-AZ microservice call.",
  },
  {
    id: "fc-4",
    category: "Numbers & Math",
    front: "Quick Availability rule: How much downtime per year is 99.9% vs 99.99% vs 99.999%?",
    simpleHint: "Remember 'Three 9s ~ 9 hours'; each extra 9 shrinks yearly downtime by 10x.",
    back: "Three 9s (99.9%) = 8.76 hours/yr. Four 9s (99.99%) = 52.6 mins/yr. Five 9s (99.999%) = 5.26 mins/yr.",
    seniorTip: "Adding external third-party sync APIs along the critical path caps your combined availability mathematically (`A_total = A1 * A2`).",
  },
  {
    id: "fc-5",
    category: "Numbers & Math",
    front: "How many connections can one well-tuned Linux stateful WebSocket node hold?",
    simpleHint: "Each open TCP socket costs only ~10-50 KB of RAM kernel buffers, not megabytes.",
    back: "~50,000 to 100,000+ concurrent TCP sockets (memory-bound on socket buffers, ~10-50KB/conn -> few GB RAM).",
    seniorTip: "Always check ephemeral port limits (65K per target IP) on outbound proxies cleanly using multiple virtual IPs if needed.",
  },
  {
    id: "fc-6",
    category: "Numbers & Math",
    front: "Rough RAM capacity vs NVMe cost ratio for sizing a Cache Tier?",
    simpleHint: "Think about the classic 80/20 Pareto shortcut for active daily data.",
    back: "Applying the 80/20 rule: caching 20% of daily active read keys handles ~80% of traffic while cutting DB IOPS 5x.",
    seniorTip: "Don't size Redis to store 5 years of historical archive — size it for the hot working set!",
  },
  {
    id: "fc-7",
    category: "Numbers & Math",
    front: "What is 1 million x 1 KB?",
    simpleHint: "Million = `10^6`, Kilobyte = `10^3` -> `10^9` bytes.",
    back: "1 GB (~10^9 bytes). Memorize multiples: 1M * 1B = 1MB; 1M * 1KB = 1GB; 1B * 1KB = 1TB; 1B * 1MB = 1PB.",
    seniorTip: "Say those 4 anchors effortlessly during Back-of-the-Envelope estimation.",
  },
  {
    id: "fc-8",
    category: "Numbers & Math",
    front: "How many reads/writes per second can a well-tuned single PostgreSQL box vs Redis node sustain?",
    simpleHint: "Disk-backed SQL handles low thousands/sec comfortably; pure RAM Redis handles roughly 10-20x more.",
    back: "PostgreSQL: ~5K-15K TPS simple indexed ops (disk/WAL bound). Single Redis core: ~80K-150K ops/sec in RAM.",
    seniorTip: "Always cite PostgreSQL first up to ~5K writes/sec before prematurely pitching sharded NoSQL.",
  },
  {
    id: "fc-9",
    category: "Numbers & Math",
    front: "How much bandwidth does 100K RPS of 2KB JSON responses consume?",
    simpleHint: "First multiply requests x bytes (`200 MB/sec`), then multiply by 8 to convert Bytes -> bits (`Gbps`).",
    back: "100,000 * 2 KB = 200 MB/sec = 1.6 Gbps egress (compressed with Gzip/Brotli ~0.4 Gbps).",
    seniorTip: "Always convert Bytes/sec x 8 -> bits/sec (Gbps) because network interfaces are rated in Gbps!",
  },
  {
    id: "fc-10",
    category: "Numbers & Math",
    front: "What is the storage overhead of 3x Replication vs Reed-Solomon (10+4) Erasure Coding?",
    simpleHint: "Full 3x copies = 300% disk; 10+4 stores only 14 total chunks for every 10 data chunks.",
    back: "3x Replication = +200% overhead (3.0x raw disk). 10+4 Erasure Coding = +40% overhead (1.4x raw disk) while still surviving 4 simultaneous drive losses.",
    seniorTip: "Mention Erasure Coding specifically in S3/Dropbox/YouTube cold blob designs.",
  },

  // Category 2: Storage & Cache
  {
    id: "fc-11",
    category: "Storage & Cache",
    front: "B-Tree vs LSM-Tree: which wins for write-heavy telemetry and which wins for predictable indexed reads?",
    simpleHint: "One writes sequentially to an append log first (`LSM`); the other mutates sorted 16KB dictionary pages in place (`B-Tree`).",
    back: "LSM-Tree (Cassandra/RocksDB) excels at massive sequential appends via Memtable + WAL; B-Tree (PostgreSQL/InnoDB) excels at stable low-variance point & range reads.",
    seniorTip: "LSM-Trees can suffer periodic read/write stalls during heavy SSTable background compaction.",
  },
  {
    id: "fc-12",
    category: "Storage & Cache",
    front: "How do you distinguish Cache Penetration, Cache Stampede (Dogpile), and Cache Avalanche?",
    simpleHint: "Fake keys that don't exist anywhere vs ONE hot key expiring vs ALL keys expiring simultaneously.",
    back: "Penetration = querying non-existent keys (fix: Bloom filter / cache null). Stampede = expired hot key slams DB concurrently (fix: Singleflight lock). Avalanche = mass simultaneous expiry (fix: TTL jitter).",
    seniorTip: "Naming the exact fix for all 3 instantly signals senior caching fluency.",
  },
  {
    id: "fc-13",
    category: "Storage & Cache",
    front: "Cache-Aside vs Write-Through vs Write-Behind (Write-Back): when does Write-Behind lose data?",
    simpleHint: "Which pattern replies 'Saved!' while changes are still sitting un-flushed in volatile RAM?",
    back: "Write-Behind acks writes in cache RAM immediately and flushes asynchronously to DB — fast, but crashes lose buffered dirty writes if un-replicated.",
    seniorTip: "Only use Write-Behind for non-critical counters/views/telemetry, never for bank balances.",
  },
  {
    id: "fc-14",
    category: "Storage & Cache",
    front: "Why does `SELECT ... OFFSET 1000000 LIMIT 20` cripple SQL feeds at scale, and what replaces it?",
    simpleHint: "To skip 1 million rows, SQL still has to count through all 1 million before throwing them away; use a `WHERE id < cursor` bookmark instead.",
    back: "Offset pagination forces the DB to scan & discard 1,000,000 rows first (O(N)). Cursor/Keyset pagination (`WHERE created_id < last_seen_id LIMIT 20`) jumps directly via B-Tree index in O(log N).",
    seniorTip: "Specify cursor pagination in every Feed, Search, or Chat API contract.",
  },
  {
    id: "fc-15",
    category: "Storage & Cache",
    front: "Why should clients upload 2GB videos directly to S3 via Pre-Signed URLs instead of hitting your App API?",
    simpleHint: "Don't force browsers to pour a 2GB stream through your web API servers just to forward it again.",
    back: "Proxying large blobs ties up gateway sockets, doubles egress/ingress bandwidth, and causes OOM spikes; pre-signed URLs offload raw bytes directly to S3.",
    seniorTip: "Combine Pre-Signed Multipart Uploads with an S3 Event -> SQS/Kafka trigger to start async processing.",
  },
  {
    id: "fc-16",
    category: "Storage & Cache",
    front: "What is Read-After-Write Consistency bug with Database Read Replicas, and how do you fix it?",
    simpleHint: "A user saves a new profile photo, reloads immediately, and randomly hits a follower DB 500ms behind!",
    back: "A user updates their profile on Primary DB, reloads immediately, and hits a lagging Read Replica showing stale data. Fix: route user's own reads to Primary for ~5s after writes, or compare replica LSN watermarks.",
    seniorTip: "Also great for comments/posts: optimistically update UI state AND pin writer's reads briefly.",
  },
  {
    id: "fc-17",
    category: "Storage & Cache",
    front: "Why does Modulo Sharding (`hash(k) % N`) break autoscaling, and how do Consistent Hashing + Vnodes solve it?",
    simpleHint: "When divisor `N` changes (`4 -> 5`), almost every `% N` remainder changes; ring placement isolates moves.",
    back: "Modulo moves ~(N-1)/N (~90%) of keys when node count changes. Consistent Hashing moves only ~1/N keys, and Virtual Nodes keep key distribution variance tight.",
    seniorTip: "Add salted key suffixes (`celebrity_id#01..#10`) when ONE logical hot key overloads even a balanced hash ring.",
  },
  {
    id: "fc-18",
    category: "Storage & Cache",
    front: "What HTTP status code distinction matters for TinyURL: 301 vs 302?",
    simpleHint: "One tells browsers 'Never ask my server again, cache permanently'; the other routes clicks back through you.",
    back: "301 (Permanent) makes browsers cache redirects locally, starving analytics; 302 (Found/Temporary) forces hits through the redirect service so you capture click events.",
    seniorTip: "Highlight this classic trade-off between analytics accuracy and edge origin offload.",
  },
  {
    id: "fc-19",
    category: "Storage & Cache",
    front: "Why shouldn't Prometheus metric tags contain `user_id` or `request_id`?",
    simpleHint: "Every unique tag combination allocates a permanent new time-series line in memory.",
    back: "Each unique tag value creates a separate inverted time-series index entry (Cardinality Explosion), rapidly OOM-crashing the TSDB.",
    seniorTip: "Keep high-cardinality IDs in distributed traces/structured logs, never in metric labels.",
  },
  {
    id: "fc-20",
    category: "Storage & Cache",
    front: "What is a Covering Index in SQL?",
    simpleHint: "Think of an index that already carries the extra columns you requested (`INCLUDE`), avoiding a trip to the main table.",
    back: "An index containing all columns requested by a query (`CREATE INDEX idx ON orders(user_id) INCLUDE (status, total)`), enabling an Index-Only Scan without fetching heap table pages.",
    seniorTip: "Cuts random NVMe IOPS in half on hot pagination queries.",
  },

  // Category 3: Distributed Theory
  {
    id: "fc-21",
    category: "Distributed Theory",
    front: "What does the PACELC theorem add beyond CAP?",
    simpleHint: "CAP only talks about broken networks (`P`); PACELC asks what happens the 99.9% of the time when networks work normally (`E` = Else).",
    back: "If there is a Partition (P), trade off Availability (A) vs Consistency (C); ELSE (E) during normal healthy operation, trade off Latency (L) vs Consistency (C).",
    seniorTip: "Notice why Dynamo/Cassandra are PA/EL (fast local writes always) while Spanner/PostgreSQL sync-commit are PC/EC.",
  },
  {
    id: "fc-22",
    category: "Distributed Theory",
    front: "What does `W + R > N` guarantee in Dynamo-style Quorums, and when can it STILL fail?",
    simpleHint: "Overlapping sets find the latest version *provided* quorum strictly talks to owning home nodes (`W+R > N`) and timestamps aren't colliding.",
    back: "Guarantees read quorum overlaps at least 1 replica holding the latest write. Still fails without Sloppy Quorum/Hinted Handoff isolation, concurrent unversioned writes (needs LWW/Vector Clocks), or failed partial writes before rollback.",
    seniorTip: "Mention Read Repair + Anti-Entropy Merkle Trees to sync diverging replicas in the background.",
  },
  {
    id: "fc-23",
    category: "Distributed Theory",
    front: "Why are Fencing Tokens essential with Redis / ZooKeeper Distributed Locks?",
    simpleHint: "If Worker A freezes in Garbage Collection past its timeout, how does Storage know Key A is now expired/stale?",
    back: "A lock holder paused by a 15-second GC stop-the-world can wake up after its lease expired and write stale state — unless storage checks an ever-increasing monotonic Fencing Token issued by the lock service.",
    seniorTip: "Explaining Fencing Tokens immediately separates Staff engineers from those who just say 'use Redis SET NX'.",
  },
  {
    id: "fc-24",
    category: "Distributed Theory",
    front: "Why do NTP Wall Clocks (`Date.now()`) corrupt Last-Write-Wins (LWW) ordering across servers?",
    simpleHint: "Two servers' clocks don't tick identically — one can jump backward milliseconds during time sync!",
    back: "Physical quartz clocks drift and jump backward/forward during NTP corrections (`clock skew`), causing an earlier logical event to carry a newer timestamp and silently overwrite fresher writes.",
    seniorTip: "Use Hybrid Logical Clocks (HLC), Raft monotonic terms, or Snowflake sequence bits.",
  },
  {
    id: "fc-25",
    category: "Distributed Theory",
    front: "Describe the 64-bit Twitter Snowflake ID bit layout.",
    simpleHint: "1 unused sign bit + ~41 bits millisecond time + ~10 bits worker ID + ~12 bits per-ms counter.",
    back: "1 sign bit (0) + 41 timestamp bits (~69 years ms precision) + 10 datacenter/worker machine bits (1,024 nodes) + 12 per-ms sequence bits (4,096 IDs/ms/node).",
    seniorTip: "Fits cleanly into a signed 64-bit BIGINT primary key AND stays roughly K-sorted by time for friendly B-Tree page appends.",
  },
  {
    id: "fc-26",
    category: "Distributed Theory",
    front: "What is a Split-Brain scenario in Leader-Follower databases and how does Raft prevent it?",
    simpleHint: "What happens if an isolated minority thinks it should elect a new leader, and how does majority quorum math stop it?",
    back: "A network partition tricks two nodes into both thinking they are Primary, accepting conflicting writes. Raft prevents this by requiring a strict majority vote (`floor(N/2)+1`) with monotonic term numbers.",
    seniorTip: "Also why production clusters use ODD node counts (3 or 5, never 2 or 4)!",
  },
  {
    id: "fc-27",
    category: "Distributed Theory",
    front: "Why does `Exactly-Once Delivery` over an unreliable network strictly reduce to `At-Least-Once + Idempotency`?",
    simpleHint: "If the ACK packet drops on the return trip, the sender can't tell 'never arrived' apart from 'processed, ACK lost'.",
    back: "Two Generals Problem: a dropped ACK means the sender never knows whether the consumer processed message M or crashed first; retrying guarantees At-Least-Once, and deterministic Idempotency Keys make duplicates a safe no-op.",
    seniorTip: "Pair HTTP `Idempotency-Key` headers with SQL `UNIQUE` constraints on `(key, tenant)`.",
  },
  {
    id: "fc-28",
    category: "Distributed Theory",
    front: "What is the Core trade-off between Kafka Pull consumers and RabbitMQ Push workers?",
    simpleHint: "Think 'replayable shared event log where workers read at their own speed' vs 'task dispatcher deleting messages after ACK'.",
    back: "Kafka lets consumers pull batches at their own sustainable pace with replayable partitioned offsets (high throughput). RabbitMQ pushes individual tasks with flexible routing keys and per-message ACK/NACK.",
    seniorTip: "Never use Kafka when you need per-message complex routing or per-task multi-day arbitrary delays without extra scheduling layers.",
  },
  {
    id: "fc-29",
    category: "Distributed Theory",
    front: "How do Two-Phase Commit (2PC) and the Saga Pattern differ for multi-service workflows?",
    simpleHint: "Does it freeze locks across remote DBs together, OR execute local steps paired with backward compensating cancellations?",
    back: "2PC locks resources synchronously across DBs until coordinator commits (brittle, blocks if coordinator crashes). Sagas break workflows into independent local transactions with asynchronous forward steps & Compensating Undo actions.",
    seniorTip: "Use Orchestration Sagas (Temporal / Step Functions) for complex multi-step payment/travel checkouts.",
  },
  {
    id: "fc-30",
    category: "Distributed Theory",
    front: "What is a Vector Clock vs a CRDT in optimistic conflict resolution?",
    simpleHint: "One records causal `[node: counter]` history to spot siblings; the other uses math rules (`OR-Set`, `G-Counter`) that auto-merge cleanly.",
    back: "Vector Clocks detect causal forks (`[A:2, B:1]` vs `[A:1, B:2]`) so the app merges siblings; CRDTs encode commutative mathematical lattices (G-Counter, OR-Set) that merge deterministically without app logic.",
    seniorTip: "Shopping carts fit Vector Clocks/LWW; collaborative Figma cursors & rich documents fit CRDTs.",
  },

  // Category 4: Senior Pattern Hooks
  {
    id: "fc-31",
    category: "Senior Pattern Hooks",
    front: "How do you eliminate the Dual-Write Hazard between a SQL Database commit and publishing to Kafka?",
    simpleHint: "Put the business write AND the outbound message record inside ONE single SQL transaction, then tail it afterward.",
    back: "Transactional Outbox Pattern: commit domain entity + `outbox_events` row in ONE local ACID DB transaction, then have Debezium CDC / relay poll publish to Kafka.",
    seniorTip: "Explicitly triggered as ArchBench rule `DATA-001`!",
  },
  {
    id: "fc-32",
    category: "Senior Pattern Hooks",
    front: "How do you stop Retry Storms from turning a transient 5-second hiccup into a 2-hour self-DDoS?",
    simpleHint: "Spread retries out exponentially with randomness (`Full Jitter`) and open a breaker so dying services can heal.",
    back: "Combine `max_attempts <= 3` + Full Jitter Exponential Backoff + Circuit Breaker (trip OPEN fast at 50% errors) + Retry Budgets.",
    seniorTip: "Mention `Full Jitter`: `sleep = random(0, min(cap, base * 2^attempt))`.",
  },
  {
    id: "fc-33",
    category: "Senior Pattern Hooks",
    front: "Explain Backpressure vs Dead Letter Queues (DLQs) when consumers fall behind vs hit poison pills.",
    simpleHint: "Healthy-but-slow traffic needs intake throttling; permanently unparseable corrupted payloads need quarantine aside.",
    back: "Slow healthy consumers -> Backpressure (`bounded queue`, load shedding, HTTP 429). Permanently broken schema/poison messages -> route to DLQ after max retries so queues don't jam.",
    seniorTip: "Trigger alerts on DLQ depth AND keep replay tooling ready once the bug fix deploys.",
  },
  {
    id: "fc-34",
    category: "Senior Pattern Hooks",
    front: "Why does Ticketmaster need a Virtual Waiting Room BEFORE PostgreSQL row locking?",
    simpleHint: "What happens to a SQL DB connection pool if 1,000,000 fans all hit `SELECT FOR UPDATE` at 10:00:00 AM?",
    back: "Row locking prevents double-selling 50K seats cleanly, but 1M concurrent buyers hitting `SELECT FOR UPDATE` simultaneously exhausts connection pools & CPU. Waiting Rooms meter concurrency safely.",
    seniorTip: "Layer rate shedding/waiting rooms at the Edge before database lock contention starts.",
  },
  {
    id: "fc-35",
    category: "Senior Pattern Hooks",
    front: "Why is Hybrid Fanout (Push normal, Pull celebrity) mandatory in Social News Feeds?",
    simpleHint: "Pre-filling 300 friends' timelines takes <1ms; pre-filling 50,000,000 followers melts workers!",
    back: "Fanout-on-Write works great for 300 followers (~1ms Redis writes) but chokes workers on 50M celebrity followers. Pulling celebrity posts at read time isolates blast radius.",
    seniorTip: "Adjust the celebrity follower threshold dynamically (e.g., 10K-100K followers).",
  },
  {
    id: "fc-36",
    category: "Senior Pattern Hooks",
    front: "How do you prevent the Geohash Boundary Edge Case in Uber nearby search?",
    simpleHint: "Think of a Tic-Tac-Toe 3x3 square grid centered on your current cell (or hexagon tiles).",
    back: "Always query the target Geohash cell PLUS its 8 immediate neighbors (3x3 grid), or use H3 hexagons where all neighbor centers share equidistant geometry.",
    seniorTip: "Classic Geo follow-up question interviewers love asking.",
  },
  {
    id: "fc-37",
    category: "Senior Pattern Hooks",
    front: "What is the 'JustEnough / Occam Architecture' rule against over-engineering?",
    simpleHint: "Don't deploy Kafka + 15 microservices for 10 RPS unless explicit scale or team constraints force it.",
    back: "Every extra microservice, queue, or polyglot store adds operational tax, network hops, and failure modes. Justify every component against an explicit Functional or Non-Functional requirement.",
    seniorTip: "A clean Modular Monolith + PostgreSQL + Redis beats 14 ungrounded microservices for early/mid scale.",
  },
  {
    id: "fc-38",
    category: "Senior Pattern Hooks",
    front: "Why do long synchronous microservice call chains (`A -> B -> C -> D -> E`) crash system availability?",
    simpleHint: "Multiply `0.99 * 0.99 * 0.99 * 0.99 * 0.99` and watch slow tail latency stack across every hop.",
    back: "Multiplies latency tail (`p99` stacks across every hop) AND shrinks reliability (`0.99^5 = 0.95` = 43 hrs downtime/yr!). Decouple non-critical side effects via async events (`STRUC-001`).",
    seniorTip: "Move audit logs, analytics, emails, and webhooks out of the synchronous request path immediately.",
  },
  {
    id: "fc-39",
    category: "Senior Pattern Hooks",
    front: "Why must enterprise RAG vector search apply ACL permission filtering BEFORE taking Top-K?",
    simpleHint: "Suppose the top 5 closest secret docs belong to the CEO (`Forbidden`), and authorized docs sit at #6–10.",
    back: "Filtering permissions AFTER fetching Top-K vectors leaves users with 0 authorized answers if restricted docs scored highest.",
    seniorTip: "Pair pre-filtered HNSW with BM25 lexical matching + Reciprocal Rank Fusion (RRF).",
  },
  {
    id: "fc-40",
    category: "Senior Pattern Hooks",
    front: "Why do financial ledgers store amounts as integer minor units (`cents`) with Double-Entry rows instead of mutable float balances?",
    simpleHint: "Think `0.1 + 0.2 === 0.30000000000000004` in IEEE-754 floats, plus audit trails (`debits == credits`).",
    back: "Floats suffer IEEE-754 rounding errors (`0.1 + 0.2 != 0.3`); immutable balanced debit/credit pairs provide full cryptographic auditability and catch drift via nightly reconciliation.",
    seniorTip: "Mention `account_balance` materialized snapshots with optimistic concurrency checks alongside ledger append logs.",
  },
  {
    id: "fc-41",
    category: "Senior Pattern Hooks",
    front: "How do you safely protect an internal database from cascading retries if a downstream service slows down?",
    simpleHint: "Think request timeouts, passing deadlines downstream, failing fast locally, and serving safe fallbacks.",
    back: "Strict client timeouts (never infinite!) + deadline propagation (pass remaining RPC timeout down) + Circuit Breakers + graceful degraded responses (cached/default fallback).",
    seniorTip: "Deadline propagation stops upstream timed-out callers from leaving orphaned workers chewing DB CPU.",
  },
  {
    id: "fc-42",
    category: "Senior Pattern Hooks",
    front: "What distinguishes L4 vs L7 Load Balancers?",
    simpleHint: "Think reading raw shipping envelope TCP ports vs opening the HTTP payload to inspect URLs/cookies.",
    back: "L4 balances raw TCP/UDP 5-tuple packets ultra-fast without inspecting HTTP bytes. L7 terminates TLS, reads URL paths/headers/cookies to route (`/api` vs `/static`), inject rate limits, and enforce sticky sessions.",
    seniorTip: "Often stacked together: Anycast DNS -> L4 Maglev/NLB -> L7 Envoy/ALB fleet.",
  },
];
