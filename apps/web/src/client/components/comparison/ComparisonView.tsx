import React from "react";
import { useArchBench } from "../../context/ArchBenchContext.js";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Cpu,
  Network,
  Database,
  Target,
  Check,
} from "lucide-react";

export const ComparisonView: React.FC = () => {
  const { evaluation, activeAltId, setActiveAltId, setActiveTab } = useArchBench();
  const alternatives = evaluation?.evaluation?.alternatives || {};
  const altEntries = Object.entries(alternatives);

  if (altEntries.length === 0) {
    return (
      <div className="p-12 text-center font-mono text-xs uppercase tracking-wider text-zinc-500">
        // NO CANDIDATE ALTERNATIVES FOUND IN SPECIFICATION
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 overflow-y-auto h-full text-zinc-200">
      {/* Precision Header */}
      <div className="chrome-chassis rounded-xl p-6 border border-zinc-700/80 relative shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 text-zinc-400 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">
            <Scale className="w-3.5 h-3.5 text-zinc-300" />
            <span>// ARCHITECTURAL MATRIX // MULTI-ALTERNATIVE COMPARISON</span>
          </div>
          <h1 className="text-xl font-mono font-bold text-zinc-100 tracking-tight uppercase">
            Candidate Architecture Comparison
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Evaluate competing candidate architectures side-by-side to understand trade-offs in
            reliability, cognitive complexity, and operational footprint before building.
          </p>
        </div>
      </div>

      {/* Alternative Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {altEntries.map(([altId, alt]) => {
          const isActive = activeAltId === altId;
          const score = alt.score ?? alt.summary?.score ?? 100;
          const passed = alt.passed ?? (score >= 90);
          const { criticalCount, warningCount, requirementCoverage } = alt.summary;
          const coveragePct = requirementCoverage?.percentage ?? 100;
          const vector = alt.justEnough?.complexityVector;

          return (
            <div
              key={altId}
              className={`paper-card drafting-corners rounded-xl p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? "border-zinc-400 ring-1 ring-zinc-400 shadow-xl shadow-black/40"
                  : "hover:border-zinc-600"
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      // CANDIDATE
                    </span>
                    <h3 className="font-mono font-bold text-sm text-zinc-100 mt-2 tracking-tight">
                      {alt.alternativeName || altId}
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-500">{altId}</span>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-mono font-bold text-zinc-200 bg-zinc-800 border border-zinc-600 px-2 py-0.5 rounded flex items-center space-x-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>[ACTIVE]</span>
                    </span>
                  )}
                </div>

                {/* Score Banner */}
                <div className="bg-[#121316] p-3.5 rounded-lg border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 font-mono font-bold block">
                      HEALTH SCORE
                    </span>
                    <span
                      className={`text-2xl font-black font-mono ${
                        score >= 90
                          ? "text-emerald-400"
                          : score >= 70
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {score} <span className="text-xs text-zinc-500 font-normal">/ 100</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-zinc-400 font-mono font-bold block">
                      STATUS
                    </span>
                    <span
                      className={`inline-flex items-center text-xs font-mono font-bold ${
                        passed ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {passed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> [PASS]
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> [RISKS]
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#14161a] p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px] uppercase font-mono font-semibold flex items-center">
                      <Target className="w-3 h-3 mr-1 text-zinc-400" /> Coverage
                    </span>
                    <span className="font-mono font-bold text-zinc-100 text-sm mt-0.5 block">
                      {coveragePct}%
                    </span>
                  </div>
                  <div className="bg-[#14161a] p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px] uppercase font-mono font-semibold flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" /> Defects
                    </span>
                    <span className="font-mono font-bold text-zinc-100 text-sm mt-0.5 block">
                      {criticalCount}c / {warningCount}w
                    </span>
                  </div>
                </div>

                {/* Complexity Vector Breakdown */}
                {vector && (
                  <div className="space-y-1.5 pt-3 border-t border-zinc-800 text-xs text-zinc-400 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Boxes className="w-3 h-3 mr-1.5 text-zinc-400" /> Components
                      </span>
                      <span className="text-zinc-200 font-bold">
                        {vector.componentCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Cpu className="w-3 h-3 mr-1.5 text-zinc-400" /> Deployables
                      </span>
                      <span className="text-zinc-200 font-bold">
                        {vector.deployableCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Network className="w-3 h-3 mr-1.5 text-zinc-400" /> Network Hops
                      </span>
                      <span className="text-zinc-200 font-bold">
                        {vector.networkBoundaryCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Database className="w-3 h-3 mr-1.5 text-zinc-400" /> Stateful Stores
                      </span>
                      <span className="text-zinc-200 font-bold">
                        {vector.statefulStoreCount}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-5">
                {isActive ? (
                  <button
                    onClick={() => setActiveTab("canvas")}
                    className="w-full flex items-center justify-center space-x-2 chrome-button text-xs py-2 rounded-lg"
                  >
                    <span>View on Topology Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveAltId(altId);
                      setActiveTab("canvas");
                    }}
                    className="w-full flex items-center justify-center space-x-2 chrome-button-accent text-xs py-2 rounded-lg"
                  >
                    <span>Load Candidate Design</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
