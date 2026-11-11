import React, { useMemo, useState } from "react";
import { INTERVIEW_CASE_STUDIES } from "@archbench/learning-mode";
import { useArchBench } from "../../../context/ArchBenchContext.js";
import { RichInlineText } from "../RichInlineText.js";
import { Play, Search, Server, Lightbulb, ArrowUpRight } from "lucide-react";

export const CaseStudyPlaybooks: React.FC = () => {
  const { loadCustomYamlIntoCanvas } = useArchBench();
  const [selectedId, setSelectedId] = useState<string>(INTERVIEW_CASE_STUDIES[0].id);
  const [search, setSearch] = useState<string>("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return INTERVIEW_CASE_STUDIES;
    return INTERVIEW_CASE_STUDIES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.companyAnalog.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [search]);

  const study =
    filtered.find((c) => c.id === selectedId) ||
    filtered[0] ||
    INTERVIEW_CASE_STUDIES[0];

  const handleOpenInStudio = async () => {
    await loadCustomYamlIntoCanvas(
      study.archSpecYaml,
      `Playbook: ${study.companyAnalog}`,
      study.id,
      "canvas",
      null
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 font-mono">
      {/* Left Playbook Picker */}
      <div className="lg:w-80 shrink-0 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter 15 problems (Uber, Stripe...)"
            className="w-full bg-[#131519] border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((item) => {
            const isSel = item.id === study.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                  isSel
                    ? "chrome-button-accent"
                    : "bg-[#16181e] border-zinc-800 hover:border-zinc-700 text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between text-[9px] uppercase font-bold opacity-80">
                  <span>{item.category}</span>
                  <span>{item.difficulty}</span>
                </div>
                <div className="text-xs font-bold leading-snug">{item.title}</div>
                <div className="text-[10px] opacity-75">{item.scaleBadge}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Full Case Study Sheet */}
      <div className="flex-1 paper-card drafting-corners bg-[#16181e] border border-zinc-700/80 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase">
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                {study.companyAnalog}
              </span>
              <span className="text-emerald-300 bg-emerald-950/50 border border-emerald-800 px-2 py-0.5 rounded">
                {study.scaleBadge}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-extrabold text-zinc-100">
              {study.title}
            </h3>
          </div>

          <button
            onClick={handleOpenInStudio}
            className="chrome-button-accent px-4 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Open Live Topology Blueprint</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 30-Second Plain-English Overview */}
        {study.plainOverview && (
          <div className="bg-sky-950/30 border border-sky-800/70 rounded-xl p-4 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-sky-300">
                30-Second Plain-English Picture (How It Works)
              </div>
              <p className="font-sans text-[13px] text-zinc-100 leading-relaxed">
                <RichInlineText text={study.plainOverview} />
              </p>
            </div>
          </div>
        )}

        {/* Step 1 & 2 Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3.5 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-emerald-400">
              Functional Scope (What It Does)
            </div>
            {study.functionalRequirements.map((r, i) => (
              <div key={i} className="font-sans text-xs text-zinc-300 leading-relaxed">
                • <RichInlineText text={r} />
              </div>
            ))}
          </div>
          <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3.5 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-amber-400">
              Non-Functional &amp; SLAs (How Fast &amp; Reliable)
            </div>
            {study.nonFunctionalRequirements.map((r, i) => (
              <div key={i} className="font-sans text-xs text-zinc-300 leading-relaxed">
                • <RichInlineText text={r} />
              </div>
            ))}
          </div>
        </div>

        {/* Back of Envelope + Entities & APIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3.5 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-zinc-400">
              Back-of-the-Envelope Anchors
            </div>
            {study.backOfEnvelopeNotes.map((n, i) => (
              <div key={i} className="font-sans text-xs text-zinc-300 leading-relaxed">
                • <RichInlineText text={n} />
              </div>
            ))}
          </div>

          <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Core Entities &amp; Public APIs
            </div>
            <div className="flex flex-wrap gap-1">
              {study.coreEntities.map((ent, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-zinc-200"
                >
                  {ent}
                </span>
              ))}
            </div>
            <div className="space-y-1 pt-1">
              {study.keyApis.map((api, i) => (
                <div key={i} className="text-[11px]">
                  <span className="font-bold text-sky-400">{api.method}</span>{" "}
                  <code className="text-zinc-100">{api.path}</code>
                  <span className="font-sans text-zinc-400"> — {api.purpose}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deep Dives */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-bold text-zinc-400">
            Staff+ Deep Dives &amp; Bottleneck Solutions
          </div>
          {study.deepDives.map((dd, i) => (
            <div
              key={i}
              className="bg-[#111317] border border-zinc-800 rounded-xl p-3.5 space-y-1.5 text-xs"
            >
              <div className="font-bold text-zinc-100">{dd.topic}</div>
              <div className="font-sans text-xs text-amber-300 leading-relaxed">
                <strong className="font-mono text-[10px] uppercase">Trap / Bottleneck:</strong>{" "}
                <RichInlineText text={dd.bottleneck} />
              </div>
              <div className="font-sans text-xs text-emerald-300 leading-relaxed">
                <strong className="font-mono text-[10px] uppercase">Winning Design:</strong>{" "}
                <RichInlineText text={dd.solution} />
              </div>
            </div>
          ))}
        </div>

        {/* Senior Hook Seal */}
        <div className="bg-emerald-950/25 border border-emerald-800/70 rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
          <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
              Principal Interview Closing Hook
            </span>
            <span className="font-sans text-zinc-200 leading-relaxed text-xs">
              <RichInlineText text={study.seniorHook} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

