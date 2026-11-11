import {
  BreakAndFixLab,
  CurriculumTrack,
  FlashcardItem,
  InterviewCaseStudy,
  LearningCard,
  SystemDesignLesson,
} from "../types.js";
import { ACADEMY_RANK_TIERS, AcademyRankTier, CURRICULUM_TRACKS } from "./tracks.js";
import { BREAK_AND_FIX_LABS } from "./labs.js";
import { LESSONS_FOUNDATIONS } from "./lessons-foundations.js";
import { LESSONS_STORAGE } from "./lessons-storage.js";
import { LESSONS_DISTRIBUTED } from "./lessons-distributed.js";
import { LESSONS_RELIABILITY } from "./lessons-reliability.js";
import { LESSONS_ENTITIES } from "./lessons-entities.js";
import {
  CAPACITY_PRESETS,
  DELIVERY_FRAMEWORK_STAGES,
  FLASHCARD_DECK,
  INTERVIEW_CASE_STUDIES,
  LATENCY_LADDER,
  CapacityPreset,
} from "./interview-primer.js";

export {
  ACADEMY_RANK_TIERS,
  AcademyRankTier,
  CURRICULUM_TRACKS,
  BREAK_AND_FIX_LABS,
  LESSONS_FOUNDATIONS,
  LESSONS_STORAGE,
  LESSONS_DISTRIBUTED,
  LESSONS_RELIABILITY,
  LESSONS_ENTITIES,
  DELIVERY_FRAMEWORK_STAGES,
  LATENCY_LADDER,
  CAPACITY_PRESETS,
  INTERVIEW_CASE_STUDIES,
  FLASHCARD_DECK,
  CapacityPreset,
};

export const ALL_LESSONS: SystemDesignLesson[] = [
  ...LESSONS_FOUNDATIONS,
  ...LESSONS_STORAGE,
  ...LESSONS_DISTRIBUTED,
  ...LESSONS_RELIABILITY,
  ...LESSONS_ENTITIES,
];

const COMPONENT_TYPE_TO_LESSON_ID: Record<string, string> = {
  application: "lesson-zero-to-millions",
  service: "concept-sync-chains",
  module: "concept-just-enough",
  api_gateway: "lesson-rate-limiter-entity",
  load_balancer: "lesson-load-balancing",
  relational_database: "lesson-sql-nosql-indexing",
  document_database: "lesson-btree-lsm",
  key_value_store: "lesson-sharding-hotkeys",
  cache: "lesson-caching-strategies",
  message_queue: "lesson-queues-streams",
  event_stream: "lesson-queues-streams",
  background_worker: "concept-dlq",
  object_storage: "lesson-object-storage-s3",
  search_engine: "lesson-search-autocomplete",
  identity_provider: "lesson-network-protocols",
  external_provider: "concept-bounded-retries",
  observability: "lesson-metrics-timeseries",
};

const ALIAS_TO_LESSON_ID: Record<string, string> = {
  traceability: "concept-just-enough",
  slo: "concept-just-enough",
  "data-ownership": "concept-just-enough",
  backpressure: "concept-backpressure",
  idempotency: "concept-idempotency",
  "bounded-retries": "concept-bounded-retries",
  dlq: "concept-dlq",
  spof: "concept-spof",
  outbox: "concept-outbox",
  "sync-chains": "concept-sync-chains",
  "just-enough": "concept-just-enough",
  cap: "lesson-cap-pacelc",
  pacelc: "lesson-cap-pacelc",
  quorum: "lesson-quorum-consensus",
  "consistent-hashing": "lesson-consistent-hashing",
  "rate-limiter": "lesson-rate-limiter-entity",
  "zero-to-millions": "lesson-zero-to-millions",
  sharding: "lesson-sharding-hotkeys",
  caching: "lesson-caching-strategies",
  replication: "lesson-replication-failover",
  snowflake: "lesson-unique-id-snowflake",
  crdt: "lesson-clocks-crdts",
  sagas: "lesson-sagas-cqrs",
  s3: "lesson-object-storage-s3",
  geospatial: "lesson-geospatial-engine",
  rag: "lesson-vector-rag",
};

export function listTracks(): CurriculumTrack[] {
  return CURRICULUM_TRACKS;
}

export function getTrackById(trackId: string): CurriculumTrack | undefined {
  return CURRICULUM_TRACKS.find((t) => t.id === trackId);
}

export function getLessonsByTrack(trackId: string): SystemDesignLesson[] {
  return ALL_LESSONS.filter((l) => l.trackId === trackId).sort(
    (a, b) => a.order - b.order
  );
}

