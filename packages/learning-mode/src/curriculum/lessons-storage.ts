import { SystemDesignLesson } from "../types.js";

export const LESSONS_STORAGE: SystemDesignLesson[] = [
  {
    id: "lesson-sql-nosql-indexing",
    trackId: "track-storage",
    order: 1,
    title: "SQL vs NoSQL & Indexing Decision Matrix",
    subtitle: "When ACID joins win vs when Wide-Column, Document, or Key-Value partitions scale linearly.",
    difficulty: "foundation",
    estimatedMinutes: 9,
    xpReward: 50,
    tags: ["postgresql", "dynamodb", "cassandra", "sql", "nosql", "indexing"],
    componentTypes: ["relational_database", "document_database", "key_value_store"],
    plainEnglishAnalogy:
      "A SQL database is like a strict bank ledger with pre-printed rows and cross-checks (great for correctness, harder to stretch across 50 buildings). NoSQL is like labeled accordion folders organized by how you look them up — blazingly fast for known lookups, painful for surprise questions. And an Index is simply the alphabetical appendix at the back of a textbook so you jump to page 247 instead of reading every page.",
    keyTerms: [
      { term: "ACID Transaction", plainMeaning: "All-or-nothing guarantee: either every table change succeeds cleanly together, or none do." },
      { term: "N+1 Query Bug", plainMeaning: "Fetching 100 items in 1 query, then accidentally running 100 separate SQL queries inside a loop for their authors." },
      { term: "Covering Index", plainMeaning: "An index that already includes the extra column you asked for (`SELECT email`), skipping the main table lookup completely." },
      { term: "Access-Pattern Modeling", plainMeaning: "Designing your NoSQL table shape upfront around the exact queries your UI will run." },
    ],
    summary:
      "Choosing NoSQL blindly loses ACID guarantees; choosing a single SQL primary blindly fails at 100k+ writes/sec.",
    whyItMatters:
      "Most applications fit happily on PostgreSQL (with proper B-Tree/GIN indexes) well past 10M users. You migrate specific high-velocity entities (telemetry, timelines, shopping carts) to NoSQL only when access patterns demand partition scalability.",
    coreEntities: [
      {
        name: "Relational (PostgreSQL / MySQL)",
        category: "ACID Storage",
        responsibility: "Strict schemas, foreign keys, ad-hoc joins, serializable transactions.",
        whenToUse: "Fintech ledgers, user accounts, inventory, orders — anywhere data integrity is sacred.",
      },
      {
        name: "Wide-Column (Cassandra / ScyllaDB) & KV (DynamoDB)",
        category: "Partitioned Storage",
        responsibility: "Linear horizontal write scaling partitioned by shard key; tunable consistency.",
        whenToUse: "IoT sensor logs, user activity feeds, messaging history (>50k writes/sec).",
      },
    ],
    tradeOffs: [
      {
        approach: "Relational SQL",
        pros: ["ACID transactions", "Rich ad-hoc SQL & indexes", "Zero data duplication"],
        cons: ["Cross-shard joins & distributed 2PC are painfully slow"],
        bestFor: "Structured domain relationships and financial consistency",
      },
      {
        approach: "DynamoDB / Cassandra NoSQL",
        pros: ["Predictable single-digit ms latency at petabyte scale", "Built-in horizontal sharding"],
        cons: ["Must model schema strictly around known query access patterns; weak joins"],
        bestFor: "Key-lookup, time-series append logs, and high write ingestion",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Default to PostgreSQL unless there is a quantified access-pattern bottleneck (extreme write ingestion, graph traversals, or massive unstructured blob lookups).",
        failurePrevented: "Prevents premature polyglot persistence chaos (`JustEnough Architecture`).",
        redFlagToAvoid: "Saying 'We need MongoDB because it scales better' without analyzing write throughput or schema joins.",
      },
    ],
    quizzes: [
      {
        id: "quiz-sql-1",
        scenarioPrompt:
          "You are designing a Double-Entry Banking Ledger processing 1,500 transfers/sec. Account debits and credits must strictly balance with zero lost updates. Which datastore belongs at the core?",
        options: [
          { id: "a", label: "Eventually Consistent Cassandra cluster", explanation: "Eventual consistency without strict serializability risks race conditions and balance anomalies." },
          { id: "b", label: "ACID Relational Database (PostgreSQL) with serializable/row locks", explanation: "Correct! Atomic multi-row debit+credit transactions make relational ACID essential for ledgers." },
        ],
        correctOptionId: "b",
        xpReward: 50,
      },
    ],
    furtherReading: ["Relational ACID Normalization vs Wide-Column Partitioning", "SQL & Document Query Access Patterns"],
  },
  {
    id: "lesson-btree-lsm",
    trackId: "track-storage",
    order: 2,
    title: "Storage Engine Internals: B-Trees vs LSM-Trees",
    subtitle: "Why Postgres excels at point/range reads while RocksDB/Cassandra dominate massive write ingestion.",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    xpReward: 60,
    tags: ["btree", "lsm-tree", "wal", "sstables", "bloom-filter", "storage-engines"],
    plainEnglishAnalogy:
      "A B-Tree (PostgreSQL) is like maintaining a neatly alphabetized paper dictionary: looking up any word is super predictable, but inserting a brand-new word in the middle forces shifting half a page around. An LSM-Tree (Cassandra/RocksDB) is like scribbling notes rapidly on blank pages in a pocket notebook (fast sequential writes!), and tidying them into alphabetized folders overnight (`Compaction`).",
    keyTerms: [
      { term: "WAL (Write-Ahead Log)", plainMeaning: "An append-only safety receipt saved on disk BEFORE editing memory, so power loss never forgets committed writes." },
      { term: "MemTable & SSTable", plainMeaning: "LSM writes sort briefly in RAM (`MemTable`), then flush to immutable sorted files on disk (`SSTables`)." },
      { term: "Bloom Filter", plainMeaning: "A tiny bit-array checklist answering \"Definitely NOT in this file\" so reads don't waste disk seeks." },
      { term: "Write Amplification", plainMeaning: "One logical app update causing 10x extra disk bytes rewritten later during page splits or background compaction." },
    ],
    summary:
      "B-Trees mutate fixed-size 4KB–16KB pages in place; LSM-Trees batch writes sequentially into memory (MemTable) and flush immutable sorted SSTables.",
    whyItMatters:
      "Sequential disk I/O is orders of magnitude faster than random in-place disk seeks. Understanding MemTables, WALs, Bloom Filters, and SSTable compaction explains why Cassandra ingests 10x more writes/sec than B-Tree engines.",
    interactiveSim: "sharding-storage",
    coreEntities: [
      {
        name: "B-Tree Engine (Postgres, InnoDB)",
        category: "Read-Optimized Page Tree",
        responsibility: "Balanced tree updating disk blocks in place + Write-Ahead Log (WAL) crash recovery.",
        whenToUse: "Read-heavy OLTP workloads, range queries, transactional point updates.",
      },
      {
        name: "LSM-Tree Engine (RocksDB, Cassandra, Scylla)",
        category: "Write-Optimized Log Engine",
        responsibility: "WAL + sorted RAM MemTable -> flush immutable SSTables -> background merge compaction + Bloom Filter read skip.",
        whenToUse: "Extreme write throughput (metrics, chat history, time-series).",
      },
    ],
    tradeOffs: [
      {
        approach: "B-Tree",
        pros: ["Every key exists in exactly one place on disk (fast deterministic reads)", "Low read amplification"],
        cons: ["Random disk writes & page splits increase write amplification under heavy inserts"],
        bestFor: "OLTP relational databases",
      },
      {
        approach: "LSM-Tree",
        pros: ["Turns random writes into pure sequential append I/O", "Higher disk compression ratio"],
        cons: ["Compaction CPU/disk spikes; reads must check multiple SSTables (mitigated by Bloom Filters)"],
        bestFor: "Write-intensive distributed stores and time-series engines",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Pair LSM-Trees with Bloom Filters in RAM so lookups for non-existent keys skip scanning dozens of disk SSTables in O(1).",
        failurePrevented: "Eliminates worst-case multi-SSTable disk read amplification.",
        redFlagToAvoid: "Thinking all databases use the exact same underlying disk structure.",
      },
    ],
    quizzes: [
      {
        id: "quiz-lsm-1",
        scenarioPrompt:
          "During a read in an LSM-Tree database, what lightweight probabilistic RAM structure quickly confirms a key DEFINITELY does not exist in older SSTable files?",
        options: [
          { id: "a", label: "Bloom Filter", explanation: "Correct! Bloom Filters guarantee zero false negatives, skipping unnecessary SSTable disk seeks." },
          { id: "b", label: "Two-Phase Commit Log", explanation: "2PC coordinates distributed commits, not local SSTable existence checks." },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    furtherReading: ["B+Tree Page Indexing & Write-Ahead Logging (WAL)", "Log-Structured Merge-Trees (LSM), SSTables & Compaction"],
  },
  {
    id: "lesson-caching-strategies",
    trackId: "track-storage",
    order: 3,
    title: "Caching Strategies, Eviction & Stampede Defense",
    subtitle: "Animate Cache-Aside, Write-Through, Write-Behind, LRU vs LFU, and Thundering Herd protection.",
    difficulty: "foundation",
    estimatedMinutes: 10,
    xpReward: 65,
    tags: ["redis", "cache-aside", "write-behind", "lru", "lfu", "stampede"],
    componentTypes: ["cache"],
    plainEnglishAnalogy:
      "Caching is keeping your favorite coffee mug right on your desk (`Redis RAM`, ~0.5 ms) instead of walking downstairs to the basement storage room (`SQL Database`, ~15 ms) every single sip. The tricky part is making sure someone swaps the mug cleanly if the kitchen buys a new menu (`Invalidation`), and making sure 500 coworkers don't all sprint to the basement simultaneously when the mug disappears (`Stampede`).",
    keyTerms: [
      { term: "Cache-Aside (Lazy Load)", plainMeaning: "App checks Redis first; on a miss, reads DB and stores a copy in Redis — most flexible default pattern." },
      { term: "Write-Through vs Write-Behind", plainMeaning: "Write-Through saves cache + DB immediately (zero loss); Write-Behind batches DB writes later (fast, risky on crash)." },
      { term: "Cache Stampede (Thundering Herd)", plainMeaning: "10,000 concurrent users missing an expired popular key at once and hammering the DB identically." },
      { term: "Singleflight Coalescing", plainMeaning: "Merging 1,000 identical simultaneous misses for key `K` into 1 single DB query and sharing the answer." },
    ],
    summary:
      "Caching bridges microsecond RAM and millisecond databases — but wrong write synchronization risks stale reads or silent data loss.",
    whyItMatters:
      "The top 5 caching patterns trade off latency vs consistency vs crash durability. When a viral cache key expires under 10k concurrent reads, unprotected cache misses cause a fatal Cache Stampede.",
    interactiveSim: "caching-strategies",
    coreEntities: [
      {
        name: "Cache-Aside (Lazy Loading)",
        category: "Read Pattern",
        responsibility: "App checks Redis first; on miss, reads DB and populates Redis with TTL; invalidates on write.",
        whenToUse: "Default choice for read-heavy APIs; resilient if cache crashes (falls back to DB).",
      },
      {
        name: "Write-Behind (Write-Back)",
        category: "Async Write Pattern",
        responsibility: "Writes mutate Cache immediately (1–2ms) and flush asynchronously in batches to DB.",
        whenToUse: "High-write telemetry counters/leaderboards where occasional buffered loss is acceptable.",
      },
    ],
    tradeOffs: [
      {
        approach: "Write-Through",
        pros: ["Cache and DB always stay synchronized", "Zero cold read misses after write"],
        cons: ["Higher write latency (2 synchronous hops); caches rarely-read keys"],
        bestFor: "Strong consistency read/write profiles (user profiles, config)",
      },
      {
        approach: "Write-Behind",
        pros: ["Blazing write speed", "Coalesces 100 writes to the same key into 1 SQL batch"],
        cons: ["Power loss in Redis before async flush loses uncommitted writes"],
        bestFor: "View counters, IoT buffers, non-financial metrics",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Prevent Cache Stampedes (Thundering Herd) on hot expiring keys using Request Coalescing (Singleflight locks) or probabilistic early refresh.",
        failurePrevented: "Stops 5,000 concurrent threads from hammering Postgres simultaneously at TTL=0.",
        redFlagToAvoid: "Recommending Write-Behind caching for banking/payment transactions.",
      },
    ],
    quizzes: [
      {
        id: "quiz-cache-1",
        scenarioPrompt:
          "A trending homepage banner key expires at 12:00:00. Within 50 milliseconds, 8,000 requests miss Redis and trigger 8,000 simultaneous heavy SQL joins, crashing Postgres. What pattern solves this cleanly?",
        options: [
          { id: "a", label: "Singleflight / Mutex Lock Coalescing (only 1 request fetches DB while 7,999 wait)", explanation: "Correct! Request coalescing + randomized TTL jitter prevents thundering-herd DB collapses." },
          { id: "b", label: "Switch eviction from LRU to FIFO", explanation: "Eviction policies do not stop simultaneous expiration stampedes." },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    furtherReading: ["Cache-Aside, Write-Through & Write-Behind Strategies", "Singleflight Request Coalescing & Stampede Defense"],
  },
  {
    id: "lesson-replication-failover",
    trackId: "track-storage",
    order: 4,
    title: "Replication Topologies, Lag & Failover",
    subtitle: "Leader-Follower sync vs async trade-offs, Read-Your-Writes guarantees, and Multi-Leader conflict resolution.",
    difficulty: "intermediate",
    estimatedMinutes: 9,
    xpReward: 55,
    tags: ["replication", "read-replicas", "stale-read", "failover", "replication-failover"],
    plainEnglishAnalogy:
      "Imagine a head chef writing orders onto a carbon-copy tape (`WAL`), while three assistant cooks copy from that tape (`Read Replicas`) half a second behind. If a diner updates their nut-allergy note with the head chef, then immediately reloads the menu handled by an assistant cook before the tape arrives, they panic seeing the old menu (`Replica Lag`)!",
    keyTerms: [
      { term: "WAL / LSN Sequence", plainMeaning: "Monotonically numbered change journal entries showing exactly how far behind each replica lags." },
      { term: "Read-Your-Writes Consistency", plainMeaning: "Routing a user's reads back to the Primary DB for a few seconds right after they save an edit." },
      { term: "Split-Brain Disaster", plainMeaning: "A network glitch tricking two servers into thinking THEY are the sole Primary, corrupting diverged writes." },
      { term: "Semi-Sync Replication", plainMeaning: "Waiting for just ONE follower to save the log before replying `200 OK`, guaranteeing zero data loss if Primary melts." },
    ],
    summary:
      "Replicating across nodes buys durability and read throughput — at the cost of asynchronous replication lag anomalies.",
    whyItMatters:
      "When a user updates their password (written to Leader) and immediately reloads their profile (routed to a lagging Read Replica), seeing old state triggers subtle bugs unless you enforce Read-Your-Own-Writes routing.",
    interactiveSim: "replication-failover",
    coreEntities: [
      {
        name: "Synchronous vs Asynchronous Replica",
        category: "Durability",
        responsibility: "Sync blocks commit until replica ACKs (0 data loss, high latency); Async commits fast (lag risk).",
        whenToUse: "Semi-sync (1 local sync replica + async replicas) balances safety and speed.",
      },
      {
        name: "Read-Your-Writes Consistency",
        category: "Consistency Pattern",
        responsibility: "Routes reads for recently modified data (e.g., own profile within 5s) straight to Leader.",
        whenToUse: "Any social/UGC app using Read Replicas where users inspect edits immediately.",
      },
    ],
    tradeOffs: [
      {
        approach: "Single-Leader Replication",
        pros: ["Zero write conflicts", "Simple reasoning"],
        cons: ["Leader failure causes brief write outage during promotion; single write region latency"],
        bestFor: "90% of transactional systems",
      },
      {
        approach: "Multi-Leader (Active-Active Multi-Region)",
        pros: ["Low local write latency across US/EU/Asia", "Survives entire region outage"],
        cons: ["Concurrent edits to same row require LWW timestamps, Vector Clocks, or CRDT merge"],
        bestFor: "Global collaborative apps (Figma, Notion) and multi-region SaaS",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Mention replication lag explicitly: route user self-writes or session-critical reads to the Leader for 5–10 seconds, or track LSN/monotonically increasing replica watermarks.",
        failurePrevented: "Eliminates phantom 'my comment disappeared after refresh' UX bugs.",
        redFlagToAvoid: "Assuming asynchronous read replicas are instantly consistent with the master.",
      },
    ],
    quizzes: [
      {
        id: "quiz-rep-1",
        scenarioPrompt:
          "Alice uploads a new avatar (written to Master DB), immediately navigates to her own profile (served by Replica B 400ms behind), and sees her old photo. How do you guarantee Read-Your-Writes without abandoning Read Replicas?",
        options: [
          { id: "a", label: "Route Alice's profile reads to Leader for a short window after her own writes", explanation: "Correct! Reading a user's own mutable entity from Leader (or tracking write LSN timestamp) keeps 99% of public reads on replicas!" },
          { id: "b", label: "Remove all Read Replicas and force 100% reads on Master", explanation: "Overkill that destroys your horizontal read scaling." },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    furtherReading: ["Single-Leader vs Multi-Leader WAL Replication", "Fencing Tokens, Failover Promotion & Split-Brain Safety"],
  },
  {
    id: "lesson-sharding-hotkeys",
    trackId: "track-storage",
    order: 5,
    title: "Database Sharding & Hot-Key Partition Skew",
    subtitle: "Horizontal data partitioning, range vs hash keys, and rescuing celebrity shards with Key Salting.",
    difficulty: "principal",
    estimatedMinutes: 10,
    xpReward: 65,
    tags: ["sharding", "partitioning", "hot-key", "salting", "zipfian"],
    plainEnglishAnalogy:
      "Imagine one giant customer binder bulging out of its covers: you split A–M into Binder #1 and N–Z into Binder #2 (`Range Sharding`), OR deal customers out evenly via hash numbers (`Hash Sharding`). Suddenly Taylor Swift opens a shop in Binder #2, and 50,000 fans grab Binder #2 at once (`Celebrity Hot-Key`)! Solution: photocopy her page across 10 folders (`Salted Keys`) so everyone grabs a different binder.",
    keyTerms: [
      { term: "Zipfian / Celebrity Hot-Key", plainMeaning: "Real traffic isn't flat: a single famous ID or merchant can pull `50%` of requests onto one single database shard." },
      { term: "Salted Key (`id#0..#9`)", plainMeaning: "Appending a tiny random suffix splits one hot key evenly across N shards at read/write time." },
      { term: "Scatter-Gather Slowness", plainMeaning: "Querying without the shard key forces the coordinator to hit ALL shards and wait for the slowest one." },
      { term: "IOPS", plainMeaning: "Disk Input/Output Operations Per Second — why one overloaded disk chokes long before total GB storage runs out." },
    ],
    summary:
      "When writes exceed one machine's IOPS or dataset exceeds terabytes, horizontal sharding splits rows across independent DB clusters.",
    whyItMatters:
      "Picking a bad shard key creates catastrophic skew: e.g., sharding Twitter by celebrity author_id slams Shard #3 while Shards 1, 2, and 4 sit at 2% CPU.",
    interactiveSim: "sharding-storage",
    coreEntities: [
      {
        name: "Range vs Hash Sharding",
        category: "Partition Strategy",
        responsibility: "Range preserves sorted ORDER BY efficiency; Hash scatters uniformly across partitions.",
        whenToUse: "Hash on UUID/user_id for uniform spread; Compound (tenant_id, timestamp) for time-range scans.",
      },
      {
        name: "Salted Partition Keys",
        category: "Skew Mitigation",
        responsibility: "Appends random suffix `celeb_id#0..9` to scatter viral write/read traffic across N shards.",
        whenToUse: "Taylor Swift / Flash Sale hot-key bottlenecks exceeding a single shard's capacity.",
      },
    ],
    tradeOffs: [
      {
        approach: "Sharding by user_id",
        pros: ["Uniform distribution", "All user data lives co-located on 1 shard"],
        cons: ["Global searches or cross-user analytics must scatter-gather all shards"],
        bestFor: "Multi-tenant B2B, chat history, user accounts",
      },
      {
        approach: "Federation (Functional Partitioning)",
        pros: ["No shard router needed; splits Users DB from Orders DB from Billing DB"],
        cons: ["Eventual single large table (like Orders) still eventually needs horizontal sharding"],
        bestFor: "First scaling step before true horizontal key sharding",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Watch out for the Celebrity / Zipfian Hot-Key problem: if one key gets 50k QPS, add a random salt (`#01..#10`) for writes/caches and scatter-gather only those 10 salted keys on reads.",
        failurePrevented: "Prevents a single viral event from burning down one shard despite having 32 cluster nodes.",
        redFlagToAvoid: "Sharding a database without stating the exact Shard Key and how scatter-gather queries are avoided.",
      },
    ],
    quizzes: [
      {
        id: "quiz-shard-1",
        scenarioPrompt:
          "You shard an e-commerce site by `merchant_id` across 16 PostgreSQL shards. On Black Friday, a mega-merchant generates 40% of total platform checkout QPS, saturating Shard 7 to 100% CPU while the other 15 shards are idle. Why?",
        options: [
          { id: "a", label: "Data & Traffic Skew (Hot Key): all writes for that merchant hash deterministically to Shard 7", explanation: "Correct! Key salting or dedicated isolation for mega-tenants prevents single-shard exhaustion." },
          { id: "b", label: "SQL B-Tree indexes corrupted across shards", explanation: "The issue is partition skew concentrating 40% of QPS onto one shard." },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    furtherReading: ["Hash vs Range Sharding Topologies", "Salted Composite Shard Keys & Rebalancing Strategies"],
  },
];

