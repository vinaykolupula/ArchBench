import React, { useState } from "react";
import { useArchBench } from "../../context/ArchBenchContext.js";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Target,
  FileText,
  Lightbulb,
  ExternalLink,
  GraduationCap,
} from "lucide-react";

export const HealthDashboard: React.FC = () => {
  const { evaluation, activeAltId, setActiveTab, openLessonInLearn } = useArchBench();
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const activeAlt = evaluation?.evaluation?.alternatives?.[activeAltId];
  if (!activeAlt) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono">
        // NO EVALUATION DATA AVAILABLE. SELECT AN ARCHITECTURE SPECIFICATION.
      </div>
    );
  }

  const score = activeAlt.score ?? activeAlt.summary?.score ?? 100;
  const passed = activeAlt.passed ?? (score >= 90);
  const { totalFindings, criticalCount, errorCount = 0, warningCount, requirementCoverage } = activeAlt.summary;
  const criticalAndErrorCount = criticalCount + errorCount;
  const coveragePct = requirementCoverage?.percentage ?? 100;

  const scoreColor =
    score >= 90
      ? "text-zinc-100 stroke-zinc-100"
      : score >= 70
      ? "text-amber-300 stroke-amber-400"
      : "text-red-400 stroke-red-500";

  const filteredFindings = activeAlt.findings.filter((f) => {
    if (severityFilter === "all") return true;
    return f.severity === severityFilter;
  });

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 overflow-y-auto h-full text-zinc-200 drafting-dot-grid">
      {/* Hero Executive Score Banner - Machined Grey Chrome Finish */}
      <div className="chrome-chassis rounded-2xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-b from-[#242730] via-[#1c1e24] to-[#15171b] border border-zinc-700/80 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-6 sm:space-x-8">
            {/* Circular Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0 rounded-full bg-[#14151a] border border-zinc-700/80 shadow-inner">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-zinc-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className={`transition-all duration-1000 ease-out ${scoreColor}`}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center font-mono">
                <span className="text-3xl font-black text-zinc-100 tracking-tight">
                  {score}
                </span>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                  / 100
                </span>
              </div>
            </div>

            {/* Verdict & Title */}
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                    passed
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                      : "bg-red-950/60 text-red-300 border-red-800"
                  }`}
                >
                  {passed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> [PRODUCTION READY]
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-400" /> [REMEDIATION REQUIRED]
                    </>
                  )}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  PROFILE: {evaluation?.evaluation?.metadata?.profile || "core-hld-v1"}
                </span>
              </div>

              <h1 className="text-xl font-mono font-bold text-zinc-100 mt-2 tracking-tight uppercase">
                {activeAlt.alternativeName || activeAlt.alternativeId}
              </h1>
              <p className="text-xs font-mono text-zinc-400 max-w-xl mt-1.5 leading-relaxed">
                Deterministic fitness tests, JustEnough Occam's razor heuristics, and requirement
                coverage matrix. All evaluations are fully reproducible.
              </p>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto shrink-0">
            <div className="paper-card drafting-corners px-4 py-3 rounded-xl text-center border border-zinc-700/80 bg-[#16181e] font-mono min-w-[105px]">
              <Target className="w-4 h-4 mx-auto text-zinc-300 mb-1" />
              <span className="block text-xl font-bold text-zinc-100">{coveragePct}%</span>
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider whitespace-nowrap block mt-1">
                COVERAGE
              </span>
            </div>
            <div className="paper-card drafting-corners px-4 py-3 rounded-xl text-center border border-zinc-700/80 bg-[#16181e] font-mono min-w-[105px]">
              <XCircle className="w-4 h-4 mx-auto text-red-400 mb-1" />
              <span className="block text-xl font-bold text-red-300">{criticalAndErrorCount}</span>
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider whitespace-nowrap block mt-1">
                CRIT / ERRORS
              </span>
            </div>
            <div className="paper-card drafting-corners px-4 py-3 rounded-xl text-center border border-zinc-700/80 bg-[#16181e] font-mono min-w-[105px]">
              <AlertTriangle className="w-4 h-4 mx-auto text-amber-400 mb-1" />
              <span className="block text-xl font-bold text-amber-300">{warningCount}</span>
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider whitespace-nowrap block mt-1">
                WARNINGS
              </span>
            </div>
            <div className="paper-card drafting-corners px-4 py-3 rounded-xl text-center border border-zinc-700/80 bg-[#16181e] font-mono min-w-[105px]">
              <ShieldCheck className="w-4 h-4 mx-auto text-zinc-300 mb-1" />
              <span className="block text-xl font-bold text-zinc-100">{totalFindings}</span>
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider whitespace-nowrap block mt-1">
                FINDINGS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Findings Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-sm font-mono font-bold text-zinc-100 flex items-center uppercase tracking-wider">
              <FileText className="w-4 h-4 mr-2 text-zinc-400" />
              // FITNESS TEST FINDINGS & ARCHITECTURAL EVIDENCE
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              10 deterministic rules catching SPOFs, circular call chains, unbounded queues, and missing retries.
            </p>
          </div>

          {/* Severity Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-[#121418] border border-zinc-800 p-1 rounded-xl text-xs font-mono">
            {["all", "critical", "error", "warning", "info"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                  severityFilter === sev
                    ? "chrome-button-accent text-zinc-950 font-bold shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <div className="paper-card drafting-corners rounded-2xl p-10 text-center space-y-3 bg-[#16181e] border border-zinc-700/80 font-mono">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-zinc-100 text-sm uppercase">// ZERO ARCHITECTURAL DEFECTS FOUND</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              This architecture satisfies all 10 registered fitness test rules, features complete
              requirement coverage, and avoids single points of failure.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveTab("simulator")}
                className="chrome-button px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Challenge in Stress Lab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFindings.map((finding, idx) => {
              const isCrit = finding.severity === "critical" || finding.severity === "error";
              const isWarn = finding.severity === "warning";

              return (
                <div
                  key={idx}
                  className={`paper-card drafting-corners border rounded-xl p-5 transition-all font-mono ${
                    isCrit
                      ? "border-red-700/80 bg-[#1e1617]"
                      : isWarn
                      ? "border-amber-700/80 bg-[#1e1c17]"
                      : "border-zinc-800 bg-[#16181e]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                          isCrit
                            ? "bg-red-950/80 text-red-300 border border-red-700"
                            : isWarn
                            ? "bg-amber-950/80 text-amber-300 border border-amber-700"
                            : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                        }`}
                      >
                        [{finding.severity.toUpperCase()}]
                      </span>
                      <span className="font-mono text-xs text-zinc-400 font-bold">
                        {finding.ruleId}
                      </span>
                    </div>

                    {finding.location?.line && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        line {finding.location.line}:{finding.location.column}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100 mt-2.5">
                    {finding.title}
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {finding.message}
                  </p>

                  {/* Affected components */}
                  {finding.affectedComponents && finding.affectedComponents.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">
                        Affected:
                      </span>
                      {finding.affectedComponents.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] font-mono bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Remediation */}
                  {finding.remediation && (
                    <div className="mt-3 bg-[#131519] border border-zinc-800 p-3 rounded-lg text-xs flex items-start space-x-2">
                      <Lightbulb className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <div className="text-zinc-300 leading-relaxed text-[11px]">
                        <span className="font-bold text-zinc-200 uppercase">Remediation: </span>
                        {finding.remediation}
                      </div>
                    </div>
                  )}

                  {/* Cross-Studio Learn Deep Link */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/70 flex items-center justify-end">
                    <button
                      onClick={() =>
                        openLessonInLearn(finding.ruleId || finding.testId || "outbox", "rule")
                      }
                      className="chrome-button px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 cursor-pointer"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Learn Concept &amp; Simulator -&gt;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
