import React, { useState } from "react";
import { DeliveryFrameworkCoach } from "./DeliveryFrameworkCoach.js";
import { CapacityEstimatorAndLatency } from "./CapacityEstimatorAndLatency.js";
import { CaseStudyPlaybooks } from "./CaseStudyPlaybooks.js";
import { FlashcardDrillView } from "./FlashcardDrillView.js";
import { Compass, Calculator, BookCopy, Brain } from "lucide-react";

type PrimerSubTab = "framework" | "estimator" | "cases" | "flashcards";

interface Props {
  masteredFlashcardIds: string[];
  onSetFlashcardMastered: (cardId: string, mastered: boolean) => void;
}

export const InterviewPrimerView: React.FC<Props> = ({
  masteredFlashcardIds,
  onSetFlashcardMastered,
}) => {
  const [subTab, setSubTab] = useState<PrimerSubTab>("framework");

  const tabs: Array<{ id: PrimerSubTab; label: string; icon: React.ReactNode }> = [
    {
      id: "framework",
      label: "1. 4-Step Delivery Coach",
      icon: <Compass className="w-3.5 h-3.5" />,
    },
    {
      id: "estimator",
      label: "2. BOE Math & Latency Ladder",
      icon: <Calculator className="w-3.5 h-3.5" />,
    },
    {
      id: "cases",
      label: "3. 15 Interview Case Studies",
      icon: <BookCopy className="w-3.5 h-3.5" />,
    },
    {
      id: "flashcards",
      label: "4. 42-Card Anki Drill",
      icon: <Brain className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="h-full flex flex-col gap-4 font-mono">
      {/* Primer Navigation Pills */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border cursor-pointer transition-all ${
              subTab === t.id
                ? "chrome-button-accent"
                : "bg-[#16181e] text-zinc-400 border-zinc-800 hover:text-zinc-200"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Primer Active Workspace */}
      <div className="flex-1 overflow-y-auto pr-1 pb-8">
        {subTab === "framework" && <DeliveryFrameworkCoach />}
        {subTab === "estimator" && <CapacityEstimatorAndLatency />}
        {subTab === "cases" && <CaseStudyPlaybooks />}
        {subTab === "flashcards" && (
          <FlashcardDrillView
            masteredIds={masteredFlashcardIds}
            onSetMastered={onSetFlashcardMastered}
          />
        )}
      </div>
    </div>
  );
};

