import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ALL_LESSONS,
  InteractiveSimId,
  getRankForXp,
} from "@archbench/learning-mode";

const STORAGE_KEY = "archbench_academy_v1";

export interface LearnProgressState {
  xp: number;
  completedLessonIds: string[];
  solvedQuizIds: string[];
  solvedLabIds: string[];
  completedSims: InteractiveSimId[];
  masteredFlashcardIds: string[];
  lastActiveLessonId: string;
}

const DEFAULT_PROGRESS: LearnProgressState = {
  xp: 0,
  completedLessonIds: [],
  solvedQuizIds: [],
  solvedLabIds: [],
  completedSims: [],
  masteredFlashcardIds: [],
  lastActiveLessonId: ALL_LESSONS[0]?.id || "lesson-zero-to-millions",
};

function loadInitialProgress(): LearnProgressState {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      completedLessonIds: Array.isArray(parsed.completedLessonIds)
        ? parsed.completedLessonIds
        : [],
      solvedQuizIds: Array.isArray(parsed.solvedQuizIds)
        ? parsed.solvedQuizIds
        : [],
      solvedLabIds: Array.isArray(parsed.solvedLabIds)
        ? parsed.solvedLabIds
        : [],
      completedSims: Array.isArray(parsed.completedSims)
        ? parsed.completedSims
        : [],
      masteredFlashcardIds: Array.isArray(parsed.masteredFlashcardIds)
        ? parsed.masteredFlashcardIds
        : [],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function useLearnProgress() {
  const [progress, setProgress] = useState<LearnProgressState>(loadInitialProgress);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota / private mode failures gracefully
    }
  }, [progress]);

  const setLastActiveLesson = useCallback((lessonId: string) => {
    setProgress((prev) =>
      prev.lastActiveLessonId === lessonId
        ? prev
        : { ...prev, lastActiveLessonId: lessonId }
    );
  }, []);

  const markLessonComplete = useCallback((lessonId: string, xpReward: number) => {
    setProgress((prev) => {
      if (prev.completedLessonIds.includes(lessonId)) return prev;
      return {
        ...prev,
        xp: prev.xp + Math.max(0, xpReward),
        completedLessonIds: [...prev.completedLessonIds, lessonId],
      };
    });
  }, []);

  const recordQuizSolved = useCallback((quizId: string, xpReward: number) => {
    setProgress((prev) => {
      if (prev.solvedQuizIds.includes(quizId)) return prev;
      return {
        ...prev,
        xp: prev.xp + Math.max(0, xpReward),
        solvedQuizIds: [...prev.solvedQuizIds, quizId],
      };
    });
  }, []);

  const markLabSolved = useCallback((labId: string, xpReward: number) => {
    setProgress((prev) => {
      if (prev.solvedLabIds.includes(labId)) return prev;
      return {
        ...prev,
        xp: prev.xp + Math.max(0, xpReward),
        solvedLabIds: [...prev.solvedLabIds, labId],
      };
    });
  }, []);

  const markSimExplored = useCallback((simId: InteractiveSimId, xpReward = 20) => {
    setProgress((prev) => {
      if (prev.completedSims.includes(simId)) return prev;
      return {
        ...prev,
        xp: prev.xp + xpReward,
        completedSims: [...prev.completedSims, simId],
      };
    });
  }, []);

  const setFlashcardMastered = useCallback(
    (cardId: string, mastered: boolean) => {
      setProgress((prev) => {
        const exists = prev.masteredFlashcardIds.includes(cardId);
        if (mastered && !exists) {
          return {
            ...prev,
            xp: prev.xp + 5,
            masteredFlashcardIds: [...prev.masteredFlashcardIds, cardId],
          };
        }
        if (!mastered && exists) {
          return {
            ...prev,
            masteredFlashcardIds: prev.masteredFlashcardIds.filter(
              (id) => id !== cardId
            ),
          };
        }
        return prev;
      });
    },
    []
  );

  const exportProgressJson = useCallback(() => {
    return JSON.stringify(progress, null, 2);
  }, [progress]);

  const importProgressJson = useCallback((rawJson: string): boolean => {
    try {
      const parsed = JSON.parse(rawJson);
      if (typeof parsed.xp !== "number") return false;
      setProgress({
        ...DEFAULT_PROGRESS,
        ...parsed,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  const rankInfo = useMemo(() => getRankForXp(progress.xp), [progress.xp]);

  return useMemo(
    () => ({
      progress,
      rankInfo,
      setLastActiveLesson,
      markLessonComplete,
      recordQuizSolved,
      markLabSolved,
      markSimExplored,
      setFlashcardMastered,
      exportProgressJson,
      importProgressJson,
      resetProgress,
    }),
    [
      progress,
      rankInfo,
      setLastActiveLesson,
      markLessonComplete,
      recordQuizSolved,
      markLabSolved,
      markSimExplored,
      setFlashcardMastered,
      exportProgressJson,
      importProgressJson,
      resetProgress,
    ]
  );
}

