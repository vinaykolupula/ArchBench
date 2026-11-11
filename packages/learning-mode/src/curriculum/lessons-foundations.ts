import { SystemDesignLesson } from "../types.js";

export const LESSONS_FOUNDATIONS: SystemDesignLesson[] = [
  {
    id: "lesson-zero-to-millions",
    trackId: "track-foundations",
    order: 1,
    title: "Scale From Zero to Millions of Users",
    subtitle: "Progressive multi-stage evolution from a single box to a horizontally sharded global fleet.",
    difficulty: "foundation",
    estimatedMinutes: 10,
    xpReward: 60,
    tags: ["scaling", "load-balancer", "cache", "cdn", "sharding"],
    plainEnglishAnalogy:
      "Think of a growing neighborhood restaurant: on Day 1, one chef cooks, cleans, and takes orders in one tiny kitchen. At 1,000 customers, you separate the front register (Web) from the kitchen (Database), hire multiple cooks behind a host stand (Load Balancer), keep pre-sliced ingredients next to the stove (Redis Cache), and hang paper order tickets on a spinning rail for the bakery (Async Queue).",
    keyTerms: [
      { term: "L7 Load Balancer", plainMeaning: "A smart traffic director that inspects HTTP URLs/headers and sends requests to healthy backend servers." },
      { term: "WAL / Binlog", plainMeaning: "An append-only journal where a database writes every change first so replicas can copy it safely." },
      { term: "Stateless App Tier", plainMeaning: "Backend servers that store user sessions in Redis/JWT instead of local RAM, so any server can handle any click." },
      { term: "Async Queue", plainMeaning: "A holding buffer (like Kafka/SQS) so slow work (sending emails/receipts) happens in the background without freezing checkout." },
    ],
    summary:
      "Designing for 10M users on Day 1 fails due to operational bloat; scaling systematically adds infrastructure layers only when concrete bottlenecks emerge.",
    whyItMatters:
      "Every famous distributed system started small and layered complexity incrementally: separating web from database, load balancing stateless servers, replicating reads, offloading static assets to CDNs, caching hot rows in Redis, decoupling writes via queues, and finally sharding partitions.",
    interactiveSim: "zero-to-millions",
    evolutionStages: [
      {
        stageNumber: 1,
        title: "Single-Server Setup",
        scaleLabel: "1 - 500 Users",
        nodes: [
          { id: "c", label: "Browser / App", kind: "client", tier: 0 },
          { id: "dns", label: "DNS", kind: "edge", tier: 0 },
          { id: "box", label: "Web + App + SQLite/PG", kind: "service", tier: 1, highlight: true },
        ],
        edges: [
          { from: "c", to: "dns", label: "DNS Lookup" },
          { from: "c", to: "box", label: "HTTP :443" },
        ],
        problemSolved: "Simplest deployable architecture with zero network hops between compute and storage.",
        remainingBottleneck: "Compute CPU competes with database disk I/O; zero fault tolerance (total SPOF).",
      },
      {
        stageNumber: 2,
        title: "Separate Web & Database Tier",
        scaleLabel: "500 - 10K Users",
        nodes: [
          { id: "c", label: "Users", kind: "client", tier: 0 },
          { id: "web", label: "Web / API Server", kind: "service", tier: 1 },
          { id: "db", label: "PostgreSQL DB", kind: "db", tier: 2, highlight: true },
        ],
        edges: [
          { from: "c", to: "web", label: "HTTPS" },
          { from: "web", to: "db", label: "TCP :5432" },
        ],
        problemSolved: "App compute and storage scale independently using tuned hardware.",
        remainingBottleneck: "Single Web node is still a SPOF and caps out at ~2k–5k concurrent connections.",
      },
      {
        stageNumber: 3,
        title: "Load Balancer + Horizontal Web Fleet",
        scaleLabel: "10K - 100K Users",
        nodes: [
          { id: "c", label: "Users", kind: "client", tier: 0 },
          { id: "lb", label: "L7 Load Balancer", kind: "lb", tier: 1, highlight: true },
          { id: "w1", label: "API Server #1", kind: "service", tier: 2 },
          { id: "w2", label: "API Server #2", kind: "service", tier: 2 },
          { id: "db", label: "Primary DB", kind: "db", tier: 3 },
        ],
        edges: [
          { from: "c", to: "lb", label: "Public IP" },
          { from: "lb", to: "w1", label: "Private" },
          { from: "lb", to: "w2", label: "Private" },
          { from: "w1", to: "db", label: "SQL" },
          { from: "w2", to: "db", label: "SQL" },
        ],
        problemSolved: "Eliminates Web Tier SPOF via health checks and horizontal stateless servers.",
        remainingBottleneck: "Database now handles 100% of reads and writes; read traffic starves primary writes.",
      },
      {
        stageNumber: 4,
        title: "Database Read Replicas",
        scaleLabel: "100K - 500K Users",
        nodes: [
          { id: "lb", label: "Load Balancer", kind: "lb", tier: 0 },
          { id: "api", label: "Stateless APIs", kind: "service", tier: 1 },
          { id: "dbp", label: "Master DB (Writes)", kind: "db", tier: 2 },
          { id: "dbr", label: "Read Replicas (x3)", kind: "replica", tier: 2, highlight: true },
        ],
        edges: [
          { from: "lb", to: "api", label: "HTTPS" },
          { from: "api", to: "dbp", label: "INSERT/UPDATE" },
          { from: "api", to: "dbr", label: "SELECT" },
          { from: "dbp", to: "dbr", label: "WAL Replication", style: "async" },
        ],
        problemSolved: "Reads typically exceed writes 10:1; offloading SELECTs scales read capacity horizontally.",
        remainingBottleneck: "Disk reads still take ~0.2ms–10ms under hot repeated queries; static media overloads origin.",
      },
      {
        stageNumber: 5,
        title: "In-Memory Cache + Global Edge CDN",
        scaleLabel: "500K - 2M Users",
        nodes: [
          { id: "c", label: "Global Users", kind: "client", tier: 0 },
          { id: "cdn", label: "Edge CDN", kind: "edge", tier: 1, highlight: true },
          { id: "api", label: "Stateless APIs", kind: "service", tier: 1 },
          { id: "redis", label: "Redis Cache", kind: "cache", tier: 2, highlight: true },
          { id: "db", label: "Primary + Replicas", kind: "db", tier: 2 },
        ],
        edges: [
          { from: "c", to: "cdn", label: "Static Images/JS" },
          { from: "c", to: "api", label: "API Calls" },
          { from: "api", to: "redis", label: "Sub-ms GET" },
          { from: "api", to: "db", label: "Cache Miss" },
        ],
        problemSolved: "RAM caching absorbs 80%+ hot reads (<1ms) while CDN offloads bandwidth close to users.",
        remainingBottleneck: "Write bursts, heavy background tasks (emails, video), and session affinity block HTTP threads.",
      },
      {
        stageNumber: 6,
        title: "Message Queues & DB Sharding",
        scaleLabel: "10M+ Users",
        nodes: [
          { id: "api", label: "Stateless APIs", kind: "service", tier: 0 },
          { id: "q", label: "Kafka / RabbitMQ", kind: "queue", tier: 1, highlight: true },
          { id: "wk", label: "Async Workers", kind: "worker", tier: 2 },
          { id: "s1", label: "Shard 1 (A-M)", kind: "shard", tier: 2, highlight: true },
          { id: "s2", label: "Shard 2 (N-Z)", kind: "shard", tier: 2, highlight: true },
        ],
        edges: [
          { from: "api", to: "s1", label: "Hash(user)" },
          { from: "api", to: "s2", label: "Hash(user)" },
          { from: "api", to: "q", label: "Async Jobs", style: "async" },
          { from: "q", to: "wk", label: "Consume", style: "async" },
        ],
        problemSolved: "Writes partition across shards while heavy async jobs buffer gracefully through workers.",
        remainingBottleneck: "Cross-shard joins become impossible in SQL and multi-region latency requires geo-DNS.",
      },
    ],
    coreEntities: [
      {
        name: "Stateless App Tier",
        category: "Compute",
        responsibility: "Stores zero local session memory so any node can handle any request interchangeably.",
        whenToUse: "As soon as you exceed 1 web container and place servers behind a Load Balancer.",
      },
      {
        name: "Read Replica",
        category: "Database Scaling",
        responsibility: "Receives asynchronous WAL/Binlog streams from Master DB to absorb SELECT read load.",
        whenToUse: "When read QPS saturates Master CPU while write volume still fits on a single node.",
      },
    ],
    tradeOffs: [
      {
        approach: "Vertical Scaling (Scale Up)",
        pros: ["Zero code or network complexity", "Strong single-node ACID transactions"],
        cons: ["Hard hardware ceiling", "Single Point of Failure"],
        bestFor: "Early traction and workloads < 5,000 RPS",
      },
      {
        approach: "Horizontal Scaling (Scale Out)",
        pros: ["Near-infinite elasticity", "Zero-downtime rolling upgrades"],
        cons: ["Requires stateless design", "Distributed locks, network hops, eventual consistency"],
        bestFor: "High availability (>= 99.95%) and > 10k RPS",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Keep web servers stateless by externalizing sessions to Redis or stateless JWT tokens before horizontally scaling.",
        failurePrevented: "Prevents sticky-session imbalance and lost logins on autoscaling node termination.",
        redFlagToAvoid: "Immediately proposing 12 microservices and Kubernetes when designing a 500 RPS internal dashboard.",
      },
    ],
    quizzes: [
      {
        id: "quiz-z2m-1",
        scenarioPrompt:
          "Your SaaS backend hits 85% CPU on the single PostgreSQL node. 92% of SQL queries are identical product catalog reads, and write traffic is light (< 80 QPS). What should you add FIRST?",
        options: [
          { id: "a", label: "Shard PostgreSQL across 8 nodes by tenant_id", explanation: "Sharding introduces cross-shard join headaches far before caches or read replicas are exhausted." },
          { id: "b", label: "Add a Redis Read Cache + Read Replica", explanation: "Correct! Absorbing 90%+ repeated read traffic via cache/replicas solves read saturation cleanly without complex sharding." },
          { id: "c", label: "Introduce Apache Kafka between the client and database", explanation: "Kafka buffers asynchronous writes; it does not accelerate synchronous catalog read queries." },
        ],
        correctOptionId: "b",
        xpReward: 50,
      },
    ],
    furtherReading: ["Stateless App Tiers & Read-Replica Scaling", "Partitioning & Horizontal Sharding Strategies"],
  },
  {
    id: "lesson-latency-capacity",
    trackId: "track-foundations",
    order: 2,
    title: "Latency Numbers & Back-of-the-Envelope Math",
    subtitle: "Jeff Dean's hardware hierarchy and rapid QPS/storage/bandwidth estimation rules.",
    difficulty: "foundation",
    estimatedMinutes: 8,
    xpReward: 50,
    tags: ["estimations", "latency", "jeff-dean", "qps", "primer"],
    plainEnglishAnalogy:
      "Numbers become effortless once you shrink them to human chores: reading CPU cache (1 second) is grabbing a pen on your desk; reading RAM (1.5 minutes) is walking to a hallway cabinet; an SSD read (6 hours) is driving across town; and a cross-ocean network call (4.7 YEARS!) is walking across the continent. You never want a hot checkout page making 20 cross-country trips!",
    keyTerms: [
      { term: "RPS / QPS", plainMeaning: "Requests (or Queries) Per Second — calculated roughly by dividing daily actions by `86,400` (approx `100,000`)." },
      { term: "P99 Tail Latency", plainMeaning: "The speed experienced by the slowest 1% of users (if 99 people wait 10ms, P99 is the unlucky 100th person)." },
      { term: "80/20 Cache Rule", plainMeaning: "Roughly 80% of all traffic hits the same hot 20% of data, which is why sizing Redis for 20% of daily data eliminates most DB reads." },
      { term: "Egress Bandwidth", plainMeaning: "Total data flying OUT to users per second (`Read QPS * Payload Size`), often the hidden cloud billing bomb." },
    ],
    summary:
      "Senior architects predict system bottlenecks on paper in 3 minutes using order-of-magnitude latency gaps and 86,400 seconds/day approximations.",
    whyItMatters:
      "RAM (~100 ns) is 1,500x faster than random SSD reads (~150 us) and 100,000x faster than HDD seeks (~10 ms). Understanding these gaps immediately justifies why caching, batching, and sequential append logs dominate database performance.",
    coreEntities: [
      {
        name: "86,400s ~ 10^5s Rule",
        category: "QPS Math",
        responsibility: "10M daily actions / ~10^5 sec = ~100 Avg QPS (and ~300–500 Peak QPS).",
        whenToUse: "Every system design interview step 1 & 2 sizing calculation.",
      },
      {
        name: "Memory vs Disk vs Network Gap",
        category: "Hardware Latency",
        responsibility: "RAM: 100ns | Datacenter RTT: 0.5ms | SSD: 150us | Cross-Continent RTT: 150ms.",
        whenToUse: "When sizing caches, choosing DB storage engines, or justifying edge CDN POPs.",
      },
    ],
    tradeOffs: [
      {
        approach: "Rough Orders of Magnitude",
        pros: ["Done in < 3 minutes", "Identifies exact tier constraints (RAM vs Disk vs Net)"],
        cons: ["Not exact billing math"],
        bestFor: "Whiteboard HLD interviews and early capacity modeling",
      },
      {
        approach: "Over-Precise Calculators in Interview",
        pros: ["Exact decimal numbers"],
        cons: ["Wastes 10+ minutes of precious HLD/Deep-Dive time"],
        bestFor: "Post-design cloud billing spreadsheets, never live interviews",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Always use the estimation to justify a physical component: '50k peak QPS at 1KB/req is ~400 Mbps egress and exceeds 1 DB connection pool, which proves why we need L7 caching and read replicas.'",
        failurePrevented: "Prevents interviewers from seeing your math as disconnected theater.",
        redFlagToAvoid: "Spending 12 minutes multiplying exact bytes without tying the number to a design decision.",
      },
    ],
    quizzes: [
      {
        id: "quiz-lat-1",
        scenarioPrompt:
          "If an L1 cache reference (0.5 ns) scaled up to 1 second for human intuition, how long would a cross-continent network round-trip (150 ms) take at that exact same scale?",
        options: [
          { id: "a", label: "About 5 minutes", explanation: "Incorrect — 150 ms is 300,000,000x slower than 0.5 ns!" },
          { id: "b", label: "About 5 days", explanation: "Incorrect — 0.5 ms (datacenter RTT) scales to ~6 days." },
          { id: "c", label: "Nearly 9.5 years (on the order of years)", explanation: "Correct! 150ms / 0.5ns = 300 million seconds (~9.5 years), proving why cross-region sync calls ruin latency budgets!" },
        ],
        correctOptionId: "c",
        xpReward: 50,
      },
    ],
    furtherReading: ["Jeff Dean: Numbers Everyone Should Know", "Back-of-the-Envelope Capacity & QPS Modeling"],
  },
  {
    id: "lesson-dns-cdn-edge",
    trackId: "track-foundations",
    order: 3,
    title: "DNS, Anycast & Global Edge CDNs",
    subtitle: "Eliminating cross-continent speed-of-light latency before packets touch your origin servers.",
    difficulty: "foundation",
    estimatedMinutes: 7,
    xpReward: 45,
    tags: ["cdn", "dns", "anycast", "push-vs-pull"],
    plainEnglishAnalogy:
      "DNS is calling 411 directory assistance to turn `netflix.com` into a street address, and a CDN is stocking bottled water at corner stores in every neighborhood (`Edge POPs`) instead of driving a delivery truck from one central bottling plant 3,000 miles away (`Origin Server`) every time someone gets thirsty.",
    keyTerms: [
      { term: "Anycast Routing", plainMeaning: "Multiple global servers share the same IP address; internet routers automatically send you to the geographically nearest POP." },
      { term: "Edge POP", plainMeaning: "A regional Point-of-Presence cache datacenter sitting near end users to shave 150ms ocean hops down to <15ms." },
      { term: "Cache Invalidation & Versioned Assets", plainMeaning: "Instead of waiting for CDN caches to expire, rename files (`app.v82.js`) so users fetch fresh releases instantly." },
      { term: "TTL (Time-To-Live)", plainMeaning: "Countdown clock telling DNS resolvers and CDNs how many seconds to reuse a cached answer before re-checking." },
    ],
    summary:
      "CDNs terminate TLS and cache static/edge assets across hundreds of global Points of Presence (PoPs), dropping cross-ocean 150ms latency to <15ms.",
    whyItMatters:
      "Without a CDN, every JS bundle, product photo, and HLS video segment consumes expensive origin egress bandwidth and crosses continents.",
    coreEntities: [
      {
        name: "GeoDNS / Anycast Routing",
        category: "Network Routing",
        responsibility: "Directs client DNS/BGP packets to the topologically closest Edge PoP.",
        whenToUse: "Multi-region SaaS, media delivery, and global latency SLA < 50ms.",
      },
      {
        name: "Pull vs Push CDN",
        category: "Edge Caching",
        responsibility: "Pull fetches on first user cache-miss and obeys Cache-Control TTL; Push proactively uploads hot artifacts.",
        whenToUse: "Pull for 95% of web assets; Push for huge predictable blobs (OS updates, Netflix top-10 movies).",
      },
    ],
    tradeOffs: [
      {
        approach: "Pull CDN",
        pros: ["Zero manual invalidation plumbing", "Only stores actively requested content"],
        cons: ["First request in each region suffers origin cache-miss latency"],
        bestFor: "Images, avatars, JS/CSS bundles, dynamic public pages",
      },
      {
        approach: "Push CDN",
        pros: ["Zero cold-start cache misses at edge"],
        cons: ["Higher edge storage bill; stale content risks if push pipeline fails"],
        bestFor: "High-traffic immutable video/game patches with few files",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Use content-hashed asset filenames (app.a8f3e.js) with Cache-Control: immutable, max-age=31536000 instead of expensive global CDN purge calls.",
        failurePrevented: "Eliminates stale CSS/JS caches during rolling deployments.",
        redFlagToAvoid: "Assuming a CDN caches authenticated user-specific POST responses safely.",
      },
    ],
    quizzes: [
      {
        id: "quiz-cdn-1",
        scenarioPrompt:
          "You launch a breaking frontend update. Users keep seeing yesterday's broken UI even after deploying. Why did setting CDN TTL to 24h without cache-busting fail?",
        options: [
          { id: "a", label: "Edge PoPs still serve the old /bundle.js until TTL expires unless the URL hash changes", explanation: "Correct! Versioning URLs (bundle.v2.js) lets you keep 1-year TTLs with instant updates." },
          { id: "b", label: "Anycast BGP dropped TCP SYN packets", explanation: "BGP routes IP packets; stale JS versions are purely HTTP caching semantics." },
        ],
        correctOptionId: "a",
        xpReward: 40,
      },
    ],
    furtherReading: ["RFC 1034/1035: Domain Name System Architecture", "Anycast Routing & Edge Cache Control (RFC 9111)"],
  },
  {
    id: "lesson-load-balancing",
    trackId: "track-foundations",
    order: 4,
    title: "Load Balancing (L4 vs L7) & Reverse Proxies",
    subtitle: "Distributing traffic evenly, terminating TLS, and surviving node crashes transparently.",
    difficulty: "foundation",
    estimatedMinutes: 8,
    xpReward: 45,
    tags: ["load-balancer", "nginx", "envoy", "l4", "l7"],
    componentTypes: ["load_balancer", "api_gateway"],
    plainEnglishAnalogy:
      "A Load Balancer is the airport security dispatcher pointing travelers toward the shortest open screening lane — and immediately closing any lane whose X-ray belt breaks (`Health Checks`). At Layer 4 it routes purely by envelope address (super fast); at Layer 7 it opens the HTTP envelope to route `/video` uploads differently from `/api` calls.",
    keyTerms: [
      { term: "L4 vs L7 Load Balancing", plainMeaning: "L4 balances raw TCP/UDP packets blindly (ultra fast); L7 reads HTTP paths, cookies, and auth headers." },
      { term: "Least Connections", plainMeaning: "Instead of blind round-robin, route new requests to the worker with the fewest active requests right now." },
      { term: "Active Health Check & Grace Drain", plainMeaning: "Wait for live requests to finish (`SIGTERM` drain) before shutting down a pod so zero users see 502 errors." },
      { term: "Sticky Sessions Hazard", plainMeaning: "Pinning a user strictly to Server A creates hot spots when that host gets overloaded or restarts." },
    ],
    summary:
      "L4 Load Balancers forward raw TCP/UDP packets rapidly using 5-tuple hashing; L7 Load Balancers inspect HTTP headers, cookies, and routes.",
    whyItMatters:
      "Load balancers double as health-check sentinels: if an API pod hangs or OOM-crashes, L7 active health checks drain it out of rotation within seconds.",
    coreEntities: [
      {
        name: "L4 Transport Load Balancer (NLB)",
        category: "Layer 4",
        responsibility: "Operates on IP + Port packets with ultra-high throughput (millions of PPS) and minimal latency.",
        whenToUse: "Extreme packet throughput, long-lived WebSocket termination, or non-HTTP TCP/UDP brokers.",
      },
      {
        name: "L7 Application Load Balancer (ALB/Envoy)",
        category: "Layer 7",
        responsibility: "Parses HTTP paths (/api/orders), headers, JWTs, TLS termination, and performs smart canary routing.",
        whenToUse: "Microservice routing, path-based microservice fan-out, rate limiting, and WAF inspection.",
      },
    ],
    tradeOffs: [
      {
        approach: "Round Robin",
        pros: ["Simple and evenly spaced for uniform requests"],
        cons: ["Starves servers when some requests take 5ms and others take 2000ms"],
        bestFor: "Identical static/CRUD endpoints",
      },
      {
        approach: "Least Connections / Power-of-Two-Choices",
        pros: ["Redirects new requests away from slow or overloaded workers automatically"],
        cons: ["Requires tracking active in-flight connection counts"],
        bestFor: "Heterogeneous compute workloads (streaming, LLM inference, DB proxies)",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Pair active-passive or active-active L7 gateways across Multiple AZs so the Load Balancer itself is never a Single Point of Failure.",
        failurePrevented: "Eliminates gateway SPOF during zone-level outages.",
        redFlagToAvoid: "Drawing a single load balancer icon on a whiteboard without mentioning Active-Passive / Multi-AZ redundancy.",
      },
    ],
    quizzes: [
      {
        id: "quiz-lb-1",
        scenarioPrompt:
          "Your chat server maintains 2M persistent WebSocket connections and each server varies widely in CPU usage per user. Which routing algorithm avoids pinning new users to already-overloaded chat boxes?",
        options: [
          { id: "a", label: "Static Round Robin", explanation: "Round Robin ignores long-lived connection counts; hot servers keep receiving heavy clients." },
          { id: "b", label: "Least Connections", explanation: "Correct! Least Connections routes new sockets to the node holding the fewest active open streams." },
        ],
        correctOptionId: "b",
        xpReward: 40,
      },
    ],
    furtherReading: ["TCP/UDP L4 Transport Load Balancing", "HTTP/gRPC L7 Reverse Proxy Routing & Health Checks"],
  },
  {
    id: "lesson-network-protocols",
    trackId: "track-foundations",
    order: 5,
    title: "Network Protocols: HTTP, gRPC, WebSockets & SSE",
    subtitle: "Selecting the exact wire transport for request-response, low-latency RPC, and real-time streams.",
    difficulty: "foundation",
    estimatedMinutes: 8,
    xpReward: 45,
    tags: ["grpc", "websockets", "sse", "http2", "protocols"],
    plainEnglishAnalogy:
      "Network protocols are delivery styles: TCP is tracked certified mail (zero missing letters, slight delay); UDP is throwing postcards over a fence (ultra fast for gaming/video, occasional lost cards tolerated); WebSockets is keeping a continuous two-way phone call open; and SSE is a one-way radio broadcast perfect for streaming ChatGPT tokens.",
    keyTerms: [
      { term: "gRPC + Protobuf", plainMeaning: "Compact binary microservice protocol over HTTP/2 — 5-10x faster and smaller than readable JSON text internally." },
      { term: "Server-Sent Events (SSE)", plainMeaning: "Simple HTTP stream pushing server updates one-way (ideal for AI token streams & stock tickers) over plain TLS." },
      { term: "WebSockets", plainMeaning: "Full two-way open socket between browser and server for chat, multiplayer cursors, and live bidding." },
      { term: "HOL (Head-of-Line) Blocking", plainMeaning: "When one lost packet stalls an entire TCP lane behind it until retransmitted; HTTP/3 (QUIC) eliminates this." },
    ],
    summary:
      "Protocol choice shapes serialization overhead, connection memory cost, firewall traversal, and browser compatibility.",
    whyItMatters:
      "Using WebSockets for unidirectional AI token streaming wastes sticky connection complexity when HTTP/2 Server-Sent Events (SSE) works natively over standard proxies.",
    coreEntities: [
      {
        name: "gRPC (HTTP/2 + Protobuf)",
        category: "Internal RPC",
        responsibility: "Binary framing, multiplexed streams, strict .proto schemas, ~5x smaller payloads than JSON.",
        whenToUse: "Internal microservice-to-microservice calls with strict latency & schema contracts.",
      },
      {
        name: "WebSockets vs SSE",
        category: "Real-Time Push",
        responsibility: "WebSockets: bidirectional full-duplex TCP upgrade. SSE: server-to-client push over plain HTTP.",
        whenToUse: "WebSockets for Chat/Multiplayer Canvas/Uber telemetry; SSE for Stock Tickers, Feeds & LLM streaming.",
      },
    ],
    tradeOffs: [
      {
        approach: "REST / JSON over HTTP",
        pros: ["Human-readable, browser-native, CDN-cacheable GETs"],
        cons: ["Verbose JSON parsing overhead at extreme internal QPS"],
        bestFor: "Public external APIs and client-facing gateways",
      },
      {
        approach: "gRPC / Protobuf",
        pros: ["Strongly typed codegen, HTTP/2 multiplexing, low serialization CPU"],
        cons: ["Not directly inspectable in raw curl; browsers require gRPC-Web proxy"],
        bestFor: "Service-to-service mesh traffic",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Use Server-Sent Events (SSE) for AI streaming or live notifications instead of WebSockets unless clients actually need frequent bidirectional binary frames.",
        failurePrevented: "Avoids complex stateful WebSocket reconnection & sticky L4 proxy headaches.",
        redFlagToAvoid: "Using heavy short-polling every 500ms for a real-time chat system.",
      },
    ],
    quizzes: [
      {
        id: "quiz-proto-1",
        scenarioPrompt:
          "You are building a real-time collaborative whiteboarding tool (like Figma) where 50 clients broadcast cursor coordinates and shape diffs continuously in both directions at 30fps. Which protocol fits best?",
        options: [
          { id: "a", label: "WebSockets (Full-Duplex Binary Frames)", explanation: "Correct! High-frequency bidirectional frames demand persistent full-duplex WebSockets." },
          { id: "b", label: "HTTP Short Polling every 1s", explanation: "Too high overhead in HTTP headers and 1s lag destroys collaborative UX." },
        ],
        correctOptionId: "a",
        xpReward: 40,
      },
    ],
    furtherReading: ["HTTP/2 Multiplexing & gRPC Protocol Buffers", "WebSockets (RFC 6455) & Server-Sent Events"],
  },
];

