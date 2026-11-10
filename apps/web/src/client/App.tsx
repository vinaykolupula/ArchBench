import React, { useState } from "react";
import { useArchBench } from "./context/ArchBenchContext.js";
import { TopologyCanvas } from "./components/canvas/TopologyCanvas.js";
import { ComponentInspector } from "./components/inspector/ComponentInspector.js";
import { HealthDashboard } from "./components/dashboard/HealthDashboard.js";
import { JustEnoughView } from "./components/complexity/JustEnoughView.js";
import { ScenarioSimulatorView } from "./components/simulator/ScenarioSimulatorView.js";
import { ComparisonView } from "./components/comparison/ComparisonView.js";
import { SpecEditorView } from "./components/editor/SpecEditorView.js";
import { ExportModal } from "./components/export/ExportModal.js";
import { SystemDesignIntakeModal } from "./components/intake/SystemDesignIntakeModal.js";
import { BenchmarkComparisonMatrixView } from "./components/intake/BenchmarkComparisonMatrixView.js";
import {
  Boxes,
  Activity,
  Sparkles,
  Flame,
  Scale,
  Code,
  Download,
  ChevronDown,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Trophy,
} from "lucide-react";

export const App: React.FC = () => {
  const {
    specs,
    selectedSpecPath,
    setSelectedSpecPath,
    evaluation,
    activeAltId,
    setActiveAltId,
    activeTab,
    setActiveTab,
    selectedNode,
    selectedEdge,
    synthesisResult,
    loadSynthesizedArchitecture,
  } = useArchBench();

  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState<boolean>(false);

  const activeAlt = evaluation?.evaluation?.alternatives?.[activeAltId];
  const score = activeAlt?.score ?? activeAlt?.summary?.score ?? 100;
  const passed = activeAlt?.passed ?? (score >= 90);
  const criticalCount = activeAlt?.summary?.criticalCount ?? 0;

  const alternatives = evaluation?.evaluation?.alternatives || {};
  const altKeys = Object.keys(alternatives);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121316] text-zinc-200 select-none">
      {/* Top Studio Header - Brushed Grey Chrome Chassis */}
      <header className="h-14 border-b border-zinc-800/80 bg-gradient-to-b from-[#21242b] via-[#1a1c22] to-[#15171b] px-4 flex items-center justify-between z-40 shrink-0 shadow-lg shadow-black/40 gap-3 overflow-x-auto">
        {/* Brand & Architecture Selector */}
        <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-600 text-zinc-950 flex items-center justify-center shadow-md border border-white/60 shrink-0">
              <Layers className="w-4 h-4 text-zinc-950" />
            </div>
            <div className="hidden sm:block shrink-0">
              <div className="flex items-center space-x-1.5 whitespace-nowrap">
                <span className="font-extrabold text-xs tracking-wider text-zinc-100 font-mono uppercase">ArchBench</span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 bg-zinc-800/80 text-zinc-300 border border-zinc-700/80 rounded">
                  DRAFT
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 block font-mono whitespace-nowrap">v0.1.0 • HLD Precision Engine</span>
            </div>
          </div>

          <div className="h-5 w-px bg-zinc-700/60 shrink-0" />

          {/* Architecture Spec Selector */}
          <div className="relative flex items-center shrink-0">
            <FolderOpen className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedSpecPath}
              onChange={(e) => setSelectedSpecPath(e.target.value)}
              className="appearance-none bg-[#191b20] hover:bg-[#20232a] border border-zinc-700/80 hover:border-zinc-500 rounded-lg pl-8 pr-8 py-1.5 text-xs font-mono font-medium text-zinc-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 max-w-[170px] sm:max-w-xs truncate transition-all shadow-inner"
            >
              {specs.map((s) => (
                <option key={s.path} value={s.path} className="bg-zinc-900 text-zinc-200 font-mono">
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Dynamic Intake Studio Action Button */}
          <button
            onClick={() => setIsIntakeOpen(true)}
            className="flex items-center space-x-1.5 chrome-button px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 whitespace-nowrap"
            title="Design a new system architecture using requirements intake or iconic presets"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span className="whitespace-nowrap">Design System</span>
          </button>

          {/* Alternative Selector (if > 1) */}
          {altKeys.length > 1 && (
            <div className="relative hidden md:flex items-center shrink-0">
              <select
                value={activeAltId}
                onChange={(e) => setActiveAltId(e.target.value)}
                className="appearance-none bg-[#20232a] hover:bg-[#282c35] border border-zinc-700 rounded-lg pl-3 pr-7 py-1.5 text-xs text-zinc-200 font-mono font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 max-w-[190px] truncate transition-all shadow-inner"
              >
                {altKeys.map((key) => (
                  <option key={key} value={key} className="bg-zinc-900 text-zinc-200 font-mono">
                    Alt: {alternatives[key]?.alternativeName || key}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs - Machined Metal Rack */}
        <nav className="flex items-center space-x-1 bg-[#131519] border border-zinc-800 p-1 rounded-xl text-xs shadow-inner shrink-0">
          <button
            onClick={() => setActiveTab("canvas")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-wider ${
              activeTab === "canvas"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Topology</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-wider ${
              activeTab === "dashboard"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Health</span>
            {criticalCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("complexity")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-wider ${
              activeTab === "complexity"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">JustEnough</span>
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-wider ${
              activeTab === "simulator"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-zinc-300" />
            <span className="hidden md:inline">Stress Lab</span>
          </button>
          {synthesisResult && (
            <button
              onClick={() => setActiveTab("matrix")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-wider ${
                activeTab === "matrix"
                  ? "bg-gradient-to-b from-[#444a56] to-[#282c35] text-zinc-100 font-bold shadow-md border border-zinc-400/80 ring-1 ring-white/20"
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-zinc-300" />
              <span className="hidden md:inline">Benchmark</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab("comparison")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-wider ${
              activeTab === "comparison"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Compare</span>
          </button>
          <button
            onClick={() => setActiveTab("editor")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-wider ${
              activeTab === "editor"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden md:inline">YAML</span>
          </button>
        </nav>

        {/* Right: Technical Health Seal & Machined Export Button */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 whitespace-nowrap">
          <div
            onClick={() => setActiveTab("dashboard")}
            className={`cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all shrink-0 whitespace-nowrap ${
              passed && score >= 90
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40 shadow-sm"
                : score >= 70
                ? "bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40"
                : "bg-red-950/40 text-red-300 border-red-800/60 hover:bg-red-900/40"
            }`}
            title="Architecture Health Score"
          >
            {passed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span>SCORE: {score} / 100</span>
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center space-x-1.5 chrome-button px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="whitespace-nowrap">Export</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 h-full overflow-hidden relative">
          {activeTab === "canvas" && <TopologyCanvas />}
          {activeTab === "dashboard" && <HealthDashboard />}
          {activeTab === "complexity" && <JustEnoughView />}
          {activeTab === "simulator" && <ScenarioSimulatorView />}
          {activeTab === "comparison" && <ComparisonView />}
          {activeTab === "matrix" && synthesisResult && (
            <BenchmarkComparisonMatrixView
              synthesisResult={synthesisResult}
              onOpenIntakeModal={() => setIsIntakeOpen(true)}
            />
          )}
          {activeTab === "editor" && <SpecEditorView />}
        </div>

        {/* Side Inspector (Component / Connection) */}
        {activeTab === "canvas" && (selectedNode || selectedEdge) && <ComponentInspector />}
      </main>

      {/* System Design Intake Studio Modal */}
      <SystemDesignIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onSynthesisComplete={async (result) => {
          await loadSynthesizedArchitecture(result);
          setActiveTab("matrix");
        }}
      />

      {/* Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
};
