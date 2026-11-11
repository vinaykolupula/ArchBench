import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  GraduationCap,
  PenTool,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { INTERVIEW_CASE_STUDIES } from "@archbench/learning-mode";
import { useArchBench } from "../../context/ArchBenchContext.js";
import { BrandLogo } from "../common/BrandLogo.js";

interface HomeViewProps {
  onOpenDesignIntake: () => void;
}

const PATTERN_SHORTCUTS: Array<{ label: string; lessonId: string }> = [
  { label: "Scale 0 → 10M", lessonId: "lesson-zero-to-millions" },
  { label: "Consistent Hashing", lessonId: "lesson-consistent-hashing" },
  { label: "Rate Limiter", lessonId: "lesson-rate-limiter" },
  { label: "CAP & Quorums", lessonId: "lesson-quorum-consensus" },
  { label: "Transactional Outbox", lessonId: "concept-outbox" },
  { label: "Geohash & H3", lessonId: "lesson-geospatial-engine" },
];

/**
 * Visual UI Preview 1: Requirements & SLAs -> Evaluated Multi-Tier Topology
 */
const DesignVisualBlock: React.FC = () => (
  <div className="h-28 rounded-xl bg-[#101217] border border-zinc-800/90 drafting-dot-grid px-3 py-2.5 flex items-center justify-between gap-2 overflow-hidden">
    {/* Left: Input Requirements & SLA Chips */}
    <div className="flex flex-col justify-center gap-1.5 shrink-0">
      <div className="px-2 py-1 rounded-md bg-[#181b23] border border-zinc-700/80 text-[10px] font-mono text-zinc-200 flex items-center justify-between gap-2 shadow-sm">
        <span className="text-zinc-400">Load</span>
        <span className="font-bold text-zinc-100">50k RPS</span>
      </div>
      <div className="px-2 py-1 rounded-md bg-[#181b23] border border-zinc-700/80 text-[10px] font-mono text-zinc-200 flex items-center justify-between gap-2 shadow-sm">
        <span className="text-zinc-400">Uptime</span>
        <span className="font-bold text-sky-300">99.99%</span>
      </div>
    </div>

    {/* Middle: Synthesis Flow Arrow */}
    <svg viewBox="0 0 28 24" className="w-6 h-5 shrink-0" aria-hidden="true">
      <line
        x1="2"
        y1="12"
        x2="20"
        y2="12"
        stroke="#71717a"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        className="animate-flow-dash"
      />
      <polygon points="19,8 26,12 19,16" fill="#e4e4e7" />
    </svg>

    {/* Right: Evaluated Output Topology & Score */}
    <div className="flex-1 h-full rounded-lg bg-[#161922]/95 border border-zinc-700/70 p-2 flex flex-col justify-between min-w-0">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
          Topology
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-[9px] font-mono font-bold text-emerald-300 shrink-0">
          <ShieldCheck className="w-2.5 h-2.5" />
          98/100
        </span>
      </div>

      <svg viewBox="0 0 132 42" className="w-full h-11 select-none" aria-hidden="true">
        {/* Sync connections */}
        <line x1="32" y1="21" x2="49" y2="21" stroke="#52525b" strokeWidth="1.3" />
        <line x1="81" y1="16" x2="96" y2="11" stroke="#059669" strokeWidth="1.3" />
        <line x1="81" y1="26" x2="96" y2="31" stroke="#38bdf8" strokeWidth="1.3" />

        {/* Gateway */}
        <rect x="2" y="12" width="30" height="18" rx="4" fill="#1f232d" stroke="#52525b" />
        <text x="17" y="24" textAnchor="middle" fill="#e4e4e7" fontSize="8" fontFamily="monospace">
          GW
        </text>

        {/* Service Cluster */}
        <rect x="49" y="10" width="32" height="22" rx="4" fill="#232834" stroke="#a1a1aa" />
        <text x="65" y="24" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="700" fontFamily="monospace">
          API×3
        </text>

        {/* Cache */}
        <rect x="96" y="2" width="34" height="16" rx="4" fill="#132520" stroke="#059669" />
        <text x="113" y="13" textAnchor="middle" fill="#6ee7b7" fontSize="7.5" fontFamily="monospace">
          Cache
        </text>

        {/* Primary DB */}
        <rect x="96" y="24" width="34" height="16" rx="4" fill="#162230" stroke="#0284c7" />
        <text x="113" y="35" textAnchor="middle" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace">
          DB
        </text>
      </svg>
    </div>
  </div>
);

