import React, { useMemo, useState } from "react";
import {
  ALL_LESSONS,
  CURRICULUM_TRACKS,
  getLessonById,
  getLessonsByTrack,
  searchCurriculum,
} from "@archbench/learning-mode";
import { useArchBench } from "../../context/ArchBenchContext.js";
import { LessonWorkspace } from "./LessonWorkspace.js";
import { SimulationSandboxView } from "./SimulationSandboxView.js";
import { InterviewPrimerView } from "./primer/InterviewPrimerView.js";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  FlaskConical,
  GraduationCap,
  RotateCcw,
  Search,
  Target,
} from "lucide-react";

export const LearnStudioView: React.FC = () => {
  const {
    selectedLessonId,
    setSelectedLessonId,
    learnSubView,
    setLearnSubView,
    learn,
  } = useArchBench();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedTrackId, setExpandedTrackId] = useState<string>("track-foundations");

  const activeLesson = useMemo(() => {
    return getLessonById(selectedLessonId) || ALL_LESSONS[0];
  }, [selectedLessonId]);

  const effectiveExpandedTrackId = activeLesson?.trackId || expandedTrackId;

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchCurriculum(searchQuery);
  }, [searchQuery]);

  const { progress, rankInfo } = learn;

  const handleExportProgress = () => {
    const json = learn.exportProgressJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "archbench-academy-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#0f1115] text-zinc-100 font-mono">
      {/* Academy Header & Rank Telemetry Strip */}
      <div className="shrink-0 px-5 pt-4 pb-3 border-b border-zinc-800/80 bg-[#13151a] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-10 h-10 rounded-xl chrome-chassis border border-zinc-700 flex items-center justify-center text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold uppercase tracking-wider text-zinc-100">
                ArchBench Academy
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-300 font-bold">
                {rankInfo.current.badgeCode} • {rankInfo.current.title}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-400">
              <span className="text-amber-300 font-bold">{progress.xp} XP</span>
              <div className="w-28 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-emerald-400 transition-all"
                  style={{ width: `${rankInfo.progressPercent}%` }}
                />
              </div>
              {rankInfo.next && (
                <span>
                  Next: {rankInfo.next.title} ({rankInfo.next.minXp} XP)
                </span>
              )}
              <span className="hidden sm:inline text-zinc-500">•</span>
              <span className="hidden sm:inline">
                {progress.completedLessonIds.length}/{ALL_LESSONS.length} Lessons
              </span>
              <span className="hidden sm:inline">
                {progress.solvedLabIds.length}/3 Labs
              </span>
            </div>
          </div>
        </div>

        {/* Mode Switcher + Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#0d0f13] border border-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setLearnSubView("curriculum")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer ${
                learnSubView === "curriculum"
                  ? "chrome-button-accent"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tracks &amp; Labs</span>
            </button>
            <button
              onClick={() => setLearnSubView("primer")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer ${
                learnSubView === "primer"
                  ? "chrome-button-accent"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Interview Primer</span>
            </button>
            <button
              onClick={() => setLearnSubView("sandbox")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer ${
                learnSubView === "sandbox"
                  ? "chrome-button-accent"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>10 Simulators</span>
            </button>
          </div>

          <button
            onClick={handleExportProgress}
            className="chrome-button p-2 rounded-lg text-zinc-300 cursor-pointer"
            title="Export Academy Progress JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (window.confirm("Reset all ArchBench Academy XP and progress?")) {
                learn.resetProgress();
              }
            }}
            className="chrome-button p-2 rounded-lg text-zinc-400 hover:text-red-300 cursor-pointer"
            title="Reset Academy Progress"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 overflow-hidden p-4 md:p-5">
        {learnSubView === "curriculum" && (
          <div className="h-full flex flex-col lg:flex-row gap-5">
            {/* Tracks Sidebar */}
            <aside className="lg:w-80 shrink-0 flex flex-col h-full overflow-hidden">
              <div className="relative mb-3 shrink-0">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lessons, CAP, DATA-001..."
                  className="w-full bg-[#16181e] border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-6">
                {searchResults ? (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold px-1">
                      Search Matches ({searchResults.lessons.length})
                    </div>
                    {searchResults.lessons.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          setSelectedLessonId(l.id);
                          learn.setLastActiveLesson(l.id);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs cursor-pointer ${
                          activeLesson.id === l.id
                            ? "chrome-button-accent"
                            : "bg-[#16181e] border-zinc-800 text-zinc-300"
                        }`}
                      >
                        <div className="font-bold">{l.title}</div>
                        <div className="text-[10px] opacity-75">{l.trackId}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  CURRICULUM_TRACKS.map((track) => {
                    const trackLessons = getLessonsByTrack(track.id);
                    const isOpen = track.id === effectiveExpandedTrackId;
                    const doneCount = trackLessons.filter((l) =>
                      progress.completedLessonIds.includes(l.id)
                    ).length;

                    return (
                      <div
                        key={track.id}
                        className="bg-[#15171d] border border-zinc-800/90 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setExpandedTrackId(track.id);
                            if (trackLessons[0] && activeLesson.trackId !== track.id) {
                              setSelectedLessonId(trackLessons[0].id);
                            }
                          }}
                          className="w-full text-left p-3 hover:bg-zinc-800/40 cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between text-[9px] font-bold uppercase">
                            <span className="text-emerald-400">{track.badge}</span>
                            <span className="text-zinc-400 flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-400" />
                              {doneCount}/{trackLessons.length}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold text-zinc-100 leading-snug">
                            {track.title}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-zinc-800/80 p-1.5 space-y-1 bg-[#111317]">
                            {trackLessons.map((lesson) => {
                              const isCurrent = lesson.id === activeLesson.id;
                              const isDone = progress.completedLessonIds.includes(lesson.id);
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => {
                                    setSelectedLessonId(lesson.id);
                                    learn.setLastActiveLesson(lesson.id);
                                  }}
                                  className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                    isCurrent
                                      ? "bg-zinc-800 text-zinc-100 font-bold border border-zinc-600"
                                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70"
                                  }`}
                                >
                                  <span className="truncate">
                                    {lesson.order}. {lesson.title}
                                  </span>
                                  {isDone && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Right Active Lesson Scroll Pane */}
            <section className="flex-1 h-full overflow-y-auto pr-1">
              {activeLesson && (
                <LessonWorkspace
                  lesson={activeLesson}
                  isCompleted={progress.completedLessonIds.includes(activeLesson.id)}
                  solvedQuizIds={progress.solvedQuizIds}
                  solvedLabIds={progress.solvedLabIds}
                  onCompleteLesson={learn.markLessonComplete}
                  onQuizSolved={learn.recordQuizSolved}
                  onSimExplored={(simId) => learn.markSimExplored(simId)}
                />
              )}
            </section>
          </div>
        )}

        {learnSubView === "sandbox" && (
          <SimulationSandboxView
            completedSims={progress.completedSims}
            onExploreSim={(simId) => learn.markSimExplored(simId)}
          />
        )}

        {learnSubView === "primer" && (
          <InterviewPrimerView
            masteredFlashcardIds={progress.masteredFlashcardIds}
            onSetFlashcardMastered={learn.setFlashcardMastered}
          />
        )}
      </div>
    </div>
  );
};