export function getLessonById(idOrAlias: string): SystemDesignLesson | undefined {
  const q = idOrAlias.trim().toLowerCase();
  const aliased = ALIAS_TO_LESSON_ID[q];
  if (aliased) {
    const found = ALL_LESSONS.find((l) => l.id === aliased);
    if (found) return found;
  }

  return (
    ALL_LESSONS.find((l) => l.id.toLowerCase() === q) ||
    ALL_LESSONS.find((l) => l.id.toLowerCase() === `lesson-${q}`) ||
    ALL_LESSONS.find((l) => l.id.toLowerCase() === `concept-${q}`) ||
    ALL_LESSONS.find((l) => l.ruleIds?.some((r) => r.toLowerCase() === q)) ||
    ALL_LESSONS.find(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase() === q || t.toLowerCase().includes(q))
    )
  );
}

export function getLessonByRuleId(ruleId: string): SystemDesignLesson | undefined {
  const norm = ruleId.trim().toUpperCase();
  return ALL_LESSONS.find((l) => l.ruleIds?.some((r) => r.toUpperCase() === norm));
}

export function getLessonByComponentType(
  componentType: string
): SystemDesignLesson | undefined {
  const norm = componentType.trim().toLowerCase();
  const explicit = ALL_LESSONS.find((l) =>
    l.componentTypes?.some((c) => c.toLowerCase() === norm)
  );
  if (explicit) return explicit;

  const mappedId = COMPONENT_TYPE_TO_LESSON_ID[norm];
  if (mappedId) {
    return ALL_LESSONS.find((l) => l.id === mappedId);
  }
  return ALL_LESSONS[0];
}

export function getLabById(labId: string): BreakAndFixLab | undefined {
  return BREAK_AND_FIX_LABS[labId];
}

export function searchCurriculum(query: string): {
  lessons: SystemDesignLesson[];
  caseStudies: InterviewCaseStudy[];
  flashcards: FlashcardItem[];
} {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      lessons: ALL_LESSONS,
      caseStudies: INTERVIEW_CASE_STUDIES,
      flashcards: FLASHCARD_DECK,
    };
  }

  return {
    lessons: ALL_LESSONS.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.subtitle.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q)) ||
        l.ruleIds?.some((r) => r.toLowerCase().includes(q))
    ),
    caseStudies: INTERVIEW_CASE_STUDIES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.companyAnalog.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.seniorHook.toLowerCase().includes(q)
    ),
    flashcards: FLASHCARD_DECK.filter(
      (f) =>
        f.front.toLowerCase().includes(q) ||
        f.back.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    ),
  };
}

export function getRankForXp(xp: number): {
  current: AcademyRankTier;
  next?: AcademyRankTier;
  progressPercent: number;
} {
  let current = ACADEMY_RANK_TIERS[0];
  for (const tier of ACADEMY_RANK_TIERS) {
    if (xp >= tier.minXp) {
      current = tier;
    }
  }
  const currentIdx = ACADEMY_RANK_TIERS.findIndex((t) => t.level === current.level);
  const next =
    currentIdx >= 0 && currentIdx + 1 < ACADEMY_RANK_TIERS.length
      ? ACADEMY_RANK_TIERS[currentIdx + 1]
      : undefined;

  if (!next) {
    return { current, next: undefined, progressPercent: 100 };
  }

  const span = Math.max(1, next.minXp - current.minXp);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((xp - current.minXp) / span) * 100))
  );

  return { current, next, progressPercent };
}

export function lessonToLearningCard(lesson: SystemDesignLesson): LearningCard {
  const firstHook = lesson.seniorInterviewHooks[0];
  return {
    id: lesson.id,
    concept: lesson.tags[0] || lesson.id.replace(/^(lesson|concept)-/, ""),
    title: lesson.title,
    plainEnglishAnalogy: lesson.plainEnglishAnalogy,
    summary: lesson.summary,
    whyItMatters: lesson.whyItMatters,
    concreteFailureExample: firstHook
      ? `${firstHook.failurePrevented} (Red flag: ${firstHook.redFlagToAvoid})`
      : lesson.tradeOffs[0]?.cons[0] || "Bottlenecks surface rapidly under concurrent spikes.",
    mitigationOptions: lesson.tradeOffs.map(
      (t) => `${t.approach} — Best for ${t.bestFor} (${t.pros[0] ?? "scalable"})`
    ),
    verificationApproach: firstHook
      ? `Interview Hook: ${firstHook.hook}`
      : lesson.coreEntities[0]?.responsibility || "Verify latency, durability, and failure isolation via deterministic checks.",
    furtherReading: lesson.furtherReading,
    ruleIds: lesson.ruleIds,
  };
}

