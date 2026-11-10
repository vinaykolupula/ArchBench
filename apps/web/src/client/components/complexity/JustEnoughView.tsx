import React from "react";
import { useArchBench } from "../../context/ArchBenchContext.js";
import {
  Boxes,
  Network,
  Database,
  Cpu,
  Brain,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
} from "lucide-react";

export const JustEnoughView: React.FC = () => {
  const { evaluation, activeAltId } = useArchBench();
  const activeAlt = evaluation?.evaluation?.alternatives?.[activeAltId];
  const justEnough = activeAlt?.justEnough;

  if (!justEnough) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono">
        // NO JUSTENOUGH COMPLEXITY EVALUATION AVAILABLE FOR THIS ALTERNATIVE.
      </div>
    );
  }

  const vector = justEnough.complexityVector;
  const justifications = justEnough.componentJustifications || [];
  const summary = justEnough.summary;

  const vectorCards = [
    {
      title: "Components Count",
      value: vector?.componentCount ?? 0,
      icon: <Boxes className="w-4 h-4 text-zinc-300" />,
      desc: "Discrete architectural building blocks",
      status: vector?.componentCount > 15 ? "[HIGH SURFACE]" : "[OPTIMAL]",
    },
    {
      title: "Deployable Units",
      value: vector?.deployableCount ?? 0,
      icon: <Cpu className="w-4 h-4 text-zinc-300" />,
      desc: "Independently deployable applications & workers",
      status: "[LOW OVERHEAD]",
    },
    {
      title: "Network Boundaries",
      value: vector?.networkBoundaryCount ?? 0,
      icon: <Network className="w-4 h-4 text-zinc-300" />,
      desc: "Inter-component remote communication edges",
      status: "[VERIFIED]",
    },
    {
      title: "Stateful Stores",
      value: vector?.statefulStoreCount ?? 0,
      icon: <Database className="w-4 h-4 text-zinc-300" />,
      desc: "Databases, queues, caches & persistent volumes",
      status: vector?.statefulStoreCount > 4 ? "[REVIEW POLYGLOT]" : "[OPTIMAL]",
    },
    {
      title: "External SaaS APIs",
      value: vector?.externalDependencyCount ?? 0,
      icon: <Brain className="w-4 h-4 text-zinc-300" />,
      desc: "Third-party payment gateways & logistics",
      status: "[BOUNDED]",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 overflow-y-auto h-full text-zinc-200 drafting-dot-grid font-mono">
      {/* Hero Occam's Razor Card - Machined Grey Chrome */}
      <div className="chrome-chassis rounded-2xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-b from-[#242730] to-[#17191e] border border-zinc-700/80 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-zinc-300 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span>// OCCAM'S RAZOR FOR DISTRIBUTED SYSTEMS</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight uppercase">
              JustEnough Architecture Complexity Audit
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ArchBench prevents both premature over-engineering (introducing microservices and event
              buses before scale demands them) and brittle under-engineering. Every tier and component
              must be justified by an explicit business or non-functional requirement.
            </p>
          </div>

          {summary && (
            <div className="paper-card drafting-corners p-4 rounded-xl border border-zinc-700/80 bg-[#16181e] flex items-center space-x-4 shrink-0 shadow-lg">
              <div className="text-center">
                <span className="block text-2xl font-black text-emerald-300 font-mono">
                  {summary.justifiedCount}
                </span>
                <span className="text-[9px] uppercase font-bold text-zinc-400">JUSTIFIED</span>
              </div>
              <div className="h-8 w-px bg-zinc-700" />
              <div className="text-center">
                <span className="block text-2xl font-black text-amber-300 font-mono">
                  {summary.prematureCount}
                </span>
                <span className="text-[9px] uppercase font-bold text-zinc-400">PREMATURE</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complexity Vector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {vectorCards.map((card, i) => (
          <div
            key={i}
            className="paper-card drafting-corners p-4 rounded-xl flex flex-col justify-between border border-zinc-700/80 bg-[#16181e] hover:border-zinc-500 transition-all shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  {card.title}
                </span>
                {card.icon}
              </div>
              <span className="text-2xl font-black text-zinc-100 mt-2 block font-mono">{card.value}</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-zinc-800">
              <span className="text-[9px] font-mono font-bold text-zinc-300 block">
                {card.status}
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Component Justification Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center uppercase tracking-wider">
            <BookOpen className="w-4 h-4 mr-2 text-zinc-400" />
            // COMPONENT JUSTIFICATION AUDIT REVIEW
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit verifying that each structural component maps directly to stated functional or
            non-functional requirements.
          </p>
        </div>

        <div className="paper-card drafting-corners border border-zinc-700/80 rounded-xl overflow-hidden bg-[#16181e] shadow-xl">
          <table className="w-full text-left text-xs text-zinc-300 font-mono">
            <thead className="bg-[#121418] text-zinc-400 font-bold border-b border-zinc-800 uppercase text-[9px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Archetype</th>
                <th className="py-3 px-4">Justification Status</th>
                <th className="py-3 px-4">Architectural Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {justifications.length > 0 ? (
                justifications.map((j) => (
                  <tr key={j.componentId} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-zinc-100">
                      {j.componentId}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono capitalize">
                      [{j.componentType}]
                    </td>
                    <td className="py-3 px-4">
                      {j.status === "justified" ? (
                        <span className="inline-flex items-center text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> [JUSTIFIED]
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-300 font-bold bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded text-[10px]">
                          <AlertCircle className="w-3 h-3 mr-1" /> [PREMATURE]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 leading-relaxed text-[11px]">
                      <div>{j.reason}</div>
                      {j.mappedRequirements && j.mappedRequirements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {j.mappedRequirements.map((req) => (
                            <span
                              key={req}
                              className="font-mono text-[9px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.5 rounded"
                            >
                              [{req}]
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    // NO COMPONENTS REGISTERED FOR JUSTIFICATION EVALUATION.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
