import { CurriculumTrack } from "../types.js";

export interface AcademyRankTier {
  level: number;
  title: string;
  minXp: number;
  badgeCode: string;
  description: string;
}

export const ACADEMY_RANK_TIERS: AcademyRankTier[] = [
  {
    level: 1,
    title: "Draftsman",
    minXp: 0,
    badgeCode: "RANK-I",
    description: "Mastering fundamental client-server scaling & latency budgets.",
  },
  {
    level: 2,
    title: "System Builder",
    minXp: 200,
    badgeCode: "RANK-II",
    description: "Fluent in storage engines, caching tiers, replication, and partitioning.",
  },
  {
    level: 3,
    title: "Staff Designer",
    minXp: 500,
    badgeCode: "RANK-III",
    description: "Architects fault-tolerant distributed workflows, quorums, and consistent hashing.",
  },
  {
    level: 4,
    title: "Principal Architect",
    minXp: 900,
    badgeCode: "RANK-IV",
    description: "Balances JustEnough Occam complexity against extreme reliability guarantees.",
  },
  {
    level: 5,
    title: "Systems Grandmaster",
    minXp: 1400,
    badgeCode: "RANK-V",
    description: "Commands production trade-offs, live topology debugging, and L5+ interview mastery.",
  },
];

export const CURRICULUM_TRACKS: CurriculumTrack[] = [
  {
    id: "track-foundations",
    order: 1,
    title: "Track 1: Scaling Foundations & Networking",
    subtitle: "From a single monolith box to 10M+ global users via progressive bottlenecks.",
    badge: "FOUNDATION",
    estimatedMinutes: 45,
    lessonIds: [
      "lesson-zero-to-millions",
      "lesson-latency-capacity",
      "lesson-dns-cdn-edge",
      "lesson-load-balancing",
      "lesson-network-protocols",
    ],
  },
  {
    id: "track-storage",
    order: 2,
    title: "Track 2: Storage Internals, Databases & Caching",
    subtitle: "B-Trees vs LSM-Trees, caching strategies, replication lag, and shard hot-keys.",
    badge: "DATA & CACHE",
    estimatedMinutes: 55,
    lessonIds: [
      "lesson-sql-nosql-indexing",
      "lesson-btree-lsm",
      "lesson-caching-strategies",
      "lesson-replication-failover",
      "lesson-sharding-hotkeys",
    ],
  },
  {
    id: "track-distributed",
    order: 3,
    title: "Track 3: Distributed Systems & Consistency Core",
    subtitle: "CAP/PACELC, W+R>N quorums, consistent hashing rings, locks, and CRDTs.",
    badge: "DISTRIBUTED CORE",
    estimatedMinutes: 60,
    lessonIds: [
      "lesson-cap-pacelc",
      "lesson-quorum-consensus",
      "lesson-consistent-hashing",
      "lesson-distributed-locks",
      "lesson-unique-id-snowflake",
      "lesson-clocks-crdts",
    ],
  },
  {
    id: "track-reliability",
    order: 4,
    title: "Track 4: Resilience, Messaging & ArchEval Rules",
    subtitle: "Interactive Break & Fix labs preventing SPOFs, dual-writes, and retry storms.",
    badge: "RESILIENCE",
    estimatedMinutes: 65,
    lessonIds: [
      "lesson-queues-streams",
      "concept-backpressure",
      "concept-idempotency",
      "concept-bounded-retries",
      "concept-dlq",
      "concept-spof",
      "concept-outbox",
      "concept-sync-chains",
      "lesson-sagas-cqrs",
      "concept-just-enough",
    ],
  },
  {
    id: "track-entities",
    order: 5,
    title: "Track 5: Iconic Entities & Building Blocks",
    subtitle: "Reusable senior building blocks: Rate Limiters, Object Stores, Search & Geo.",
    badge: "ENTITIES",
    estimatedMinutes: 50,
    lessonIds: [
      "lesson-rate-limiter-entity",
      "lesson-object-storage-s3",
      "lesson-search-autocomplete",
      "lesson-geospatial-engine",
      "lesson-metrics-timeseries",
      "lesson-vector-rag",
    ],
  },
];

