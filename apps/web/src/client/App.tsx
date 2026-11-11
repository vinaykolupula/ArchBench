import React, { useEffect, useState } from "react";
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
import { LearnStudioView } from "./components/learn/LearnStudioView.js";
import { HomeView } from "./components/home/HomeView.js";
import { BrowseDesignsView } from "./components/home/BrowseDesignsView.js";
import { BrandLogo } from "./components/common/BrandLogo.js";
import {
  Boxes,
  Activity,
  Sparkles,
  Flame,
  Scale,
  Code,
  Download,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Trophy,
  GraduationCap,
  Wrench,
  Compass,
  X,
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
    activeLab,
    setActiveLab,
    openLessonInLearn,
    setYamlContent,
    reEvaluate,
    learn,
  } = useArchBench();

  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState<boolean>(false);

  const activeAlt = evaluation?.evaluation?.alternatives?.[activeAltId];
  const score = activeAlt?.score ?? activeAlt?.summary?.score ?? 100;
  const passed = activeAlt?.passed ?? (score >= 90);
  const criticalCount = activeAlt?.summary?.criticalCount ?? 0;

  const alternatives = evaluation?.evaluation?.alternatives || {};
  const altKeys = Object.keys(alternatives);

  const activeFindings = activeAlt?.findings || [];
  const labTargetCleared =
    activeLab !== null &&
    selectedSpecPath === `academy:${activeLab.labId}` &&
    evaluation?.valid !== false &&
    score >= activeLab.targetScore &&
    activeLab.targetRuleIds.every(
      (rid) => !activeFindings.some((f) => (f.ruleId || f.testId) === rid)
    );

  useEffect(() => {
    if (activeLab && labTargetCleared) {
      learn.markLabSolved(activeLab.labId, activeLab.xpReward);
    }
  }, [activeLab, labTargetCleared, learn]);

  if (activeTab === "home") {
    return (
      <>
        <HomeView onOpenDesignIntake={() => setIsIntakeOpen(true)} />
        <SystemDesignIntakeModal
          isOpen={isIntakeOpen}
          onClose={() => setIsIntakeOpen(false)}
          onSynthesisComplete={async (result) => {
            await loadSynthesizedArchitecture(result);
            setActiveTab("matrix");
          }}
        />
        <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121316] text-zinc-200 select-none">
      {/* Top Studio Header - Brushed Grey Chrome Chassis */}
      <header className="h-14 border-b border-zinc-800/80 bg-gradient-to-b from-[#21242b] via-[#1a1c22] to-[#15171b] px-3 flex items-center justify-between z-40 shrink-0 shadow-lg shadow-black/40 gap-2 overflow-x-auto">
        {/* Brand & Architecture Selector */}
        <div className="flex items-center space-x-2 xl:space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            title="Return to ArchBench Home"
            className="flex items-center space-x-2 shrink-0 text-left cursor-pointer hover:opacity-90 transition-opacity"
          >
            <BrandLogo size="md" />
            <div className="hidden sm:block shrink-0">
              <div className="flex items-center space-x-1.5 whitespace-nowrap">
                <span className="font-extrabold text-xs tracking-wider text-zinc-100 font-mono uppercase">ArchBench</span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-1 py-0.5 bg-zinc-800/80 text-zinc-300 border border-zinc-700/80 rounded">
                  DRAFT
                </span>
              </div>
              <span className="hidden 2xl:block text-[10px] text-zinc-400 font-mono whitespace-nowrap">v0.1.0 • HLD Precision Engine</span>
            </div>
          </button>

          <div className="h-5 w-px bg-zinc-700/60 shrink-0" />

          {/* Architecture Spec Selector */}
          <div className="relative flex items-center shrink-0">
            <FolderOpen className="w-3.5 h-3.5 text-zinc-400 absolute left-2 pointer-events-none" />
            <select
              value={selectedSpecPath}
              onChange={(e) => setSelectedSpecPath(e.target.value)}
              className="appearance-none bg-[#191b20] hover:bg-[#20232a] border border-zinc-700/80 hover:border-zinc-500 rounded-lg pl-7 pr-5 py-1.5 text-xs font-mono font-medium text-zinc-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 max-w-[140px] 2xl:max-w-[190px] truncate transition-all shadow-inner"
            >
              {specs.map((s) => (
                <option key={s.path} value={s.path} className="bg-zinc-900 text-zinc-200 font-mono">
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-1.5 pointer-events-none" />
          </div>

          {/* Dynamic Intake Studio Action Button */}
          <button
            onClick={() => setIsIntakeOpen(true)}
            className="flex items-center space-x-1 chrome-button px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-tight transition-all cursor-pointer shrink-0 whitespace-nowrap"
            title="Design a new system architecture using requirements intake or iconic presets"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span className="hidden 2xl:inline whitespace-nowrap">Design System</span>
            <span className="2xl:hidden whitespace-nowrap">Design</span>
          </button>

          {/* Alternative Selector (if > 1) */}
          {altKeys.length > 1 && (
            <div className="relative hidden 2xl:flex items-center shrink-0">
              <select
                value={activeAltId}
                onChange={(e) => setActiveAltId(e.target.value)}
                className="appearance-none bg-[#20232a] hover:bg-[#282c35] border border-zinc-700 rounded-lg pl-2.5 pr-6 py-1.5 text-xs text-zinc-200 font-mono font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 max-w-[140px] truncate transition-all shadow-inner"
              >
                {altKeys.map((key) => (
                  <option key={key} value={key} className="bg-zinc-900 text-zinc-200 font-mono">
                    Alt: {alternatives[key]?.alternativeName || key}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-1.5 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs - Machined Metal Rack */}
        <nav className="flex items-center space-x-0.5 bg-[#131519] border border-zinc-800 p-1 rounded-xl text-xs shadow-inner shrink-0">
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex items-center space-x-1 px-2 2xl:px-2.5 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-tight ${
              activeTab === "browse"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Browse</span>
          </button>

          <button
            onClick={() => setActiveTab("canvas")}
            className={`flex items-center space-x-1 px-2 2xl:px-2.5 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-tight ${
              activeTab === "canvas"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Topology</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center space-x-1 px-2 2xl:px-2.5 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-tight ${
              activeTab === "dashboard"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Health</span>
            {criticalCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("complexity")}
            className={`flex items-center space-x-1 px-2 2xl:px-2.5 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-tight ${
              activeTab === "complexity"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">JustEnough</span>
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center space-x-1 px-2 2xl:px-2.5 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-tight ${
              activeTab === "simulator"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-zinc-300" />
            <span className="hidden lg:inline">Stress Lab</span>
          </button>
          {synthesisResult && (
            <button
              onClick={() => setActiveTab("matrix")}
              className={`flex items-center space-x-1 px-2 2xl:px-2.5 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-tight ${
                activeTab === "matrix"
                  ? "bg-gradient-to-b from-[#444a56] to-[#282c35] text-zinc-100 font-bold shadow-md border border-zinc-400/80 ring-1 ring-white/20"
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-zinc-300" />
              <span className="hidden lg:inline">Benchmark</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab("comparison")}
            className={`flex items-center space-x-1 px-2 2xl:px-2.5 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-tight ${
              activeTab === "comparison"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Compare</span>
          </button>
          <button
            onClick={() => setActiveTab("editor")}
            className={`flex items-center space-x-1 px-2 2xl:px-2.5 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-tight ${
              activeTab === "editor"
                ? "bg-gradient-to-b from-[#3a3e47] to-[#252830] text-zinc-100 font-bold shadow-md border border-zinc-500/60 ring-1 ring-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">YAML</span>
          </button>
          <button
            onClick={() => setActiveTab("learn")}
            className={`flex items-center space-x-1 px-2 2xl:px-2.5 py-1.5 rounded-lg transition-all font-mono text-[11px] uppercase tracking-tight ${
              activeTab === "learn"
                ? "bg-gradient-to-b from-[#2f4539] to-[#1e2c24] text-emerald-200 font-bold shadow-md border border-emerald-600/70 ring-1 ring-emerald-400/20"
                : "text-emerald-300/90 hover:text-emerald-200 hover:bg-emerald-950/40"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Learn</span>
          </button>
        </nav>

        {/* Right: Technical Health Seal & Machined Export Button */}
        <div className="flex items-center space-x-1.5 shrink-0 whitespace-nowrap">
          <div
            onClick={() => setActiveTab("dashboard")}
            className={`cursor-pointer flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all shrink-0 whitespace-nowrap ${
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
            <span>{score}/100</span>
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center space-x-1 chrome-button px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="whitespace-nowrap">Export</span>
          </button>
        </div>
      </header>

      {/* Active Break & Fix Academy Lab HUD */}
      {activeLab && activeTab !== "learn" && (
        <div
          className={`shrink-0 px-4 py-2 border-b font-mono text-xs flex flex-wrap items-center justify-between gap-2 z-30 ${
            labTargetCleared
              ? "bg-emerald-950/60 border-emerald-700/80 text-emerald-200"
              : "bg-amber-950/40 border-amber-700/70 text-amber-100"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Wrench className="w-4 h-4 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <div className="truncate">
                <span className="font-extrabold uppercase mr-2">
                  {labTargetCleared ? "LAB SOLVED!" : "LAB MISSION:"}
                </span>
                <span className="font-semibold">{activeLab.title}</span>
                <span className="ml-2 text-[10px] opacity-85">
                  ({labTargetCleared
                    ? `+${activeLab.xpReward} XP Awarded`
                    : `Target: ${activeLab.targetRuleIds.join(", ")} cleared & Score >= ${activeLab.targetScore}`})
                </span>
              </div>
              {activeLab.labGoalPlainEnglish && !labTargetCleared && (
                <div className="text-[11px] font-sans opacity-90 truncate mt-0.5">
                  Goal: {activeLab.labGoalPlainEnglish.replace(/`/g, "")}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase shrink-0">
            <button
              onClick={() => setActiveTab("dashboard")}
              className="chrome-button px-2.5 py-1 rounded cursor-pointer"
            >
              Health Findings
            </button>
            <button
              onClick={() => setActiveTab("editor")}
              className="chrome-button px-2.5 py-1 rounded cursor-pointer"
            >
              YAML Editor
            </button>
            {!labTargetCleared && (
              <button
                onClick={async () => {
                  setYamlContent(activeLab.solutionArchSpecYaml);
                  await reEvaluate(activeLab.solutionArchSpecYaml);
                }}
                className="chrome-button-accent px-2.5 py-1 rounded cursor-pointer"
              >
                Auto-Apply Clean Fix
              </button>
            )}
            <button
              onClick={() => openLessonInLearn(activeLab.lessonId, "id")}
              className="chrome-button px-2.5 py-1 rounded cursor-pointer"
            >
              Return to Lesson
            </button>
            <button
              onClick={() => setActiveLab(null)}
              className="p-1 text-zinc-400 hover:text-zinc-100 cursor-pointer"
              title="Close Lab HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 h-full overflow-hidden relative">
          {activeTab === "browse" && <BrowseDesignsView />}
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
          {activeTab === "learn" && <LearnStudioView />}
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
