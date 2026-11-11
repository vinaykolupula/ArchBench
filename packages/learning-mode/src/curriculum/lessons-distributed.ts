import { SystemDesignLesson } from "../types.js";

export const LESSONS_DISTRIBUTED: SystemDesignLesson[] = [
  {
    id: "lesson-cap-pacelc",
    trackId: "track-distributed",
    order: 1,
    title: "CAP & PACELC Theorems in Real Networks",
    subtitle: "Why Partition Tolerance is non-negotiable, and how systems actually trade Consistency vs Latency.",
    difficulty: "foundation",
    estimatedMinutes: 8,
    xpReward: 55,
    tags: ["cap-theorem", "pacelc", "cp", "ap", "consistency"],
    plainEnglishAnalogy:
      "Imagine two bank tellers keeping balances in sync over a phone line. Suddenly an excavator cuts the fiber cable (a Network Partition). Teller B must make a choice: either lock her window so nobody accidentally overdraws (CP — stay Consistent, refuse some requests) or keep cashing small checks from memory and sort out conflicts tonight (AP — stay Available, accept stale data).",
    keyTerms: [
      { term: "Network Partition (P)", plainMeaning: "Messages between two datacenters/servers get dropped or delayed — an unavoidable fact of real hardware." },
      { term: "Linearizability (CP)", plainMeaning: "Once a write completes, every reader everywhere immediately sees that new value — or receives an error." },
      { term: "Eventual Consistency (AP)", plainMeaning: "If writes stop, all replicas will eventually agree, though brief stale reads are allowed right after edits." },
      { term: "PACELC", plainMeaning: "Extension of CAP: even when the network is healthy (Else), databases still trade Latency for Consistency." },
    ],
    summary:
      "Network partitions (P) are inevitable in real networks, forcing systems to choose Consistency (CP) or Availability (AP) during faults — and Latency (L) vs Consistency (C) during normal operation (PACELC).",
    whyItMatters:
      "Claiming a distributed database is 'CA' is a famous interview red flag. Real engineers configure CP for financial ledgers/locks (reject writes rather than lie) and AP for social feeds/shopping carts (keep serving reads/writes).",
    interactiveSim: "cap-quorum",
    coreEntities: [
      {
        name: "CP Systems (ZooKeeper, etcd, HBase, Spanner)",
        category: "Consistency-First",
        responsibility: "Halts minority partition writes/reads during network splits to preserve linearizability.",
        whenToUse: "Distributed locks, banking balances, airline seat bookings, leader election.",
      },
      {
        name: "AP Systems (DynamoDB AP mode, Cassandra)",
        category: "Availability-First",
        responsibility: "Accepts reads/writes on both sides of a split; reconciles conflicts asynchronously later.",
        whenToUse: "Shopping carts, news feeds, metrics ingestion, telemetry logs.",
      },
    ],
    tradeOffs: [
      {
        approach: "CP (Strict Consistency)",
        pros: ["Zero stale reads or split-brain data divergence"],
        cons: ["Returns 503 Unavailable to minority nodes during network partition"],
        bestFor: "Money, inventory counts, configuration locks",
      },
      {
        approach: "AP / Eventual Consistency",
        pros: ["Near-100% uptime and single-digit ms local latency (PACELC)"],
        cons: ["Clients may observe stale versions briefly until hints/anti-entropy converge"],
        bestFor: "Feeds, likes, views, availability-critical consumer UX",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Cite PACELC: even when there is NO network partition (Else), systems trade off Replication Latency vs Strict Consistency (which is why DynamoDB charges 2x for strongly consistent reads).",
        failurePrevented: "Prevents hand-wavy CAP explanations and grounds cross-region latency budgets.",
        redFlagToAvoid: "Describing PostgreSQL across multiple regions as a 'CA system that picks Consistency and Availability'.",
      },
    ],
    quizzes: [
      {
        id: "quiz-cap-1",
        scenarioPrompt:
          "A datacenter fiber cut isolates 2 of your 5 Raft cluster nodes from the 3-node majority. To remain strictly CP, how must the isolated 2-node minority respond to incoming write requests?",
        options: [
          { id: "a", label: "Accept writes locally and merge them when the fiber is repaired", explanation: "That would be AP behavior, risking diverging split-brain state!" },
          { id: "b", label: "Reject the writes (sacrifice Availability) because it lacks majority quorum", explanation: "Correct! CP systems prioritize consistency by refusing writes on minority partitions." },
        ],
        correctOptionId: "b",
        xpReward: 50,
      },
    ],
    furtherReading: ["Gilbert & Lynch: Brewer's CAP Proof", "Abadi: PACELC Consistency-Latency Trade-off Theorem"],
  },
  {
    id: "lesson-quorum-consensus",
    trackId: "track-distributed",
    order: 2,
    title: "Quorums (W + R > N) & Raft Consensus",
    subtitle: "Tuning overlap quorums in Dynamo-style rings and understanding leader-term Raft guarantees.",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    xpReward: 65,
    tags: ["quorum", "raft", "consensus", "dynamo", "split-brain"],
    plainEnglishAnalogy:
      "Imagine keeping 5 friends (`N=5`) updated on a secret scoreboard. If every update gets signed by 3 friends (`W=3`) and every check asks 3 friends (`R=3`), then even if 2 friends' phones lose signal, at least ONE friend in the reading group (`3 + 3 > 5`) MUST have the latest score!",
    keyTerms: [
      { term: "Strict Quorum (`W + R > N`)", plainMeaning: "When write votes plus read votes strictly beat replica count `N`, read and write groups always overlap by at least 1 node." },
      { term: "Raft / Paxos Consensus", plainMeaning: "Electing one leader per term via majority votes (`N/2 + 1`) so two nodes never declare themselves boss simultaneously." },
      { term: "Last-Write-Wins (LWW)", plainMeaning: "Conflict tie-breaking by server timestamp — simple but dangerous because slightly misaligned clocks can silently overwrite newer data." },
      { term: "Read Repair", plainMeaning: "When a quorum read spots an out-of-date replica, it quietly sends the fresher version back to heal it." },
    ],
    summary:
      "Requiring Write Quorum (W) + Read Quorum (R) > Total Replicas (N) guarantees at least one node in every read holds the latest committed write.",
    whyItMatters:
      "Tunable quorums let Cassandra/Dynamo adapt per-request: W=N, R=1 optimizes reads while risking availability; W=2, R=2 on N=3 survives 1 dead node while preserving strong overlap.",
    interactiveSim: "cap-quorum",
    coreEntities: [
      {
        name: "Pigeonhole Overlap (W + R > N)",
        category: "Quorum Math",
        responsibility: "If N=3, W=2, R=2 -> write and read sets MUST share >= 1 updated replica.",
        whenToUse: "Leaderless key-value stores (Cassandra, Riak, Dynamo).",
      },
      {
        name: "Raft Leader & Term Epoch",
        category: "Consensus",
        responsibility: "Elects a single majority-backed Leader per monotonic Term; followers truncate uncommitted diverging logs.",
        whenToUse: "Metadata coordination (Kubernetes etcd, Consul, Kafka KRaft).",
      },
    ],
    tradeOffs: [
      {
        approach: "Quorum (N=3, W=2, R=2)",
        pros: ["Tolerates 1 node failure for both reads and writes with strict overlap"],
        cons: ["Slightly slower writes than W=1 due to waiting for 2nd node ACK"],
        bestFor: "Balanced HA + strong quorum consistency",
      },
      {
        approach: "Fast Path Eventual (N=3, W=1, R=1)",
        pros: ["Ultra-low latency; survives 2 node crashes"],
        cons: ["W+R=2 <= 3 means zero guarantee of reading newest write"],
        bestFor: "High-throughput telemetry and ephemeral session beacons",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Remind interviewers that even W+R>N in Dynamo has a Sloppy Quorum / Read-Repair edge case during simultaneous concurrent writes without version resolution.",
        failurePrevented: "Prevents mistaken assumptions about sloppy-quorum linearizability.",
        redFlagToAvoid: "Thinking W=1, R=3 always prevents data loss if a single node crashes permanently right after write.",
      },
    ],
    quizzes: [
      {
        id: "quiz-quorum-1",
        scenarioPrompt:
          "You configure a 5-replica Dynamo ring (N=5) with W=2 and R=3. Which statement is mathematically guaranteed?",
        options: [
          { id: "a", label: "At least 1 replica in any R=3 read overlaps the W=2 write set automatically", explanation: "Careful! Check the math: 2 + 3 = 5, which is NOT strictly greater than 5. Two non-overlapping sets of size 2 and 3 can sit on different servers (e.g. write on Nodes {1,2}, read on Nodes {3,4,5})!" },
          { id: "b", label: "Stale reads are STILL possible because W+R equals N rather than strictly exceeding N", explanation: "Correct! If nodes {1,2} get the write and read queries nodes {3,4,5}, zero overlap occurs! Strict quorum needs W+R >= 6." },
        ],
        correctOptionId: "b",
        xpReward: 50,
      },
    ],
    furtherReading: ["Ongaro & Ousterhout: Raft Consensus Algorithm (USENIX ATC 2014)", "DeCandia et al.: Dynamo Key-Value Store (SOSP 2007)"],
  },
  {
    id: "lesson-consistent-hashing",
    trackId: "track-distributed",
    order: 3,
    title: "Consistent Hashing & Virtual Nodes (Vnodes)",
    subtitle: "Eliminating thundering rebalancing storms when cache or shard nodes join and leave.",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    xpReward: 65,
    tags: ["consistent-hashing", "vnodes", "redis-cluster", "sharding"],
    plainEnglishAnalogy:
      "Imagine numbering 100 lockers sequentially (`hash % 4`): adding one extra server shifts almost EVERY key into a different locker simultaneously, triggering a stampede to Postgres. Consistent Hashing puts servers around a circular clock face (`0..360 deg`) with virtual seats (`Vnodes`), so losing 1 server only slides the handful of keys right before that seat clockwise.",
    keyTerms: [
      { term: "Hash Ring (0..360°)", plainMeaning: "Circular keyspace where keys walk clockwise until landing on the next active server marker." },
      { term: "Virtual Nodes (Vnodes)", plainMeaning: "Giving each physical box 100+ virtual spots around the clock so traffic spreads evenly instead of clumping." },
      { term: "`hash(k) % N` Key Churn", plainMeaning: "Changing modulo divisor `N -> N+1` invalidates `80-100%` of cached keys in a single instant." },
      { term: "Origin Cache Stampede", plainMeaning: "When most cache entries suddenly relocate simultaneously, smashing the underlying database." },
    ],
    summary:
      "Mapping both servers and keys onto a 360-degree hash ring guarantees only ~1/N keys move on cluster scaling instead of ~85–100% under hash(key) % N.",
    whyItMatters:
      "If you add 1 Redis node to a 4-node modulo-hashed cache (`key % 4 -> key % 5`), 80%+ of keys hash to different servers instantaneously — causing a massive simultaneous DB cache miss storm!",
    interactiveSim: "consistent-hashing",
    coreEntities: [
      {
        name: "32-bit Hash Ring (0 to 2^32 - 1)",
        category: "Routing Topology",
        responsibility: "Places node hashes around a circle; keys walk clockwise to hit their owner server.",
        whenToUse: "Distributed Caches, Partitioned KV Stores, Load Balancer sticky pools.",
      },
      {
        name: "Virtual Nodes (Vnodes)",
        category: "Skew Balancer",
        responsibility: "Places K virtual tokens (e.g. 50) per physical server around the ring for uniform key balance.",
        whenToUse: "Always in production consistent hashing (handles heterogeneous server sizes cleanly).",
      },
    ],
    tradeOffs: [
      {
        approach: "Modulo Hashing (hash(key) % N)",
        pros: ["O(1) array index lookup", "Minimal metadata"],
        cons: ["Adding or dropping 1 node remaps ~ (N-1)/N of all keys (catastrophic cache miss storm)"],
        bestFor: "Static fixed-size hash tables",
      },
      {
        approach: "Consistent Hashing + Vnodes",
        pros: ["Only ~K/N keys relocate on cluster resize", "Even distribution with >= 30 vnodes/node"],
        cons: ["O(log(N*V)) binary search in routing ring; slightly more client ring state"],
        bestFor: "Auto-scaling distributed caches and Dynamo/Cassandra shards",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Mention Virtual Nodes explicitly alongside Consistent Hashing — without vnodes, a 3-node cluster frequently suffers severe 60%/25%/15% partition skew.",
        failurePrevented: "Prevents uneven cluster memory saturation and cascading node eviction.",
        redFlagToAvoid: "Thinking consistent hashing stops hot-key spikes (a single hot key still hits one owner node!).",
      },
    ],
    quizzes: [
      {
        id: "quiz-ch-1",
        scenarioPrompt:
          "You scale a 4-node Redis cache up to 5 nodes using naive modulo (`hash(k) % N`). Roughly what fraction of cached keys suddenly point to the wrong server?",
        options: [
          { id: "a", label: "~20% (1/5 of keys)", explanation: "1/5 is Consistent Hashing behavior! Naive modulo changes almost every key's remainder." },
          { id: "b", label: "~80% of keys", explanation: "Correct! Nearly 4/5 of keys remap instantly, triggering an instant DB read avalanche." },
        ],
        correctOptionId: "b",
        xpReward: 50,
      },
    ],
    furtherReading: ["Karger et al.: Consistent Hashing & Random Trees (MIT STOC 1997)", "Virtual Node Ring Weighting & Cluster Rebalancing"],
  },
  {
    id: "lesson-distributed-locks",
    trackId: "track-distributed",
    order: 4,
    title: "Distributed Locking & Monotonic Fencing Tokens",
    subtitle: "Preventing race conditions in seat booking and payments without falling into GC-pause split-brain traps.",
    difficulty: "principal",
    estimatedMinutes: 9,
    xpReward: 60,
    tags: ["distributed-lock", "redlock", "fencing-tokens", "concurrency", "ticketmaster"],
    plainEnglishAnalogy:
      "Imagine a shared studio bathroom key hanging by the door with a 5-minute auto-unlock timer (`TTL Lease`). If Alice walks in, takes a sudden 7-minute nap (`GC Pause`), the door unlocks and hands Bob a freshly stamped Key #34. When Alice wakes up holding Key #33, the room door itself checks the stamp and rejects Key #33 (`Fencing Token`) so she can't overwrite Bob's work!",
    keyTerms: [
      { term: "TTL Lease", plainMeaning: "Auto-expiring lock timeout preventing permanent deadlocks if a worker crashes while holding a lock." },
      { term: "GC Stop-the-World Pause", plainMeaning: "When a runtime freezes a worker for several seconds — long enough for its lock TTL to silently expire." },
      { term: "Fencing Token", plainMeaning: "A strictly increasing lock counter (`33`, `34`) rejected by storage if an older number arrives late." },
      { term: "Atomic Lua Unlock", plainMeaning: "Only delete a Redis lock if its stored UUID matches yours, preventing Worker 1 from deleting Worker 2's lock." },
    ],
    summary:
      "Distributed locks coordinate exclusive resource mutations across stateless processes using leases (TTL), unique ownership tokens, and storage-layer Fencing Tokens.",
    whyItMatters:
      "Even with Redis SET NX PX TTL locks, if Client 1 hits a 6-second JVM Stop-the-World GC pause and its 5s TTL expires, Client 2 acquires the lock — then Client 1 wakes up and corrupts storage unless protected by monotonically increasing Fencing Tokens.",
    coreEntities: [
      {
        name: "Lease-Backed Lock (Redis SET NX PX / etcd)",
        category: "Coordination",
        responsibility: "Acquires atomic lock with unique owner UUID + short TTL so dead holders unlock automatically.",
        whenToUse: "Ticket checkout holds, deduplicating cron leaders, exclusive inventory locks.",
      },
      {
        name: "Monotonic Fencing Token",
        category: "Safety Guard",
        responsibility: "Increasing sequence # issued by lock service; storage rejects writes with stale lower tokens.",
        whenToUse: "Whenever correctness matters (inventory, financial payouts) even under GC pauses.",
      },
    ],
    tradeOffs: [
      {
        approach: "Optimistic Concurrency (SQL Version / CAS)",
        pros: ["No external lock coordinator needed", "Zero deadlock risk"],
        cons: ["High contention hot rows suffer heavy retry thrashing"],
        bestFor: "Low-to-medium contention updates",
      },
      {
        approach: "Redis TTL Lock + Fencing Token",
        pros: ["Fast microsecond mutual exclusion across distributed microservices"],
        cons: ["Extra dependency; requires atomic Lua release & fencing verification"],
        bestFor: "Ticketmaster seat holds, distributed scheduler coordination",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Always release a Redis lock using an atomic Lua script comparing your random owner UUID (`if redis.call('get', key) == token then del`) — never plain DEL after expiry!",
        failurePrevented: "Stops Slow Worker A from deleting Fast Worker B's newly acquired lock.",
        redFlagToAvoid: "Forgetting lock TTLs (creating permanent deadlocks when a container crashes mid-request).",
      },
    ],
    quizzes: [
      {
        id: "quiz-lock-1",
        scenarioPrompt:
          "Worker 1 grabs Redis lock `seat_42` (TTL 5s, Token #33), stalls in a 7s GC pause, and expires. Worker 2 acquires `seat_42` (Token #34) and commits to DB. Worker 1 wakes up believing it still holds the lock and tries writing. What stops Worker 1?",
        options: [
          { id: "a", label: "DB rejects Token #33 because stored fencing token is already #34", explanation: "Correct! Monotonic fencing tokens at the storage boundary close the unsafe GC-pause window." },
          { id: "b", label: "Worker 1 checks its local wall-clock clock", explanation: "Clock skew and further pauses between checking the clock and sending the TCP packet still fail!" },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    furtherReading: ["Monotonic Fencing Tokens & GC-Safe Lease Locks", "Burrows: The Chubby Lock Service (OSDI 2006)"],
  },
  {
    id: "lesson-unique-id-snowflake",
    trackId: "track-distributed",
    order: 5,
    title: "Distributed Unique ID Generators (Twitter Snowflake)",
    subtitle: "Generating globally unique, K-sortable 64-bit IDs at 100k+ IDs/sec with zero single DB bottleneck.",
    difficulty: "intermediate",
    estimatedMinutes: 7,
    xpReward: 50,
    tags: ["snowflake", "uuid", "ids", "btree-fragmentation"],
    plainEnglishAnalogy:
      "Imagine 50 factories stamping package serial numbers simultaneously without calling headquarters. If everyone used random gibberish (`UUIDv4`), your warehouse filing clerk (`SQL B-Tree Index`) has to run across random shelves on every single package, destroying disk caches! Instead, Snowflake stamps `[Current Millisecond | Factory # | Counter]` into one compact `64-bit` number — globally unique, zero network waits, AND cleanly sorted by arrival time!",
    keyTerms: [
      { term: "64-bit Snowflake Layout", plainMeaning: "1 sign bit + 41 bits milliseconds + 10 bits worker ID + 12 bits sequence (4,096 IDs/ms per machine)." },
      { term: "UUIDv4 B-Tree Page Thrashing", plainMeaning: "Totally random 128-bit IDs force indexes to insert into random 16KB disk pages constantly, tanking write throughput." },
      { term: "Clock Skew / NTP Drift", plainMeaning: "If a server's clock jumps backward 5ms, Snowflake either pauses briefly or switches worker IDs to prevent duplicate IDs." },
      { term: "UUIDv7", plainMeaning: "Modern 128-bit standard sorting chronologically by Unix millisecond timestamp (eliminates random B-Tree thrashing!)." },
    ],
    summary:
      "Auto-incrementing SQL IDs break under sharding, while random UUIDv4 fragments DB B-Trees; 64-bit Snowflake IDs pack Timestamp + Machine ID + Sequence cleanly.",
    whyItMatters:
      "Random 128-bit UUIDv4 inserts scatter randomly across B-Tree disk pages, destroying database page cache hit rates. Roughly time-ordered 64-bit IDs append sequentially at B-Tree right leaves.",
    coreEntities: [
      {
        name: "64-Bit Snowflake Layout",
        category: "ID Generator",
        responsibility: "1-bit sign | 41-bit ms timestamp | 5-bit DC | 5-bit Worker | 12-bit per-ms seq (4096 IDs/ms/node).",
        whenToUse: "Distributed tweets, orders, messages, URL slugs needing chronological B-Tree locality.",
      },
    ],
    tradeOffs: [
      {
        approach: "Random UUIDv4",
        pros: ["Zero coordination", "Generates anywhere offline"],
        cons: ["128-bit size doubles index RAM", "Random ordering causes heavy B-Tree page fragmentation"],
        bestFor: "Idempotency keys and correlation trace IDs",
      },
      {
        approach: "Twitter Snowflake / UUIDv7",
        pros: ["Time-sortable, compact 64-bit integer (Snowflake), no DB coordination per ID"],
        cons: ["Snowflake requires NTP clock-drift guarding so time never steps backwards"],
        bestFor: "Primary DB keys in sharded systems (orders, tweets, ledger events)",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "Explain NTP Clock Rollback defense in Snowflake: if OS time drifts backward by milliseconds, pause generation or switch backup sequence bits instead of emitting duplicate IDs.",
        failurePrevented: "Prevents primary-key collision bugs across leap-second/NTP sync events.",
        redFlagToAvoid: "Relying on a central Postgres `SERIAL` generator for 100k writes/sec across shards.",
      },
    ],
    quizzes: [
      {
        id: "quiz-id-1",
        scenarioPrompt:
          "Why does inserting 500M rows keyed by random UUIDv4 crush PostgreSQL write throughput compared to Snowflake or UUIDv7?",
        options: [
          { id: "a", label: "Random keys force random B-Tree page splits and evict leaf pages from RAM buffers continuously", explanation: "Correct! Sequential/time-prefixed keys append smoothly to the rightmost B-Tree leaf pages." },
          { id: "b", label: "UUID strings cannot be hashed", explanation: "B-Trees compare keys lexicographically; fragmentation stems from randomness, not unhashability." },
        ],
        correctOptionId: "a",
        xpReward: 45,
      },
    ],
    furtherReading: ["64-Bit Time-Ordered ID Packing & Clock Drift Protection", "IETF RFC 9562: UUIDv7 Identifiers"],
  },
  {
    id: "lesson-clocks-crdts",
    trackId: "track-distributed",
    order: 6,
    title: "Logical Clocks, Vector Clocks & CRDTs",
    subtitle: "Resolving concurrent offline/multi-user mutations automatically without fragile wall clocks.",
    difficulty: "principal",
    estimatedMinutes: 9,
    xpReward: 60,
    tags: ["vector-clocks", "crdt", "lww", "collaboration", "figma"],
    plainEnglishAnalogy:
      "Suppose Alice and Bob edit the same Figma shape while sitting on two airplanes (`Offline Edits`). Alice's laptop clock happens to be 5 seconds behind Bob's (`Clock Drift`), so comparing timestamps (`Last-Write-Wins`) wrongly throws away Alice's newer work! Vector Clocks track *who knew what* (causality), while CRDTs design data structures (like a shared shopping basket or property map) that merge together reliably regardless of arrival order.",
    keyTerms: [
      { term: "Physical vs Vector Clock", plainMeaning: "Wall clocks (`Date.now()`) drift across servers; Vector Clocks track exact cause-and-effect chains `[node: count]`." },
      { term: "Happens-Before vs Concurrent", plainMeaning: "Proving mathematically whether Edit B saw Edit A first, or both happened offline cleanly needing merge." },
      { term: "CRDT (Conflict-Free Data Type)", plainMeaning: "Smart data objects whose merge step produces the exact same answer no matter which order sync messages arrive." },
      { term: "Tombstone Record", plainMeaning: "Marking deleted items `is_deleted: true` briefly instead of erasing rows, so offline phones don't resurrect deleted data." },
    ],
    summary:
      "Physical clocks drift across machines; Vector Clocks track causal happens-before relationships while CRDTs merge concurrent edits mathematically cleanly.",
    whyItMatters:
      "Last-Write-Wins (LWW) using client timestamps silently drops edits if Client B's laptop clock is 2 minutes behind. Real-time multiplayer systems (Figma, Notion, Dynamo carts) rely on CRDTs or Vector Clocks.",
    coreEntities: [
      {
        name: "Vector Clock",
        category: "Causal History",
        responsibility: "List of `[nodeId: counter]` pairs proving whether Edit A caused B or A || B are concurrent conflicts.",
        whenToUse: "Leaderless shopping carts (Amazon Dynamo) where sibling conflicts merge explicitly.",
      },
      {
        name: "Conflict-Free Replicated Data Type (CRDT)",
        category: "Mathematical Merge",
        responsibility: "Commutative, associative, idempotent data structures (G-Counter, LWW-Element-Set, RGA).",
        whenToUse: "Collaborative editors (Figma/Docs), offline mobile sync, Redis Active-Active counters.",
      },
    ],
    tradeOffs: [
      {
        approach: "Last-Write-Wins (LWW Timestamps)",
        pros: ["Tiny metadata; zero custom merge logic"],
        cons: ["Silently discards valid concurrent updates under NTP clock skew"],
        bestFor: "Non-critical overwritten cache attributes",
      },
      {
        approach: "CRDTs / Fractional Indexing",
        pros: ["Converges deterministically regardless of network message arrival order"],
        cons: ["Tombstone metadata growth requires periodic compaction snapshots"],
        bestFor: "Collaborative documents, shared counters, multiplayer canvases",
      },
    ],
    seniorInterviewHooks: [
      {
        hook: "In collaborative canvases (like Figma), assign deterministic fractional Z-order IDs + per-property LWW Registers per shape rather than heavy whole-document diffs.",
        failurePrevented: "Allows offline editing + concurrent movement + zero lock contention.",
        redFlagToAvoid: "Using `Date.now()` from client browsers to arbitrate server financial or order state.",
      },
    ],
    quizzes: [
      {
        id: "quiz-crdt-1",
        scenarioPrompt:
          "Two collaborators simultaneously edit offline: User A changes Rectangle X's color to Blue, and User B drags Rectangle X to `(100, 200)`. With property-level LWW-Element CRDTs, what happens upon reconnect?",
        options: [
          { id: "a", label: "Both edits survive cleanly (Rectangle X is Blue AND at 100, 200)", explanation: "Correct! Orthogonal property registers compose associatively without clobbering each other." },
          { id: "b", label: "One user's entire edit must be rolled back manually", explanation: "That happens only with coarse document-level LWW, not property-granular CRDTs." },
        ],
        correctOptionId: "a",
        xpReward: 50,
      },
    ],
    furtherReading: ["Lamport: Time, Clocks, and the Ordering of Events (1978)", "Shapiro et al.: Conflict-Free Replicated Data Types (CRDTs)"],
  },
];

