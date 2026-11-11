import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FLASHCARD_DECK, FlashcardCategory } from "@archbench/learning-mode";
import { RichInlineText } from "../RichInlineText.js";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  CheckCircle2,
  Shuffle,
  Layers,
  Lightbulb,
} from "lucide-react";

interface Props {
  masteredIds: string[];
  onSetMastered: (cardId: string, mastered: boolean) => void;
}

const CATEGORIES: Array<"All" | FlashcardCategory> = [
  "All",
  "Numbers & Math",
  "Storage & Cache",
  "Distributed Theory",
  "Senior Pattern Hooks",
];

export const FlashcardDrillView: React.FC<Props> = ({
  masteredIds,
  onSetMastered,
}) => {
  const [category, setCategory] = useState<"All" | FlashcardCategory>("All");
  const [index, setIndex] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);

  const deck = useMemo(() => {
    const filtered =
      category === "All"
        ? FLASHCARD_DECK
        : FLASHCARD_DECK.filter((c) => c.category === category);
    if (shuffleSeed === 0) return filtered;
    const copy = [...filtered];
    // Deterministic Fisher-Yates keyed off shuffleSeed
    let s = shuffleSeed;
    for (let i = copy.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [category, shuffleSeed]);

  const safeIdx = Math.min(index, Math.max(0, deck.length - 1));
  const card = deck[safeIdx];
  const isMastered = card ? masteredIds.includes(card.id) : false;

  const go = useCallback(
    (delta: number) => {
      setFlipped(false);
      setShowHint(false);
      setIndex((prev) => {
        const next = prev + delta;
        if (next < 0) return deck.length - 1;
        if (next >= deck.length) return 0;
        return next;
      });
    },
    [deck.length]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight") {
        go(1);
      } else if (e.key === "ArrowLeft") {
        go(-1);
      } else if (e.key.toLowerCase() === "h" && !flipped) {
        setShowHint((h) => !h);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, flipped]);

  if (!card) return null;

  return (
    <div className="space-y-5 font-mono max-w-3xl mx-auto">
      {/* Category Filters & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
                onClick={() => {
                setCategory(cat);
                setIndex(0);
                setFlipped(false);
                setShowHint(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
                category === cat
                  ? "chrome-button-accent"
                  : "bg-[#16181e] text-zinc-400 border-zinc-800 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setShuffleSeed((s) => s + 1);
            setIndex(0);
            setFlipped(false);
          }}
          className="chrome-button px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer self-start"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffle Deck</span>
        </button>
      </div>

      {/* Progress Readout */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> Card {safeIdx + 1} of {deck.length}
        </span>
        <span className="text-emerald-300 font-bold">
          Mastered: {masteredIds.length} / {FLASHCARD_DECK.length}
        </span>
      </div>

      {/* Interactive Flip Card */}
      <div
        onClick={() => setFlipped((f) => !f)}
        className="paper-card drafting-corners cursor-pointer select-none min-h-[250px] bg-[#16181e] border border-zinc-700/90 hover:border-zinc-500 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-lg"
      >
        <div className="flex items-center justify-between text-[10px] uppercase font-bold">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            {card.category}
          </span>
          <span className="flex items-center gap-1 text-zinc-400">
            <RotateCw className="w-3.5 h-3.5" />
            {flipped ? "ANSWER SIDE" : "CLICK CARD TO FLIP"}
          </span>
        </div>

        <div className="py-6 text-center space-y-4">
          {!flipped ? (
            <div className="space-y-4">
              <div className="font-sans text-lg sm:text-xl font-extrabold text-zinc-100 leading-relaxed">
                <RichInlineText text={card.front} />
              </div>

              {card.simpleHint && (
                <div>
                  {showHint ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="max-w-xl mx-auto bg-sky-950/35 border border-sky-800/70 rounded-xl p-3 font-sans text-xs text-sky-100 leading-relaxed"
                    >
                      <strong className="font-mono text-[10px] uppercase text-sky-300 mr-1.5">
                        Intuition Clue:
                      </strong>
                      <RichInlineText text={card.simpleHint} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      className="chrome-button px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase inline-flex items-center gap-1.5 text-amber-300 cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Peek Intuition Clue (H)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="font-sans text-sm font-bold text-emerald-300 leading-relaxed bg-[#111317] border border-emerald-800/50 rounded-xl p-4">
                <RichInlineText text={card.back} />
              </div>
              <div className="font-sans text-xs text-amber-200 bg-amber-950/25 border border-amber-800/50 rounded-xl p-3 leading-relaxed">
                <strong className="font-mono uppercase text-[10px] text-amber-400 block mb-0.5">
                  Staff Interview Tip
                </strong>
                <RichInlineText text={card.seniorTip} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span>Card ID: {card.id.toUpperCase()}</span>
          <span className="hidden sm:inline text-zinc-400">
            Space: flip • &larr;/&rarr;: next/prev • H: clue
          </span>
          <span>{isMastered ? "MARKED MASTERED" : "IN ACTIVE ROTATION"}</span>
        </div>
      </div>

      {/* Drill Navigation & Mastery Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => go(-1)}
          className="chrome-button px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onSetMastered(card.id, false);
              go(1);
            }}
            className="chrome-button px-4 py-2 rounded-xl text-xs font-bold uppercase text-amber-300 cursor-pointer"
          >
            Needs Review
          </button>
          <button
            onClick={() => {
              onSetMastered(card.id, true);
              go(1);
            }}
            className="chrome-button-accent px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isMastered ? "Keep Mastered" : "Got It (+5 XP)"}</span>
          </button>
        </div>

        <button
          onClick={() => go(1)}
          className="chrome-button px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

