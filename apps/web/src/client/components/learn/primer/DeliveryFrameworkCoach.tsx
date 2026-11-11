import React, { useEffect, useState } from "react";
import { DELIVERY_FRAMEWORK_STAGES } from "@archbench/learning-mode";
import { RichInlineText } from "../RichInlineText.js";
import {
  Clock,
  CheckSquare,
  Square,
  MessageSquareQuote,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
} from "lucide-react";

export const DeliveryFrameworkCoach: React.FC = () => {
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(45 * 60);

  useEffect(() => {
    if (!timerRunning) return;
    const handle = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(handle);
  }, [timerRunning]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const stage = DELIVERY_FRAMEWORK_STAGES[activeStageIdx];

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-5 font-mono">
      {/* Pacing Timer Bar */}
      <div className="chrome-chassis border border-zinc-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-zinc-400">
            45-Minute Interview Delivery Coach
          </div>
          <div className="text-xs text-zinc-200 font-bold">
            Master strict time-boxing so deep-dives happen before minute 42
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#111317] border border-zinc-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-extrabold text-emerald-300">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
          </div>
          <button
            onClick={() => setTimerRunning((r) => !r)}
            className="chrome-button-accent px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
          >
            {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{timerRunning ? "Pause" : "Start Mock"}</span>
          </button>
          <button
            onClick={() => {
              setTimerRunning(false);
              setSecondsLeft(45 * 60);
            }}
            className="chrome-button p-1.5 rounded-lg cursor-pointer"
            title="Reset 45m clock"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Stage Timeline Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {DELIVERY_FRAMEWORK_STAGES.map((st, idx) => {
          const isActive = idx === activeStageIdx;
          const total = st.checklist.length;
          const done = st.checklist.filter(
            (_, cIdx) => checkedItems[`${st.id}-${cIdx}`]
          ).length;

          return (
            <button
              key={st.id}
              onClick={() => setActiveStageIdx(idx)}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                isActive
                  ? "chrome-button-accent"
                  : "bg-[#16181e] border-zinc-800 hover:border-zinc-700 text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="uppercase">Step {st.stepNumber}</span>
                <span className="px-1.5 py-0.5 rounded bg-black/30">{st.timeBudgetMinutes}</span>
              </div>
              <div className="text-xs font-extrabold">{st.title}</div>
              <div className="text-[10px] opacity-80">
                Checklist: {done} / {total}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Deep Playbook */}
      <div className="paper-card drafting-corners bg-[#16181e] border border-zinc-700/80 rounded-2xl p-5 space-y-4">
        <div className="border-b border-zinc-800 pb-3 space-y-2">
          <div className="text-[10px] uppercase font-bold text-emerald-400">
            Time Budget: {stage.timeBudgetMinutes}
          </div>
          <h3 className="text-base font-extrabold text-zinc-100 mt-0.5">
            Step {stage.stepNumber}: {stage.title}
          </h3>
          {stage.plainExplanation && (
            <div className="bg-sky-950/30 border border-sky-800/60 rounded-xl p-3 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div className="font-sans text-[13px] text-zinc-100 leading-relaxed">
                <span className="font-mono text-[10px] uppercase font-bold text-sky-300 mr-1.5">
                  In Plain English:
                </span>
                <RichInlineText text={stage.plainExplanation} />
              </div>
            </div>
          )}
          <p className="font-sans text-xs text-zinc-300 mt-1 leading-relaxed">
            <RichInlineText text={stage.objective} />
          </p>
        </div>

        {/* Interactive Checklist */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-bold text-zinc-400">
            Execution Checklist
          </div>
          {stage.checklist.map((item, idx) => {
            const key = `${stage.id}-${idx}`;
            const checked = !!checkedItems[key];
            return (
              <button
                key={key}
                onClick={() => toggleCheck(key)}
                className={`w-full text-left flex items-start gap-2.5 p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  checked
                    ? "bg-emerald-950/30 border-emerald-800/70 text-emerald-200"
                    : "bg-[#111317] border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {checked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                )}
                <span className="font-sans text-xs leading-relaxed">
                  <RichInlineText text={item} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Out-loud Phrase & Time Trap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#111317] border border-zinc-800 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase">
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>What Strong Candidates Say Out Loud</span>
            </div>
            <p className="font-sans text-zinc-200 italic text-xs leading-relaxed">
              <RichInlineText text={stage.whatToSayOutLoud} />
            </p>
          </div>

          <div className="bg-amber-950/20 border border-amber-800/60 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Classic Time Trap to Avoid</span>
            </div>
            <p className="font-sans text-zinc-300 text-xs leading-relaxed">
              <RichInlineText text={stage.timeTrapToAvoid} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

