import { SystemDesignLesson } from "../types.js";

export const LESSONS_ENTITIES: SystemDesignLesson[] = [
  {
    id: "lesson-rate-limiter-entity",
    trackId: "track-entities",
    order: 1,
    title: "Distributed Rate Limiter (Token Bucket vs Sliding Window)",
    subtitle: "Protecting API gateways from noisy neighbors, credential stuffing, and cascading overload.",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    xpReward: 70,
    componentTypes: ["api_gateway", "load_balancer"],
    tags: ["rate-limiter", "token-bucket", "redis", "lua", "api-gateway", "429"],
    plainEnglishAnalogy:
      "Imagine an arcade bouncer guarding an entrance with a jar that refills at 5 gold tokens per second (Token Bucket). Every request spends 1 token: loyal users can spend saved tokens during a quick legitimate burst, while bots that empty the jar get politely turned away at the door with a \"Wait 3 seconds\" ticket (`HTTP 429`).",
    keyTerms: [
      { term: "Token Bucket", plainMeaning: "A bucket holding max tokens `B` refilled at steady rate `R`, letting small bursts pass smoothly without exceeding average limits." },
      { term: "2x Boundary Burst Bug", plainMeaning: "A fixed-window loophole where 10 requests at 12:00:59 plus 10 at 12:01:00 sneak 20 requests through in 2 seconds." },
      { term: "Redis Lua (`EVALSHA`)", plainMeaning: "Bundling read-check-decrement into one atomic Redis server step so concurrent API nodes can't race." },
      { term: "HTTP 429 + Retry-After", plainMeaning: "Standard response telling callers to slow down and exactly how many seconds until tokens refill." },
    ],
    summary:
      "A distributed rate limiter throttles requests across a fleet of stateless API gateways using atomic Redis counters/buckets so abusive callers receive HTTP 429 before saturating downstream services.",
    whyItMatters:
      "Without a shared ingress rate limiter, a single runaway tenant script or DDoS burst exhausts thread pools and database connections across your entire cluster in seconds.",
    interactiveSim: "rate-limiter",
    evolutionStages: [
      {
        stageNumber: 1,
        title: "Single-Gateway In-Memory Counter",
        scaleLabel: "1 Gateway Node",
        nodes: [
          { id: "c", label: "Clients", kind: "client", tier: 0 },
          { id: "gw", label: "API Gateway + Local Map", kind: "lb", tier: 1, highlight: true },
          { id: "svc", label: "Core API", kind: "service", tier: 2 },
        ],
        edges: [
          { from: "c", to: "gw", label: "HTTP" },
          { from: "gw", to: "svc", label: "Allowed" },
        ],
        problemSolved: "Zero network hop overhead; nanosecond local memory check.",
        remainingBottleneck: "Breaks completely once horizontally scaled — N gateways multiply the allowed quota by N.",
      },
      {
        stageNumber: 2,
        title: "Centralized Redis + Atomic Lua Token Bucket",
        scaleLabel: "Multi-Gateway Fleet",
        nodes: [
          { id: "c", label: "Clients", kind: "client", tier: 0 },
          { id: "gw1", label: "Gateway #1", kind: "lb", tier: 1 },
          { id: "gw2", label: "Gateway #2", kind: "lb", tier: 1 },
          { id: "redis", label: "Redis Cluster (Lua Scripts)", kind: "cache", tier: 2, highlight: true },
          { id: "svc", label: "Core API", kind: "service", tier: 3 },
        ],
        edges: [
          { from: "c", to: "gw1", label: "Req" },
          { from: "c", to: "gw2", label: "Req" },
          { from: "gw1", to: "redis", label: "EVALSHA" },
          { from: "gw2", to: "redis", label: "EVALSHA" },
          { from: "gw1", to: "svc", label: "Pass" },
        ],
        problemSolved: "Global quota enforced across all gateways without check-then-set race conditions.",
        remainingBottleneck: "Extra ~0.5ms-1.5ms Redis RTT on every API call unless batched or failed-open safely.",
      },
      {
        stageNumber: 3,
        title: "Sticky Local Cache + Async Redis Sync",
        scaleLabel: "500K+ RPS Edge",
        nodes: [
          { id: "edge", label: "Edge POPs", kind: "edge", tier: 0 },
          { id: "gw", label: "Gateway (Local Batch Quota)", kind: "lb", tier: 1, highlight: true },
          { id: "redis", label: "Regional Redis Shard", kind: "cache", tier: 2 },
          { id: "svc", label: "Downstream Fleet", kind: "service", tier: 3 },
        ],
        edges: [
          { from: "edge", to: "gw", label: "Anycast" },
          { from: "gw", to: "redis", label: "Flush Every 100ms", style: "async" },
          { from: "gw", to: "svc", label: "HTTP/2" },
        ],
        problemSolved: "Amortizes Redis round-trips by checking out micro-leases of tokens locally at extreme RPS.",
        remainingBottleneck: "Small overshoot tolerance during cross-POP bursts before async sync converges.",
      },
    ],
    coreEntities: [
      {
        name: "Redis Lua EVALSHA Script",
        category: "Atomic State Store",
        responsibility: "Reads token count, computes refill elapsed time, and decrements atomically in a single Redis thread.",
        whenToUse: "Whenever two API gateways might check the same user key concurrently (prevents read-modify-write races).",
      },
      {
        name: "HTTP 429 & RateLimit Headers",
        category: "Protocol Contract",
        responsibility: "Returns `X-RateLimit-Remaining`, `X-RateLimit-Limit`, and `Retry-After` so well-behaved SDKs back off cleanly.",
        whenToUse: "Every public or internal throttled endpoint.",
      },
    ],
    tradeOffs: [
      {
        approach: "Token Bucket",
        pros: ["Memory-tiny (2 numbers per key: tokens + lastRefill)", "Naturally allows bounded controlled bursts"],
        cons: ["Requires careful tuning of burst capacity vs steady refill rate"],
        bestFor: "General public API gateways (Stripe, AWS API Gateway, GitHub).",
      },
      {
        approach: "Fixed Window Counter",
        pros: ["Single `INCR` + `EXPIRE` command", "Lowest CPU and memory overhead"],
        cons: ["Double-burst vulnerability at window boundaries (2x traffic in 2 seconds spanning :59 to :01)"],
        bestFor: "Coarse billing quotas where brief boundary spikes are harmless.",
      },
      {
        approach: "Sliding Window Counter",
        pros: ["Eliminates boundary double-burst using weighted previous+current windows", "Constant O(1) memory per key"],
        cons: ["Approximates smoothed prior window assuming uniform distribution"],
        bestFor: "Strict per-tenant SLA enforcement with minimal RAM.",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Compare Fail-Open vs Fail-Closed when Redis becomes unreachable: Fail-Open for checkout/auth UX, Fail-Closed for strict billing/abuse WAF.",
        failurePrevented: "Turns a localized Redis restart into a complete 100% platform outage.",
        redFlagToAvoid: "Doing separate Redis GET followed by SET/DECR in application code without Lua or sorted sets — causes silent race conditions.",
      },
      {
        hook: "Never shard rate limiter rules purely by Client IP behind corporate NATs/carrier CGNAT — combine User ID / API Key / Tenant ID.",
        failurePrevented: "Accidentally banning an entire university campus or mobile carrier tower.",
        redFlagToAvoid: "Ignoring hot-key saturation on global unauthenticated routes in Redis.",
      },
    ],
    quizzes: [
      {
        id: "quiz-rl-1",
        scenarioPrompt:
          "Your Fixed Window limiter allows 100 req/min. An attacker sends 100 requests at 12:00:59 and 100 more at 12:01:01. What happened?",
        options: [
          {
            id: "a",
            label: "The limiter rejected the second wave automatically.",
            explanation: "Incorrect — the window rolled over cleanly at 12:01:00, resetting the counter to 0.",
          },
          {
            id: "b",
            label: "200 requests slipped through in a 2-second window (Boundary Burst Bug).",
            explanation: "Correct! Fixed windows suffer from 2x quota bursts straddling minute boundaries.",
          },
          {
            id: "c",
            label: "Token Bucket would also permit 2x sustained rate indefinitely.",
            explanation: "Token Bucket caps burst size separately via bucket capacity and prevents continuous 2x boundary resets.",
          },
        ],
        correctOptionId: "b",
        xpReward: 25,
      },
      {
        id: "quiz-rl-2",
        scenarioPrompt:
          "Why does a distributed rate limiter execute its Token Bucket refill+consume logic inside a Redis Lua script?",
        options: [
          {
            id: "a",
            label: "Because Redis Lua scripts execute atomically single-threaded without GET/SET race conditions.",
            explanation: "Correct! Multiple API gateways race-free decrement the shared bucket in one network RTT.",
          },
          {
            id: "b",
            label: "Because Redis cannot store integers without Lua.",
            explanation: "Redis handles integers natively via INCR, but multi-step conditional logic needs Lua atomicity.",
          },
          {
            id: "c",
            label: "To encrypt HTTP payloads inside the gateway.",
            explanation: "Lua runs on Redis for atomic state transitions, not TLS termination.",
          },
        ],
        correctOptionId: "a",
        xpReward: 25,
      },
    ],
    furtherReading: [
      "Token Bucket, Leaky Bucket & Sliding Window Counter Algorithms",
      "Atomic Redis Lua Script Quota Enforcement",
    ],
  },
  {
    id: "lesson-object-storage-s3",
    trackId: "track-entities",
    order: 2,
    title: "Scalable Blob & Object Storage (S3 Internals)",
    subtitle: "Separating metadata namespaces from append-only immutable data chunks, multipart uploads, and erasure coding.",
    difficulty: "principal",
    estimatedMinutes: 9,
    xpReward: 75,
    componentTypes: ["object_storage"],
    tags: ["object-storage", "s3", "blob", "erasure-coding", "presigned-url", "multipart"],
    plainEnglishAnalogy:
      "Think of checking heavy luggage at an airport: instead of squeezing a 5GB suitcase through the ticketing clerk (`API Server` RAM), the clerk hands you a signed boarding tag (`Presigned URL`) so you drop the suitcase directly onto the baggage belt (`S3 Data Nodes`). Behind the scenes, the luggage gets mathematically sliced into puzzle pieces (`Erasure Coding`) so losing several vaults still lets S3 rebuild every file.",
    keyTerms: [
      { term: "Presigned Upload URL", plainMeaning: "A temporary signed link allowing browsers to upload large files straight to S3 without choking your API servers." },
      { term: "Metadata vs Blob Split", plainMeaning: "Fast indexed DB rows hold small filenames/permissions; cheap chunk servers hold heavy immutable bytes." },
      { term: "Reed-Solomon Erasure Coding", plainMeaning: "Splitting data into `k` data + `m` math-parity shards (`10+4`) giving massive durability at `1.4x` cost instead of `3x` full copies." },
      { term: "Multipart Upload", plainMeaning: "Uploading giant files in `5-10MB` resumable chunks so a Wi-Fi hiccup only retries one tiny chunk." },
    ],
    summary:
      "Object stores (S3, GCS, MinIO) separate mutable metadata lookup from immutable multi-megabyte data blocks stored across data servers protected by Reed-Solomon erasure coding.",
    whyItMatters:
      "Routing gigabyte videos or backups through stateless API servers exhausts gateway bandwidth and memory; pre-signed URLs and chunked object storage scale to exabytes independently.",
    coreEntities: [
      {
        name: "Metadata DB + Virtual Folder Index",
        category: "Control Plane",
        responsibility: "Maps `(bucket, object_key, version_id)` to ordered list of chunk IDs stored on data nodes.",
        whenToUse: "Every GET/PUT/LIST object request; flat namespace emulates folders via prefix indexes.",
      },
      {
        name: "Immutable Data Chunk Store",
        category: "Data Plane",
        responsibility: "Packs millions of small or split large objects into 64MB-256MB append-only data files to eliminate filesystem inode exhaustion.",
        whenToUse: "High-durability binary storage (images, videos, ML weights, Parquet data lakes).",
      },
    ],
    tradeOffs: [
      {
        approach: "3x Full Replication",
        pros: ["Instant byte-for-byte reads with zero decoding CPU", "Low recovery network amplification for hot objects"],
        cons: ["200% storage overhead (3x cost per TB stored)"],
        bestFor: "Small hot objects or low-latency metadata partitions.",
      },
      {
        approach: "Reed-Solomon Erasure Coding (e.g., 10+4)",
        pros: ["Reduces storage overhead from 200% down to ~40% while tolerating 4 simultaneous drive/rack failures"],
        cons: ["Higher CPU compute and cross-rack traffic during rebuild or degraded reads"],
        bestFor: "Exabyte-scale cold/warm blob storage (S3, Azure Storage, Ceph).",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Clients must upload directly to Object Storage via short-lived Pre-Signed URLs + Multipart Uploads — never proxy raw 5GB files through your App API tier.",
        failurePrevented: "Eliminates API gateway thread starvation and cuts internal egress/ingress bandwidth bills in half.",
        redFlagToAvoid: "Putting binary image/video blobs directly inside PostgreSQL `BYTEA` columns beyond tiny thumbnails.",
      },
    ],
    quizzes: [
      {
        id: "quiz-s3-1",
        scenarioPrompt:
          "How should a user upload a 2GB video file in a scalable design like YouTube or Dropbox?",
        options: [
          {
            id: "a",
            label: "Request a Pre-Signed Multipart Upload URL from the API, then upload 10MB chunks directly to Object Storage.",
            explanation: "Correct! Pre-signed URLs keep heavy binary streams off the application server tier and support resumable retries.",
          },
          {
            id: "b",
            label: "Base64 encode the 2GB video inside a JSON POST body to the REST API.",
            explanation: "Base64 inflates size by 33% and crashes app servers with OOM errors.",
          },
          {
            id: "c",
            label: "Store the raw video frames as rows in a relational database table.",
            explanation: "Relational DB buffer pools and WAL logs collapse under multi-gigabyte streaming blobs.",
          },
        ],
        correctOptionId: "a",
        xpReward: 25,
      },
      {
        id: "quiz-s3-2",
        scenarioPrompt:
          "Why does S3 achieve 11 nines (99.999999999%) durability at lower cost than naive 3x file copies?",
        options: [
          {
            id: "a",
            label: "Erasure coding splits chunks across data+parity shards across multiple availability zones.",
            explanation: "Correct! E.g. 8+4 or 10+4 erasure coding gives huge fault tolerance with ~1.4x overhead instead of 3x.",
          },
          {
            id: "b",
            label: "It compresses everything into client-side LocalStorage.",
            explanation: "Client LocalStorage only holds a few megabytes in one browser tab and vanishes if cleared — S3 stores exabytes durably across redundant datacenter racks.",
          },
          {
            id: "c",
            label: "It disables disk checksums for faster writes.",
            explanation: "S3 continuously runs background bit-rot scrubbers verifying checksums across shards.",
          },
        ],
        correctOptionId: "a",
        xpReward: 25,
      },
    ],
    furtherReading: [
      "Pre-Signed Direct Multipart Upload & Metadata Control-Plane Split",
      "USENIX FAST: Haystack — Compact Needle-in-Blob Storage Architecture",
    ],
  },
  {
    id: "lesson-search-autocomplete",
    trackId: "track-entities",
    order: 3,
    title: "Full-Text Search & Prefix Autocomplete (Inverted Index & Trie)",
    subtitle: "Sub-50ms typeahead tries, Elasticsearch inverted indexes, and offline log aggregation pipelines.",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    xpReward: 65,
    componentTypes: ["search_engine"],
    tags: ["search", "elasticsearch", "trie", "inverted-index", "autocomplete", "typeahead"],
    plainEnglishAnalogy:
      "Searching full documents via SQL `LIKE '%redis%'` is like reading an entire 800-page book cover-to-cover for every query. An Inverted Index is the pre-built glossary at the back (`\"redis\" -> pages 12, 84, 901`). Meanwhile, Autocomplete stores a mini Top-5 cheat sheet inside each typed letter (`\"sys\" -> [\"system design\", \"sysadmin\"]`) so suggestions pop up while your finger is still leaving the key!",
    keyTerms: [
      { term: "Inverted Index", plainMeaning: "A reverse dictionary mapping every normalized word directly to the sorted list of document IDs containing it." },
      { term: "Prefix Trie (Top-K Cached)", plainMeaning: "Tree indexed letter-by-letter where popular autocomplete answers are precomputed right at each prefix node." },
      { term: "BM25 Relevance Scoring", plainMeaning: "Ranking matches by how frequently a word appears in that doc vs how rare the word is across all docs." },
      { term: "Query Sampling & Async Rebuild", plainMeaning: "Writing logged keystrokes into memory buffers or Kafka instead of synchronously locking live Trie nodes." },
    ],
    summary:
      "Search engines answer unstructured queries using Inverted Indexes (token -> sorted postings list), while millisecond typeahead uses memory-cached Tries precomputed with Top-K popular completions at each prefix node.",
    whyItMatters:
      "Running `SQL LIKE '%query%'` performs full table scans that lock databases at scale. Specialized inverted indexes and prefix tries handle 100K+ queries/sec under 30ms p99.",
    coreEntities: [
      {
        name: "Inverted Index (BM25 / Lucene)",
        category: "Full-Text Engine",
        responsibility: "Maps normalized stemmed words (`\"distributed\"`) to compressed doc ID lists (`[12, 84, 901]`) with term frequencies.",
        whenToUse: "Document filtering, e-commerce catalogs, log analytics, faceted search.",
      },
      {
        name: "Top-K Prefix Trie + CDN Edge Cache",
        category: "Autocomplete Structure",
        responsibility: "Stores the Top 5-10 weighted query completions directly inside every prefix node (`\"sys\" -> [\"system design\", ...]`) for O(prefix_len) O(1) lookup.",
        whenToUse: "Search bars needing <20ms response on every keystroke.",
      },
    ],
    tradeOffs: [
      {
        approach: "Async CDC -> Kafka -> Search Indexer",
        pros: ["Decouples database write latency from heavy tokenization/merging", "Handles backpressure safely"],
        cons: ["1-3 seconds eventual consistency between SQL commit and search visibility"],
        bestFor: "99% of production search systems (catalogs, feeds, tickets).",
      },
      {
        approach: "Live Trie Mutation on Every Search Query",
        pros: ["Instant trending query reflection"],
        cons: ["Massive write lock contention on root Trie nodes + vulnerability to spam poisoning"],
        bestFor: "Never in raw form — always sample search logs and rebuild Trie snapshots hourly/weekly offline.",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Never update a Typeahead Trie synchronously on user keystrokes — log sampled queries asynchronously and swap immutable pre-built Trie snapshots every 15-60 mins.",
        failurePrevented: "Eliminates write lock contention on hot single-letter prefixes (`\"a\"`, `\"s\"`) during traffic spikes.",
        redFlagToAvoid: "Using Elasticsearch as your single primary source-of-truth database for financial or transactional state.",
      },
    ],
    quizzes: [
      {
        id: "quiz-search-1",
        scenarioPrompt:
          "How do you guarantee O(p) sub-millisecond typeahead lookup without traversing an entire subtree of millions of matching phrases on each keystroke?",
        options: [
          {
            id: "a",
            label: "Cache the pre-sorted Top-K queries directly on each Trie node alongside its prefix.",
            explanation: "Correct! Lookup stops as soon as the prefix path ends and returns the cached Top-K array immediately.",
          },
          {
            id: "b",
            label: "Run a DFS across every child leaf on every keystroke.",
            explanation: "Root prefixes like 's' or 'a' would scan millions of suffixes on every single keypress.",
          },
          {
            id: "c",
            label: "Execute SQL `LIKE 'prefix%'` with no caching.",
            explanation: "Cannot handle keystroke QPS amplification (5-10 queries per search phrase).",
          },
        ],
        correctOptionId: "a",
        xpReward: 25,
      },
    ],
    furtherReading: [
      "Compressed Prefix Tries & Top-K Snapshot Materialization",
      "Inverted Indexes, BM25 Ranking & Immutable Segment Merging",
    ],
  },
  {
    id: "lesson-geospatial-engine",
    trackId: "track-entities",
    order: 4,
    title: "Geospatial Indexing (Geohash, Quadtree & H3 Hexagons)",
    subtitle: "Mapping 2D lat/long earth coordinates to 1D sorted keys for nearby drivers, riders, and POI discovery.",
    difficulty: "principal",
    estimatedMinutes: 10,
    xpReward: 75,
    componentTypes: ["key_value_store"],
    tags: ["geospatial", "geohash", "quadtree", "s2", "h3", "uber", "nearby"],
    plainEnglishAnalogy:
      "Standard databases index numbers on a 1D line, like house numbers on one street — terrible for 2D maps where you want houses within 2 miles (`lat` AND `lon`). Spatial indexes divide a map into named grid squares (`Geohash`, like postal ZIP codes). If you stand near the edge of one ZIP code, the closest cab sits across the street in the neighbor ZIP — so you ALWAYS search your cell PLUS the 8 surrounding cells (`3x3 Grid`)!",
    keyTerms: [
      { term: "Geohash Prefix", plainMeaning: "Encoding `(lat, lon)` into a shared string (`9q8yy`) where longer prefixes mean smaller city blocks." },
      { term: "Edge Boundary Bug", plainMeaning: "Querying only your exact Geohash square misses drivers 10 meters away across the square border." },
      { term: "Uber H3 Hexagons", plainMeaning: "Hexagonal grid cells whose centers are all equidistant from every neighbor (unlike stretched square grids)." },
      { term: "QuadTree Split", plainMeaning: "A dynamic map tree that only chops busy downtown grids into smaller boxes while leaving empty deserts whole." },
    ],
    summary:
      "2D range queries (`BETWEEN lat1..lat2 AND lon1..lon2`) confuse standard 1D B-Trees. Space-filling curves (Geohash, Google S2, Uber H3) or adaptive Quadtrees map 2D coordinates into 1D prefixes or buckets for fast proximity search.",
    whyItMatters:
      "Powering Uber/DoorDash driver matching or Yelp nearby search requires indexing millions of moving entities updating locations every 3-5 seconds.",
    interactiveSim: "geospatial-index",
    coreEntities: [
      {
        name: "Geohash / Hilbert Space-Filling Prefix",
        category: "Static Grid Index",
        responsibility: "Interleaves latitude and longitude bits into base-32 strings (`\"9q8yy\"`); shared prefixes mean spatial closeness.",
        whenToUse: "Redis `GEOADD`, DynamoDB geospatial indexes, prefix range lookups.",
      },
      {
        name: "In-Memory Quadtree",
        category: "Adaptive Density Tree",
        responsibility: "Recursively subdivides rectangles into 4 quadrants only when POI count exceeds capacity (dense downtown = deep leaves, desert = shallow).",
        whenToUse: "Read-heavy static/slowly changing Points of Interest (restaurants, shops).",
      },
    ],
    tradeOffs: [
      {
        approach: "Geohash + Neighbor Cell Query (9 cells)",
        pros: ["Simple prefix queries in Redis/KV stores", "Tiny memory footprint for moving vehicles"],
        cons: ["Edge/boundary problem forces checking 8 adjacent cells", "Squares have unequal diagonal distances from center vs hexagons"],
        bestFor: "High-write-churn driver location tracking (Uber/Lyft every 4 sec).",
      },
      {
        approach: "H3 Hexagonal Hierarchical Index",
        pros: ["Every neighbor hexagon is equidistant from center", "Smooth surge pricing and dispatch heatmaps"],
        cons: ["Hexagons don't subdivide cleanly into exact child hexagons (approximation factor)"],
        bestFor: "Dynamic ride-hailing supply/demand pricing zones and dispatch matching.",
      },
      {
        approach: "Dynamic Quadtree",
        pros: ["Adapts naturally to wildly uneven population densities (Manhattan vs Sahara)"],
        cons: ["Rebalancing tree nodes during millions of moving updates/sec creates lock contention"],
        bestFor: "Read-heavy POI directories (Yelp, Google Places).",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Explain the Geohash Boundary Edge Case: two points 10 meters apart across a prime meridian or grid boundary can have completely different prefixes — ALWAYS query center cell + all 8 neighbors.",
        failurePrevented: "Prevents failing to match a driver literally across the street from a rider.",
        redFlagToAvoid: "Running two independent B-Tree SQL indexes on `(lat)` and `(lng)` thinking it executes fast 2D spatial joins.",
      },
    ],
    quizzes: [
      {
        id: "quiz-geo-1",
        scenarioPrompt:
          "Two drivers are 20 meters apart but on opposite sides of a major Geohash grid line. Their Geohashes share zero prefix characters (`9q8y` vs `9q9p`). How do you avoid missing nearby matches?",
        options: [
          {
            id: "a",
            label: "Compute the target Geohash cell plus its 8 surrounding neighbor cells and union the results.",
            explanation: "Correct! Querying the 3x3 grid (target + 8 neighbors) completely solves grid boundary artifacts.",
          },
          {
            id: "b",
            label: "Increase Geohash string precision from 6 to 12 characters.",
            explanation: "Higher precision zooms in further and does NOT bridge major grid boundaries.",
          },
          {
            id: "c",
            label: "Use a standard modulo hash function on latitude alone.",
            explanation: "Modulo hashing destroys spatial locality altogether.",
          },
        ],
        correctOptionId: "a",
        xpReward: 25,
      },
    ],
    furtherReading: [
      "Geohash 3x3 Boundary Cell Queries & Quadtree Subdivision",
      "Hierarchical Hexagonal Spatial Grid Indexing (H3)",
    ],
  },
  {
    id: "lesson-metrics-timeseries",
    trackId: "track-entities",
    order: 5,
    title: "Metrics, Distributed Tracing & Time-Series Storage",
    subtitle: "High-cardinality ingestion, Gorilla delta compression, OpenTelemetry spans, and downsampling rollups.",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    xpReward: 65,
    componentTypes: ["observability"],
    tags: ["metrics", "timeseries", "tsdb", "opentelemetry", "tracing", "prometheus"],
    plainEnglishAnalogy:
      "Recording 1,000 server heartbeats every second in PostgreSQL thrashes indexes (`Random Writes`). A Time-Series DB (`Prometheus / InfluxDB`) writes cleanly like a patient EKG strip: since consecutive CPU checks (`42%, 42%, 43%`) barely change each second, it compresses timestamps + values down to `1.37 bytes` each (`Delta-of-Delta`) and rolls old 1-second blips into compact 1-hour averages overnight.",
    keyTerms: [
      { term: "TSDB (Time-Series DB)", plainMeaning: "Database optimized specifically for append-only `(timestamp, value)` streams sliced into time-bucket chunks." },
      { term: "High-Cardinality Explosion", plainMeaning: "Putting unbounded IDs like `user_id` or raw `request_url` inside metric tags spawns millions of broken series in RAM." },
      { term: "Gorilla Delta-of-Delta", plainMeaning: "Storing only the tiny *change in interval* (`+0s`) and *XOR diff in float values* — slashing storage ~10x." },
      { term: "Rollup Downsampling", plainMeaning: "Automatically squashing fine 1-sec raw points from last month into coarse 5-min/1-hr averages to save disk." },
    ],
    summary:
      "Monitoring systems collect time-ordered `(metric_name, tags, timestamp, value)` series using append-only TSDBs, time-bucketed partitions, Gorilla delta-of-delta compression, and automated downsampling.",
    whyItMatters:
      "You cannot debug a tail-latency p99 regression in a 20-microservice mesh without correlation Trace IDs and pre-aggregated metrics that survive high write bursts without halting application traffic.",
    coreEntities: [
      {
        name: "Time-Series DB (Prometheus / Influx / VictoriaMetrics)",
        category: "Append-Optimized Store",
        responsibility: "Partitions data by time chunks (2hr blocks), compresses monotonic timestamps with delta-of-delta encoding, and auto-expires old raw points via TTL.",
        whenToUse: "Infrastructure CPU, queue lag, RPS, and latency histograms.",
      },
      {
        name: "OpenTelemetry Collector & Trace Sampler",
        category: "Distributed Context",
        responsibility: "Propagates W3C `traceparent` headers across HTTP/Kafka hops and applies head/tail-based sampling so 100% of errors are kept without storing 100% of healthy traces.",
        whenToUse: "Debugging multi-hop fanout slowdowns across microservices.",
      },
    ],
    tradeOffs: [
      {
        approach: "Pull Model (Prometheus Scrape)",
        pros: ["Built-in liveness check (failed scrape = target down)", "Scraper controls ingestion rate cleanly"],
        cons: ["Requires service discovery for ephemeral targets; tricky across strict VPC firewalls or serverless jobs"],
        bestFor: "Kubernetes pods and long-lived internal microservices.",
      },
      {
        approach: "Push Model (StatsD / OTel Agent -> Kafka -> TSDB)",
        pros: ["Works effortlessly for short-lived lambdas/CLI jobs and firewalled edges"],
        cons: ["Risk of metrics floods DDoSing the metrics pipeline without client sampling"],
        bestFor: "Serverless workers, mobile telemetry, multi-region edge ingestion.",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Guard against Unbounded Tag Cardinality Explosion (never put `user_id` or `request_uuid` into Prometheus metric labels) — put high-cardinality IDs in structured logs/traces instead.",
        failurePrevented: "Prevents millions of unique inverted-index series from OOM-crashing your monitoring stack during an incident.",
        redFlagToAvoid: "Averaging latency percentiles (`avg(p99)`) across pods — quantiles are mathematically non-additive; always merge histograms (HDR/t-digest).",
      },
    ],
    quizzes: [
      {
        id: "quiz-tsdb-1",
        scenarioPrompt:
          "An engineer adds `request_id` as a tag label on a Prometheus HTTP latency metric serving 50M requests/day. What breaks first?",
        options: [
          {
            id: "a",
            label: "Cardinality explosion creates 50M unique time-series, exhausting RAM on the TSDB label index.",
            explanation: "Correct! TSDBs assume bounded low-cardinality labels (`status`, `route`, `region`), never per-request UUIDs.",
          },
          {
            id: "b",
            label: "HTTP TCP handshakes slow down by 10 seconds.",
            explanation: "Client HTTP traffic only breaks indirectly if metrics agents crash.",
          },
          {
            id: "c",
            label: "Timestamps lose UTC alignment.",
            explanation: "Timestamps remain fine; index memory explodes.",
          },
        ],
        correctOptionId: "a",
        xpReward: 25,
      },
    ],
    furtherReading: [
      "Time-Series Rollup Downsampling & Alert Evaluation Pipelines",
      "Pelkonen et al.: Gorilla — In-Memory Time-Series Compression (VLDB)",
    ],
  },
  {
    id: "lesson-vector-rag",
    trackId: "track-entities",
    order: 6,
    title: "AI Infrastructure, Vector Search (HNSW) & Semantic Caching",
    subtitle: "Designing LLM RAG pipelines, approximate nearest neighbors (ANN), embedding chunking, and cost guards.",
    difficulty: "principal",
    estimatedMinutes: 9,
    xpReward: 75,
    componentTypes: ["external_provider"],
    tags: ["vector", "hnsw", "rag", "llm", "embeddings", "semantic-cache"],
    plainEnglishAnalogy:
      "Keyword search (`BM25`) matches literal spelling — searching \"cheap notebook computer\" completely misses a doc titled \"budget ultrabook\". Embeddings translate sentences into coordinates on a 3D meaning map (`Vectors`) so similar concepts sit right next to each other! An HNSW graph acts like an express highway network jumping straight to the right neighborhood, and Hybrid Search + RRF merges both keyword exactness AND meaning.",
    keyTerms: [
      { term: "Dense Embedding Vector", plainMeaning: "Converting text meanings into arrays of floating numbers (e.g., `1536` dimensions) so closeness measures similarity." },
      { term: "HNSW Vector Index", plainMeaning: "Multi-layer expressway graph navigating millions of vectors to approximate nearest neighbors in `<15 ms`." },
      { term: "Hybrid Search + RRF", plainMeaning: "Blending exact keyword (`BM25`) + semantic vector rankings via Reciprocal Rank Fusion so neither exact SKUs nor meaning fail." },
      { term: "Pre-Filter vs Post-Filter ACL", plainMeaning: "Checking user access permissions *inside* vector search rather than filtering after fetching Top-5 (which causes empty answers!)." },
    ],
    summary:
      "Modern AI systems augment LLMs with Retrieval-Augmented Generation (RAG): ingesting documents into chunked dense embeddings indexed via HNSW/IVF graphs, guarded by semantic caches and token rate limiters.",
    whyItMatters:
      "Naive exact k-NN vector scan is O(N*D) and takes seconds at 100M vectors, while uncached LLM gateway fanouts spike latency to 5+ seconds and burn massive GPU/API budgets.",
    coreEntities: [
      {
        name: "HNSW Vector Index (pgvector / Qdrant / Pinecone)",
        category: "Approximate Nearest Neighbor",
        responsibility: "Builds hierarchical navigable small-world proximity graphs so cosine similarity search runs in ~5-15ms at 97%+ recall.",
        whenToUse: "Semantic search, RAG grounding, recommendation similarity.",
      },
      {
        name: "Semantic Response Cache",
        category: "AI Cost/Latency Guard",
        responsibility: "Embeds incoming prompts and returns cached LLM completions when cosine similarity exceeds ~0.95 for recurring questions.",
        whenToUse: "FAQ bots, support copilots, repeated code explanations.",
      },
    ],
    tradeOffs: [
      {
        approach: "IVF-Flat / DiskANN (Disk-backed)",
        pros: ["10x lower RAM cost for billions of embeddings"],
        cons: ["Slightly higher p99 disk I/O latency (20-50ms) and lower recall without reranking"],
        bestFor: "Massive multi-billion corpus archives with strict RAM budgets.",
      },
      {
        approach: "In-Memory HNSW + Cross-Encoder Rerank",
        pros: ["Sub-15ms candidate retrieval + high top-5 precision via hybrid BM25 + dense scoring"],
        cons: ["High memory footprint (~6GB+ per 1M 1536-dim float32 vectors unless quantized to int8/PQ)"],
        bestFor: "Interactive enterprise RAG copilots needing high accuracy.",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Pair dense vector retrieval (semantic meaning) with sparse BM25 keyword search (exact SKUs/error codes) fused via Reciprocal Rank Fusion (RRF), plus document-level ACL metadata filtering BEFORE top-K.",
        failurePrevented: "Prevents confidential data leaks across tenants and fixes exact-keyword misses (like `ERR_CONNECTION_RESET`).",
        redFlagToAvoid: "Applying permission ACL filters AFTER taking `top-5` vectors — yields 0 visible results or leaks private snippets.",
      },
    ],
    quizzes: [
      {
        id: "quiz-rag-1",
        scenarioPrompt:
          "In a multi-tenant enterprise RAG search, if you fetch Top-5 similar chunks first and THEN filter out chunks the user isn't permitted to read, what bug occurs?",
        options: [
          {
            id: "a",
            label: "The user receives fewer than 5 (or 0) results even when authorized documents exist at rank #6.",
            explanation: "Correct! Pre-filtering (metadata bitmask inside index traversal) or over-fetching ensures tenant isolation without empty answers.",
          },
          {
            id: "b",
            label: "Cosine similarity becomes Euclidean.",
            explanation: "Distance metrics don't change; result recall collapses.",
          },
          {
            id: "c",
            label: "HNSW graph deletes the documents permanently.",
            explanation: "Nothing gets deleted! Post-filtering simply throws away restricted items *after* you already took only 5 slots, leaving fewer or zero answers on screen.",
          },
        ],
        correctOptionId: "a",
        xpReward: 25,
      },
    ],
    furtherReading: [
      "Malkov & Yashunin: Efficient and Robust Approximate Nearest Neighbor Search Using HNSW Graphs",
      "Hybrid BM25 Lexical + HNSW Vector RRF Fusion & Pre-Filter ACLs",
    ],
  },
];

