import React from "react";
import {
  Trophy,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Cpu,
  Layers,
  DollarSign,
  Activity,
  Zap,
  Clock,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { SynthesisResult, SynthesizedAlternative } from "@archbench/synthesis";
import { useArchBench } from "../../context/ArchBenchContext.js";

interface BenchmarkComparisonMatrixViewProps {
  synthesisResult: SynthesisResult;
  onOpenIntakeModal: () => void;
}

export const BenchmarkComparisonMatrixView: React.FC<BenchmarkComparisonMatrixViewProps> = ({
  synthesisResult,
  onOpenIntakeModal,
}) => {
  const { loadSynthesizedArchitecture, setActiveTab } = useArchBench();
  const { verdict, alternatives, brief } = synthesisResult;

  const handleSelectAlternative = async (alt: SynthesizedAlternative) => {
    await loadSynthesizedArchitecture(synthesisResult, alt.id);
    setActiveTab("canvas");
  };

  const recommendedAlt =
    alternatives.find((a) => a.id === verdict.recommendedAlternativeId) || alternatives[0];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto drafting-dot-grid">
      {/* Header Banner - Architectural Blueprint Sheet Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              BLUEPRINT SPECIFICATION // MATRIX
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              TARGET: {brief.scaleTargets.peakRps.toLocaleString()} RPS • P99 &lt; {brief.scaleTargets.p99LatencyMs}ms
            </span>
          </div>
          <h1 className="text-xl font-mono font-bold text-zinc-100 tracking-tight mt-1 uppercase">
            {brief.name}
          </h1>
          <p className="text-xs font-mono text-zinc-400 max-w-3xl mt-1 leading-relaxed">
            {brief.description}
          </p>
        </div>

        <button
          onClick={onOpenIntakeModal}
          className="chrome-button flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all self-start md:self-auto cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
          <span>Calibrate / Re-Synthesize</span>
        </button>
      </div>

      {/* Top Architectural Verdict Card - Machined Grey Chrome Finish */}
      <div className="relative overflow-hidden p-6 rounded-2xl chrome-chassis bg-gradient-to-b from-[#24272f] via-[#1c1e24] to-[#15171b] border border-zinc-700/80 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Trophy className="w-48 h-48 text-zinc-100" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-100 shadow-inner">
              <Trophy className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                // ARCHITECTURAL VERDICT & RECOMMENDATION
              </span>
              <h2 className="text-base font-mono font-bold text-zinc-100 uppercase tracking-tight">
                {verdict.recommendationTitle}
              </h2>
            </div>
          </div>

          <p className="text-xs font-mono text-zinc-300 leading-relaxed max-w-4xl">
            {verdict.justification}
          </p>

          {/* Trade-offs & Evolution Triggers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {/* Trade-offs */}
            <div className="p-4 rounded-xl paper-card drafting-corners border border-zinc-700/80 bg-[#16181e] space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-300" />
                // ARCHITECTURAL TRADE-OFFS
              </div>
              <ul className="space-y-1.5 text-xs font-mono text-zinc-300">
                {verdict.keyTradeOffs.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-zinc-500 font-bold">[•]</span>
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Evolution Triggers */}
            <div className="p-4 rounded-xl paper-card drafting-corners border border-zinc-700/80 bg-[#16181e] space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                // SCALING EVOLUTION TRIGGERS
              </div>
              <div className="space-y-2 text-xs font-mono">
                {verdict.evolutionTriggers.map((trig, idx) => (
                  <div key={idx} className="text-[11px] pb-1.5 border-b border-zinc-800/80 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200">{trig.metric}</span>
                      <span className="text-amber-300 font-bold">{trig.threshold}</span>
                    </div>
                    <p className="text-zinc-400 mt-0.5 leading-relaxed">{trig.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => handleSelectAlternative(recommendedAlt)}
              className="chrome-button-accent flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow-lg cursor-pointer"
            >
              <span>Load Recommended Blueprint into Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Candidates Comparison Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-400" />
            // CANDIDATE ARCHITECTURES SIDE-BY-SIDE EVALUATION
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">
            3 contrasting archetypes evaluated deterministically via ArchEval & Graph Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alternatives.map((alt) => {
            const isRecommended = alt.id === verdict.recommendedAlternativeId;
            const m = alt.metrics;

            return (
              <div
                key={alt.id}
                className={`flex flex-col rounded-xl border paper-card drafting-corners transition-all ${
                  isRecommended
                    ? "bg-[#1d2028] border-zinc-400 ring-1 ring-white/20 shadow-2xl"
                    : "bg-[#16181e] border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Alternative Header */}
                <div className="p-4 border-b border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      [{alt.archetype.replace(/_/g, " ").toUpperCase()}]
                    </span>
                    {isRecommended && (
                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded bg-zinc-700 text-zinc-100 border border-zinc-500 flex items-center gap-1 shadow-sm">
                        <Trophy className="w-3 h-3 text-zinc-200" /> RECOMMENDED
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-mono font-bold text-zinc-100 leading-snug">{alt.name}</h4>
                  <p className="text-[11px] font-mono text-zinc-400 line-clamp-2 leading-relaxed">
                    {alt.description}
                  </p>

                  {/* Health Score Pill */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-lg font-bold text-zinc-100">{m.healthScore}</span>
                        <span className="text-[10px] text-zinc-500">/100</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
                          m.status === "passed"
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                            : "bg-amber-950/60 text-amber-300 border border-amber-800"
                        }`}
                      >
                        [{m.status.toUpperCase()}]
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400">
                      {alt.specAlternative.components.length} components
                    </span>
                  </div>
                </div>

                {/* Metrics Table Rows */}
                <div className="p-4 flex-1 space-y-2.5 text-xs font-mono">
                  {/* Throughput */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-zinc-400" /> Max Capacity
                    </span>
                    <span className="font-bold text-zinc-200">
                      {m.maxThroughputRps.toLocaleString()} RPS
                    </span>
                  </div>

                  {/* 10x Surge P99 Latency */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-zinc-400" /> 10x Surge P99
                    </span>
                    <span
                      className={`font-bold ${
                        m.latencySurgeP99Ms <= brief.scaleTargets.p99LatencyMs
                          ? "text-emerald-300"
                          : m.latencySurgeP99Ms <= brief.scaleTargets.p99LatencyMs * 2
                          ? "text-amber-300"
                          : "text-red-400"
                      }`}
                    >
                      {m.latencySurgeP99Ms} ms
                    </span>
                  </div>

                  {/* Queue Drain Time */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" /> Burst Drain Time
                    </span>
                    <span className="text-zinc-200">{m.queueDrainSeconds}s</span>
                  </div>

                  {/* Single Points of Failure */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" /> Graph SPOFs
                    </span>
                    <span
                      className={`font-bold ${
                        m.singlePointsOfFailureCount === 0 ? "text-emerald-300" : "text-amber-300"
                      }`}
                    >
                      {m.singlePointsOfFailureCount}
                    </span>
                  </div>

                  {/* Deployables */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-zinc-400" /> Nodes
                    </span>
                    <span className="text-zinc-300 text-[11px]">
                      {m.deployableCount} srv / {m.statefulStoreCount} db
                    </span>
                  </div>

                  {/* Monthly Cloud Spend */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-zinc-400" /> Est. Cloud Spend
                    </span>
                    <span className="font-bold text-zinc-200">
                      ${m.estimatedMonthlyCostUsd.toLocaleString()} / mo
                    </span>
                  </div>

                  {/* Cognitive Complexity */}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" /> Cognitive Load
                    </span>
                    <span className="font-bold text-zinc-200">
                      {m.cognitiveComplexity}
                    </span>
                  </div>

                  {/* Key Decisions */}
                  {alt.keyDecisions.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                        // KEY DECISIONS (ADRS)
                      </span>
                      <div className="space-y-1 mt-1">
                        {alt.keyDecisions.map((d, i) => (
                          <div
                            key={i}
                            className="text-[10px] font-mono text-zinc-300 bg-[#121317] p-1.5 rounded border border-zinc-800 line-clamp-1"
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-4 border-t border-zinc-800 bg-[#121418]">
                  <button
                    onClick={() => handleSelectAlternative(alt)}
                    className={`w-full py-2.5 px-3 text-xs font-mono font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isRecommended
                        ? "chrome-button-accent shadow-md"
                        : "chrome-button"
                    }`}
                  >
                    <span>Load Blueprint into Canvas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
