import React, { useState } from "react";
import { InteractiveSimId, SystemDesignLesson } from "@archbench/learning-mode";
import { useArchBench } from "../../context/ArchBenchContext.js";
import { EvolutionStepperSvg } from "./EvolutionStepperSvg.js";
import { InteractiveSimulatorHost } from "./simulators/InteractiveSimulatorHost.js";
import { RichInlineText } from "./RichInlineText.js";
import {
  Award,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Lightbulb,
  Play,
  ShieldAlert,
  Sparkles,
  Wrench,
  HelpCircle,
  Copy,
  Check,
  Tags,
} from "lucide-react";

interface Props {
  lesson: SystemDesignLesson;
  isCompleted: boolean;
  solvedQuizIds: string[];
  solvedLabIds: string[];
  onCompleteLesson: (lessonId: string, xp: number) => void;
  onQuizSolved: (quizId: string, xp: number) => void;
  onSimExplored: (simId: InteractiveSimId) => void;
}

export const LessonWorkspace: React.FC<Props> = ({
  lesson,
  isCompleted,
  solvedQuizIds,
  solvedLabIds,
  onCompleteLesson,
  onQuizSolved,
  onSimExplored,
}) => {
  const { loadCustomYamlIntoCanvas } = useArchBench();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showSolutionHint, setShowSolutionHint] = useState<Record<string, boolean>>({});
  const [copiedLabId, setCopiedLabId] = useState<string | null>(null);
  const [expandedTermIdx, setExpandedTermIdx] = useState<number | null>(null);

  const handleChooseQuizOption = (quizId: string, optionId: string, correctId: string, xp: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [quizId]: optionId }));
    if (optionId === correctId) {
      onQuizSolved(quizId, xp);
    }
  };

  const handleLaunchBreakLab = async () => {
    if (!lesson.lab) return;
    await loadCustomYamlIntoCanvas(
      lesson.lab.brokenArchSpecYaml,
      `Lab: ${lesson.lab.title}`,
      lesson.lab.id,
      "canvas",
      {
        labId: lesson.lab.id,
        lessonId: lesson.id,
        title: lesson.lab.title,
        missionBrief: lesson.lab.missionBrief,
        labGoalPlainEnglish: lesson.lab.labGoalPlainEnglish,
        starterYamlSnippet: lesson.lab.starterYamlSnippet,
        targetRuleIds: lesson.lab.targetRuleIds,
        startingScore: lesson.lab.startingScore,
        targetScore: lesson.lab.targetScore,
        hintSteps: lesson.lab.hintSteps,
        solutionSummary: lesson.lab.solutionSummary,
        solutionArchSpecYaml: lesson.lab.solutionArchSpecYaml,
        xpReward: lesson.lab.xpReward,
      }
    );
  };

  const handleLoadSolutionPreview = async () => {
    if (!lesson.lab) return;
    await loadCustomYamlIntoCanvas(
      lesson.lab.solutionArchSpecYaml,
      `Solution: ${lesson.lab.title}`,
      `${lesson.lab.id}-solution`,
      "canvas",
      null
    );
  };

  return (
    <div className="space-y-6 pb-10 font-mono">
      {/* Lesson Header Banner */}
      <div className="chrome-chassis drafting-corners rounded-2xl p-5 border border-zinc-700/80 space-y-3">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase font-bold">
              <span
                className={`px-2 py-0.5 rounded border ${
                  lesson.difficulty === "foundation"
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-700"
                    : lesson.difficulty === "intermediate"
                    ? "bg-sky-950/60 text-sky-300 border-sky-700"
                    : "bg-amber-950/60 text-amber-300 border-amber-700"
                }`}
              >
                {lesson.difficulty}
              </span>
              <span className="text-zinc-400">~{lesson.estimatedMinutes} MIN</span>
              <span className="text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                +{lesson.xpReward} XP
              </span>
              {lesson.ruleIds?.map((rid) => (
                <span
                  key={rid}
                  className="bg-zinc-800 text-zinc-200 border border-zinc-700 px-2 py-0.5 rounded"
                >
                  RULE: {rid}
                </span>
              ))}
            </div>

            <h2 className="text-lg md:text-xl font-extrabold text-zinc-100 tracking-tight">
              {lesson.title}
            </h2>
            <p className="text-xs text-zinc-400">{lesson.subtitle}</p>
          </div>

          <button
            onClick={() => onCompleteLesson(lesson.id, lesson.xpReward)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition-all ${
              isCompleted
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-700"
                : "chrome-button-accent"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? "Lesson Mastered" : "Complete Lesson"}</span>
          </button>
        </div>

        {/* Plain-English Everyday Analogy Banner */}
        {lesson.plainEnglishAnalogy && (
          <div className="bg-sky-950/30 border border-sky-800/70 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
              <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
              <span>Start Simple: Everyday Analogy</span>
            </div>
            <p className="font-sans text-[13px] text-zinc-100 leading-relaxed">
              <RichInlineText text={lesson.plainEnglishAnalogy} />
            </p>
          </div>
        )}

        {/* Summary + Why It Matters Paper Card */}
        <div className="paper-card bg-[#131519] border border-zinc-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">
              // Core Mental Model
            </div>
            <p className="font-sans text-[13px] text-zinc-200 leading-relaxed">
              <RichInlineText text={lesson.summary} />
            </p>
          </div>
          <div>
            <div className="text-[10px] text-amber-400 uppercase font-bold mb-1">
              // Why It Breaks Production
            </div>
            <p className="font-sans text-[13px] text-zinc-300 leading-relaxed">
              <RichInlineText text={lesson.whyItMatters} />
            </p>
          </div>
        </div>

        {/* Interactive Key Terms & Jargon Decoder */}
        {lesson.keyTerms && lesson.keyTerms.length > 0 && (
          <div className="bg-[#111317] border border-zinc-800/90 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Tags className="w-3.5 h-3.5 text-emerald-400" />
                <span>Key Terms &amp; Jargon Decoder</span>
              </span>
              <span className="text-zinc-500">Click any term to focus</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {lesson.keyTerms.map((kt, idx) => {
                const isSelected = expandedTermIdx === idx;
                return (
                  <button
                    key={kt.term}
                    onClick={() => setExpandedTermIdx(isSelected ? null : idx)}
                    className={`text-left rounded-lg border px-3 py-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-950/35 border-emerald-700/80"
                        : "bg-[#16181e] border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="text-[11px] font-bold text-emerald-300">
                      <RichInlineText text={kt.term} />
                    </div>
                    <div className="font-sans text-xs text-zinc-300 mt-0.5 leading-snug">
                      <RichInlineText text={kt.plainMeaning} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Progressive Evolution Visual Stepper */}
      {lesson.evolutionStages && lesson.evolutionStages.length > 0 && (
        <EvolutionStepperSvg stages={lesson.evolutionStages} />
      )}

      {/* Embedded Live Simulator */}
      {lesson.interactiveSim && (
        <div className="chrome-chassis border border-zinc-700/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-100">
                Interactive Engineering Micro-Simulator
              </h3>
            </div>
            <span className="text-[10px] text-emerald-300 bg-emerald-950/50 border border-emerald-800 px-2 py-0.5 rounded">
              LIVE LAB (+20 XP)
            </span>
          </div>
          <InteractiveSimulatorHost
            simId={lesson.interactiveSim}
            onExplore={onSimExplored}
          />
        </div>
      )}

      {/* Break & Fix Live Topology Lab */}
      {lesson.lab && (
        <div className="paper-card drafting-corners border border-amber-700/70 bg-[#1a1815] rounded-2xl p-5 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-amber-300">
                <Wrench className="w-3.5 h-3.5" />
                <span>Hands-On Topology Break &amp; Fix Mission</span>
                {solvedLabIds.includes(lesson.lab.id) && (
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded">
                    SOLVED (+{lesson.lab.xpReward} XP)
                  </span>
                )}
              </div>
              <h3 className="text-sm font-extrabold text-zinc-100">{lesson.lab.title}</h3>
              {lesson.lab.labGoalPlainEnglish && (
                <p className="font-sans text-[13px] text-amber-100/95 leading-relaxed max-w-2xl">
                  <strong className="text-amber-300 font-mono text-[10px] uppercase mr-1.5">
                    What You&apos;re Fixing:
                  </strong>
                  <RichInlineText text={lesson.lab.labGoalPlainEnglish} />
                </p>
              )}
              <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                <RichInlineText text={lesson.lab.missionBrief} />
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                onClick={handleLaunchBreakLab}
                className="chrome-button-accent px-4 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Launch Broken Spec</span>
              </button>
              <button
                onClick={handleLoadSolutionPreview}
                className="chrome-button px-3 py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Preview Clean Fix
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded text-zinc-300">
              Target Rules: <strong>{lesson.lab.targetRuleIds.join(", ")}</strong>
            </span>
            <span className="bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded text-zinc-300">
              Goal Score: <strong>{lesson.lab.targetScore} / 100</strong>
            </span>
            <button
              onClick={() =>
                setShowSolutionHint((p) => ({ ...p, [lesson.lab!.id]: !p[lesson.lab!.id] }))
              }
              className="text-amber-300 hover:underline cursor-pointer ml-auto"
            >
              {showSolutionHint[lesson.lab.id] ? "Hide Repair Steps" : "Show Repair Hints"}
            </button>
          </div>

          {showSolutionHint[lesson.lab.id] && (
            <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3.5 text-[11px] text-zinc-300 space-y-2">
              {lesson.lab.hintSteps.map((step, i) => (
                <div key={i} className="font-sans text-xs leading-relaxed">
                  <span className="text-amber-400 font-mono font-bold">{i + 1}. </span>
                  <RichInlineText text={step} />
                </div>
              ))}
              {lesson.lab.starterYamlSnippet && (
                <div className="bg-[#0b0d10] border border-zinc-800 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400">
                    <span>Copyable Starter YAML Snippet</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(lesson.lab!.starterYamlSnippet || "");
                        setCopiedLabId(lesson.lab!.id);
                        setTimeout(() => setCopiedLabId(null), 2000);
                      }}
                      className="chrome-button px-2 py-1 rounded flex items-center gap-1 cursor-pointer text-[9px]"
                    >
                      {copiedLabId === lesson.lab!.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Snippet</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                    {lesson.lab.starterYamlSnippet}
                  </pre>
                </div>
              )}
              <div className="text-emerald-300 pt-1.5 border-t border-zinc-800 font-sans text-xs">
                <strong className="font-mono text-[10px] uppercase">Solution Pattern:</strong>{" "}
                <RichInlineText text={lesson.lab.solutionSummary} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Core Entities Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase">
          <Sparkles className="w-4 h-4 text-zinc-400" />
          <span>Core Architectural Entities &amp; Building Blocks</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lesson.coreEntities.map((ent, idx) => (
            <div
              key={idx}
              className="paper-card bg-[#16181e] border border-zinc-800 rounded-xl p-4 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-zinc-100">{ent.name}</span>
                <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {ent.category}
                </span>
              </div>
              <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                <RichInlineText text={ent.responsibility} />
              </p>
              <div className="text-[11px] font-sans text-emerald-300/95 pt-1">
                <strong className="font-mono text-[10px] uppercase">Use when:</strong>{" "}
                <RichInlineText text={ent.whenToUse} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade-Off Matrix */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase">
          <BookOpen className="w-4 h-4 text-zinc-400" />
          <span>Architectural Trade-Off Comparison</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {lesson.tradeOffs.map((t, idx) => (
            <div
              key={idx}
              className="bg-[#16181e] border border-zinc-800 rounded-xl p-4 space-y-2 text-xs"
            >
              <div className="font-extrabold text-zinc-100 border-b border-zinc-800 pb-2">
                {t.approach}
              </div>
              <div className="space-y-1.5 font-sans text-xs">
                {t.pros.map((p, i) => (
                  <div key={i} className="text-emerald-300 leading-snug">
                    + <RichInlineText text={p} />
                  </div>
                ))}
                {t.cons.map((c, i) => (
                  <div key={i} className="text-amber-300 leading-snug">
                    - <RichInlineText text={c} />
                  </div>
                ))}
              </div>
              <div className="text-[11px] font-sans text-zinc-400 pt-1.5 border-t border-zinc-800/80">
                <strong className="font-mono text-[10px] uppercase text-zinc-300">Best For:</strong>{" "}
                <RichInlineText text={t.bestFor} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Senior / Staff Interview Hooks */}
      <div className="chrome-chassis border border-zinc-700/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-zinc-100">
          <Lightbulb className="w-4 h-4 text-amber-300" />
          <span>Senior / Staff Interview Signals</span>
        </div>
        <div className="space-y-3">
          {lesson.seniorInterviewHooks.map((h, idx) => (
            <div
              key={idx}
              className="bg-[#131519] border border-zinc-800 rounded-xl p-3.5 space-y-1.5 text-xs"
            >
              <div className="font-sans text-[13px] font-bold text-emerald-300 leading-relaxed">
                <span className="font-mono text-[10px] uppercase text-emerald-400 mr-1.5">
                  Say This:
                </span>
                <RichInlineText text={h.hook} />
              </div>
              <div className="font-sans text-xs text-zinc-300 leading-relaxed">
                <span className="font-mono text-[10px] uppercase text-zinc-400 font-bold mr-1">
                  Failure Prevented:
                </span>
                <RichInlineText text={h.failurePrevented} />
              </div>
              <div className="font-sans text-xs text-red-300 flex items-start gap-1.5 leading-relaxed">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-mono text-[10px] uppercase mr-1">Red Flag to Avoid:</strong>
                  <RichInlineText text={h.redFlagToAvoid} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Scenario Quiz */}
      <div className="chrome-chassis border border-zinc-700/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-zinc-100">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>Interactive Scenario Mastery Check</span>
          </div>
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            {lesson.quizzes.filter((q) => solvedQuizIds.includes(q.id)).length} /{" "}
            {lesson.quizzes.length} Solved
          </span>
        </div>

        <div className="space-y-4">
          {lesson.quizzes.map((quiz, qIdx) => {
            const chosen = selectedAnswers[quiz.id];
            const alreadySolved = solvedQuizIds.includes(quiz.id);

            return (
              <div
                key={quiz.id}
                className="bg-[#131519] border border-zinc-800 rounded-xl p-4 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-sans text-[13px] font-bold text-zinc-100 leading-relaxed">
                    <span className="font-mono text-sky-400 mr-1.5">Q{qIdx + 1}:</span>
                    <RichInlineText text={quiz.scenarioPrompt} />
                  </div>
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-bold">
                    {alreadySolved ? "EARNED" : `+${quiz.xpReward} XP`}
                  </span>
                </div>

                <div className="space-y-2">
                  {quiz.options.map((opt) => {
                    const isPicked = chosen === opt.id;
                    const isRight = opt.id === quiz.correctOptionId;
                    let cls =
                      "bg-[#1a1d24] border-zinc-700 text-zinc-300 hover:border-zinc-500";
                    if (isPicked) {
                      cls = isRight
                        ? "bg-emerald-950/60 border-emerald-600 text-emerald-200"
                        : "bg-red-950/60 border-red-700 text-red-200";
                    } else if (alreadySolved && isRight) {
                      cls = "bg-emerald-950/30 border-emerald-800 text-emerald-200";
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() =>
                          handleChooseQuizOption(
                            quiz.id,
                            opt.id,
                            quiz.correctOptionId,
                            quiz.xpReward
                          )
                        }
                        className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer space-y-1 ${cls}`}
                      >
                        <div className="font-sans font-semibold text-xs leading-snug">
                          <RichInlineText text={opt.label} />
                        </div>
                        {(isPicked || (alreadySolved && isRight)) && (
                          <div className="font-sans text-[11px] opacity-95 leading-relaxed pt-1.5 border-t border-white/10">
                            <RichInlineText text={opt.explanation} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Further Reading */}
      {lesson.furtherReading.length > 0 && (
        <div className="text-[11px] text-zinc-400 space-y-1 px-1">
          <div className="font-bold uppercase text-zinc-500">Further Study &amp; Classic Papers</div>
          {lesson.furtherReading.map((ref, i) => (
            <div key={i}>• {ref}</div>
          ))}
        </div>
      )}
    </div>
  );
};

