import React, { useState } from "react";
import { InteractiveSimId } from "@archbench/learning-mode";
import {
  InteractiveSimulatorHost,
  SIMULATOR_CATALOG,
} from "./simulators/InteractiveSimulatorHost.js";
import { FlaskConical, CheckCircle2 } from "lucide-react";

interface Props {
  completedSims: InteractiveSimId[];
  onExploreSim: (simId: InteractiveSimId) => void;
}

export const SimulationSandboxView: React.FC<Props> = ({
  completedSims,
  onExploreSim,
}) => {
  const [activeSimId, setActiveSimId] = useState<InteractiveSimId>("zero-to-millions");
  const activeMeta =
    SIMULATOR_CATALOG.find((s) => s.id === activeSimId) || SIMULATOR_CATALOG[0];

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 font-mono">
      {/* Left Selector Rail */}
      <div className="lg:w-72 shrink-0 space-y-2 overflow-y-auto pr-1">
        <div className="text-[10px] uppercase font-bold text-zinc-400 px-1 pb-1">
          10 Visual Micro-Simulators ({completedSims.length}/10 Explored)
        </div>
        {SIMULATOR_CATALOG.map((sim) => {
          const isActive = sim.id === activeSimId;
          const isExplored = completedSims.includes(sim.id);
          return (
            <button
              key={sim.id}
              onClick={() => setActiveSimId(sim.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                isActive
                  ? "chrome-button-accent"
                  : "bg-[#16181e] border-zinc-800 hover:border-zinc-700 text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] uppercase font-bold opacity-75">
                  {sim.category}
                </span>
                {isExplored && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </div>
              <div className="text-xs font-bold">{sim.title}</div>
              <div className="text-[10px] opacity-80 leading-snug">{sim.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Right Interactive Workbench */}
      <div className="flex-1 overflow-y-auto">
        <div className="chrome-chassis drafting-corners rounded-2xl p-5 border border-zinc-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-extrabold text-zinc-100">{activeMeta.title}</h3>
                <p className="text-[11px] text-zinc-400">{activeMeta.subtitle}</p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded bg-[#131519] border border-zinc-700 text-amber-300 font-bold self-start">
              {completedSims.includes(activeSimId) ? "EXPLORED (+20 XP)" : "INTERACT FOR +20 XP"}
            </span>
          </div>

          <InteractiveSimulatorHost simId={activeSimId} onExplore={onExploreSim} />
        </div>
      </div>
    </div>
  );
};