/**
 * Visual UI Preview 2: Interactive Simulators + Hands-On Break & Fix Labs
 */
const LearnVisualBlock: React.FC<{ completedLessons: number }> = ({ completedLessons }) => (
  <div className="h-28 rounded-xl bg-[#101217] border border-zinc-800/90 drafting-dot-grid px-3 py-2.5 flex items-center justify-between gap-3 overflow-hidden">
    {/* Left: Interactive Consistent Hashing / Shard Ring Simulator Preview */}
    <div className="w-[88px] h-full rounded-lg bg-[#161922]/95 border border-zinc-700/70 flex flex-col items-center justify-center p-1.5 shrink-0">
      <svg viewBox="0 0 72 60" className="w-full h-14 select-none" aria-hidden="true">
        <circle
          cx="36"
          cy="30"
          r="21"
          fill="none"
          stroke="#3f3f46"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <path
          d="M 36 9 A 21 21 0 0 1 56 35"
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="36" cy="9" r="4" fill="#34d399" />
        <circle cx="56" cy="35" r="4" fill="#38bdf8" />
        <circle cx="23" cy="47" r="4" fill="#f59e0b" />
        <circle cx="16" cy="24" r="3.5" fill="#a1a1aa" />
        <text x="36" y="33" textAnchor="middle" fill="#e4e4e7" fontSize="7.5" fontWeight="700" fontFamily="monospace">
          HASH
        </text>
      </svg>
    </div>

    {/* Right: Visual Break & Fix + Simulator State */}
    <div className="flex-1 flex flex-col justify-between h-full py-0.5 min-w-0">
      {/* Break & Fix Lab Preview */}
      <div className="rounded-lg bg-[#161922]/95 border border-emerald-800/50 px-2.5 py-1.5 flex items-center justify-between gap-1.5">
        <div className="min-w-0">
          <div className="text-[9px] font-mono uppercase text-zinc-400">Break &amp; Fix Lab</div>
          <div className="text-[11px] font-mono font-bold text-zinc-100 truncate">
            SPOF <span className="text-zinc-500">→</span>{" "}
            <span className="text-emerald-300">Multi-AZ</span>
          </div>
        </div>
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      </div>

      {/* Curriculum Progress & Simulators */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-zinc-400">Course Progress</span>
          <span className="text-emerald-300 font-bold">{completedLessons}/32</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-800/90 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all"
            style={{ width: `${Math.max(8, Math.round((completedLessons / 32) * 100))}%` }}
          />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Visual UI Preview 3: Curated Real-World System Blueprints Gallery
 */
const BrowseVisualBlock: React.FC<{ totalCount: number }> = ({ totalCount }) => (
  <div className="h-28 rounded-xl bg-[#101217] border border-zinc-800/90 drafting-dot-grid px-2.5 py-2 flex flex-col justify-between gap-1.5 overflow-hidden">
    {/* Blueprint Preview Row 1 */}
    <div className="rounded-lg bg-[#171b24] border border-zinc-700/80 px-2.5 py-1.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        <span className="text-[11px] font-semibold text-zinc-100 truncate">
          E-Commerce Checkout
        </span>
      </div>
      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 shrink-0">
        Outbox • 100
      </span>
    </div>

    {/* Blueprint Preview Row 2 */}
    <div className="rounded-lg bg-[#151820] border border-zinc-800/90 px-2.5 py-1.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
        <span className="text-[11px] font-semibold text-zinc-200 truncate">
          URL Shortener
        </span>
      </div>
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60 shrink-0">
        100:1 Cache
      </span>
    </div>

    {/* Blueprint Footer Pill */}
    <div className="px-1 flex items-center justify-between text-[10px] font-mono text-zinc-400">
      <span className="truncate">Chat • Feeds • Rate Limiter</span>
      <span className="text-sky-300 font-bold shrink-0">+{Math.max(0, totalCount - 2)} more</span>
    </div>
  </div>
);

export const HomeView: React.FC<HomeViewProps> = ({ onOpenDesignIntake }) => {
  const { specs, setActiveTab, openLessonInLearn, learn } = useArchBench();
  const totalDesignsCount = specs.length + INTERVIEW_CASE_STUDIES.length;
  const completedLessons = learn.progress.completedLessonIds.length;

  return (
    <div className="h-full w-full flex flex-col bg-black overflow-y-auto">
      {/* Minimal Uncluttered Top Bar */}
      <header className="h-14 px-5 flex items-center justify-between border-b border-zinc-800/80 bg-black/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center space-x-3">
          <BrandLogo size="md" />
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm sm:text-base tracking-wider text-zinc-100 font-mono uppercase">
              ArchBench
            </span>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest px-1.5 py-0.5 bg-zinc-800/80 text-zinc-400 border border-zinc-700/70 rounded">
              Studio
            </span>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("canvas")}
          className="chrome-button px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 cursor-pointer"
          title="Jump directly into the Topology Workbench"
        >
          <Wrench className="w-3.5 h-3.5 text-zinc-400" />
          <span>Workbench</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </header>

      {/* Main Centered Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6">
        <div className="w-full max-w-5xl space-y-6 sm:space-y-7">
          {/* Brand Title & Calm Architecture Summary */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-[10px] font-mono uppercase tracking-widest text-zinc-300">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>System Architecture Studio</span>
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-5 pt-1">
              <BrandLogo size="xl" />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-100">
                ArchBench
              </h1>
            </div>

            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Design distributed topologies, stress-test failure and scaling limits, and master core system architecture patterns.
            </p>
          </div>

          {/* Three Primary Studio Options: Design | Learn | Browse Designs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Option 1: Design */}
            <div className="paper-card drafting-corners rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-zinc-500/60 transition-colors">
              <div className="space-y-2.5">
                <DesignVisualBlock />

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
                      <PenTool className="w-3.5 h-3.5" />
                    </div>
                    <h2 className="text-lg font-bold text-zinc-100">Design</h2>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-300 border border-zinc-700/80">
                    Synthesize
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
                  Enter your traffic &amp; reliability goals to generate, score, and compare real architectures.
                </p>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <button
                  onClick={onOpenDesignIntake}
                  className="w-full chrome-button-accent py-2 px-4 rounded-xl text-xs font-mono uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Designing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab("canvas")}
                  className="w-full text-[11px] font-mono text-zinc-400 hover:text-zinc-200 py-0.5 cursor-pointer transition-colors"
                >
                  or open Canvas &amp; YAML Editor
                </button>
              </div>
            </div>

            {/* Option 2: Learn */}
            <div className="paper-card drafting-corners rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-emerald-600/60 transition-colors">
              <div className="space-y-2.5">
                <LearnVisualBlock completedLessons={completedLessons} />

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-700/70 flex items-center justify-center text-emerald-300">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-zinc-100">Learn</h2>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/70">
                    {completedLessons > 0 ? `${completedLessons}/32 Done` : "32 Lessons"}
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
                  Master distributed systems with everyday analogies, interactive simulators, and Break &amp; Fix labs.
                </p>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <button
                  onClick={() => setActiveTab("learn")}
                  className="w-full chrome-button py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer border-emerald-700/60 hover:border-emerald-500/80 text-emerald-200"
                >
                  <span>Open Academy</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="text-center text-[11px] font-mono text-zinc-500 py-0.5">
                  10 Visual Simulators • Interview Primer
                </div>
              </div>
            </div>

            {/* Option 3: Browse Designs */}
            <div className="paper-card drafting-corners rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-sky-600/60 transition-colors">
              <div className="space-y-2.5">
                <BrowseVisualBlock totalCount={totalDesignsCount} />

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-950/80 border border-sky-700/70 flex items-center justify-center text-sky-300">
                      <Compass className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-zinc-100">Browse Designs</h2>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/70">
                    {totalDesignsCount} Blueprints
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
                  Explore {specs.length} workspace specs and {INTERVIEW_CASE_STUDIES.length} classic blueprints ready for the canvas.
                </p>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <button
                  onClick={() => setActiveTab("browse")}
                  className="w-full chrome-button py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer border-sky-700/60 hover:border-sky-500/80 text-sky-200"
                >
                  <span>Browse Designs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="text-center text-[11px] font-mono text-zinc-500 py-0.5">
                  Topology • Health Audit • Stress Lab
                </div>
              </div>
            </div>
          </div>

          {/* Subtle System Design Pattern Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1">
              Explore Patterns:
            </span>
            {PATTERN_SHORTCUTS.map((p) => (
              <button
                key={p.lessonId}
                onClick={() => openLessonInLearn(p.lessonId, "id")}
                className="px-2.5 py-1 rounded-full bg-[#17191f] hover:bg-[#222630] border border-zinc-800 hover:border-zinc-600 text-[11px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
