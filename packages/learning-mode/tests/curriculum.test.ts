import { describe, expect, it } from "vitest";
import {
  ACADEMY_RANK_TIERS,
  ALL_LESSONS,
  BREAK_AND_FIX_LABS,
  CAPACITY_PRESETS,
  CURRICULUM_TRACKS,
  DELIVERY_FRAMEWORK_STAGES,
  FLASHCARD_DECK,
  INTERVIEW_CASE_STUDIES,
  LATENCY_LADDER,
  LEARNING_CATALOG,
  formatLearningCard,
  getLabById,
  getLearningCard,
  getLessonByComponentType,
  getLessonById,
  getLessonByRuleId,
  getLessonsByTrack,
  getRankForXp,
  searchCurriculum,
} from "../src/index.js";

describe("ArchBench Academy Curriculum & Primer", () => {
  it("connects all 5 tracks to valid lessons without dangling IDs", () => {
    expect(CURRICULUM_TRACKS).toHaveLength(5);
    expect(ALL_LESSONS.length).toBe(32);

    const lessonIds = new Set(ALL_LESSONS.map((l) => l.id));
    expect(lessonIds.size).toBe(ALL_LESSONS.length);

    for (const track of CURRICULUM_TRACKS) {
      const trackLessons = getLessonsByTrack(track.id);
      expect(trackLessons.length).toBe(track.lessonIds.length);
      for (const lid of track.lessonIds) {
        expect(lessonIds.has(lid)).toBe(true);
      }
    }
  });

  it("ensures every lesson has rich entities, analogies, term decoders, trade-offs, senior hooks, and clear quizzes", () => {
    for (const lesson of ALL_LESSONS) {
      expect(lesson.plainEnglishAnalogy?.trim().length).toBeGreaterThan(25);
      expect(lesson.keyTerms?.length ?? 0).toBeGreaterThanOrEqual(3);
      expect(lesson.coreEntities.length).toBeGreaterThanOrEqual(1);
      expect(lesson.tradeOffs.length).toBeGreaterThanOrEqual(1);
      expect(lesson.seniorInterviewHooks.length).toBeGreaterThanOrEqual(1);
      expect(lesson.quizzes.length).toBeGreaterThanOrEqual(1);
      for (const q of lesson.quizzes) {
        expect(q.options.some((o) => o.id === q.correctOptionId)).toBe(true);
        for (const opt of q.options) {
          expect(opt.explanation.trim().length).toBeGreaterThan(20);
        }
      }
    }
  });

  it("resolves every ArchEval Rule ID and ArchSpec componentType to a lesson", () => {
    const ruleIds = [
      "SCAL-001",
      "REL-001",
      "REL-002",
      "REL-003",
      "REL-004",
      "DATA-001",
      "STRUC-001",
      "STRUC-002",
      "REQ-COV-001",
      "REQ-COV-002",
    ];
    for (const ruleId of ruleIds) {
      expect(getLessonByRuleId(ruleId)).toBeDefined();
      expect(getLearningCard(ruleId)).toBeDefined();
    }

    const compTypes = [
      "api_gateway",
      "load_balancer",
      "relational_database",
      "document_database",
      "key_value_store",
      "cache",
      "message_queue",
      "event_stream",
      "background_worker",
      "object_storage",
      "search_engine",
      "observability",
    ];
    for (const ct of compTypes) {
      expect(getLessonByComponentType(ct)).toBeDefined();
    }
  });

  it("provides full Interview Primer datasets and Break & Fix labs", () => {
    expect(DELIVERY_FRAMEWORK_STAGES).toHaveLength(4);
    for (const stage of DELIVERY_FRAMEWORK_STAGES) {
      expect(stage.plainExplanation?.trim().length).toBeGreaterThan(25);
    }
    expect(LATENCY_LADDER.length).toBeGreaterThanOrEqual(12);
    expect(CAPACITY_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(INTERVIEW_CASE_STUDIES).toHaveLength(15);
    for (const study of INTERVIEW_CASE_STUDIES) {
      expect(study.plainOverview?.trim().length).toBeGreaterThan(25);
    }
    expect(FLASHCARD_DECK.length).toBeGreaterThanOrEqual(40);
    for (const card of FLASHCARD_DECK) {
      expect(card.simpleHint?.trim().length).toBeGreaterThan(15);
    }
    expect(Object.keys(BREAK_AND_FIX_LABS)).toHaveLength(3);
    for (const lab of Object.values(BREAK_AND_FIX_LABS)) {
      expect(lab.labGoalPlainEnglish?.trim().length).toBeGreaterThan(25);
      expect(lab.starterYamlSnippet?.trim().length).toBeGreaterThan(15);
    }
    expect(getLabById("lab-dual-write-outbox")?.targetRuleIds).toContain("DATA-001");
  });

  it("supports interview mode formatting, search, and rank progression", () => {
    const card = getLearningCard("outbox")!;
    const interviewText = formatLearningCard(card, "interview");
    expect(interviewText).toContain("[Interview Mode]");
    expect(interviewText).toContain("Senior / Staff Interview Hooks");

    const lesson = getLessonById("cap");
    expect(lesson?.id).toBe("lesson-cap-pacelc");

    const hits = searchCurriculum("Snowflake");
    expect(hits.lessons.some((l) => l.id === "lesson-unique-id-snowflake")).toBe(true);

    const rankStart = getRankForXp(0);
    const rankMax = getRankForXp(2000);
    expect(rankStart.current.title).toBe(ACADEMY_RANK_TIERS[0].title);
    expect(rankMax.current.title).toBe("Systems Grandmaster");
    expect(rankMax.progressPercent).toBe(100);
  });

  it("excludes third-party course and prep-website names across ArchBench Academy datasets", () => {
    const serialized = JSON.stringify({
      CURRICULUM_TRACKS,
      ALL_LESSONS,
      BREAK_AND_FIX_LABS,
      DELIVERY_FRAMEWORK_STAGES,
      LATENCY_LADDER,
      INTERVIEW_CASE_STUDIES,
      FLASHCARD_DECK,
      LEARNING_CATALOG,
    });
    expect(serialized).not.toMatch(
      /\b(bytebytego|hellointerview|hello interview|educative|grokking|designgurus|design gurus|system design primer|algoexpert|interviewbit|neetcode|ddia)\b/i
    );
  });
});
