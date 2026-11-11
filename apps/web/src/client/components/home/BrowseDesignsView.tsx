import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  Compass,
  FolderOpen,
  Search,
} from "lucide-react";
import { INTERVIEW_CASE_STUDIES } from "@archbench/learning-mode";
import { useArchBench } from "../../context/ArchBenchContext.js";
import { RichInlineText } from "../learn/RichInlineText.js";

type BrowseFilter = "all" | "workspace" | "blueprints";

const REFERENCE_SPEC_DETAILS: Record<
  string,
  { title: string; domain: string; summary: string; tags: string[] }
> = {
  "ecommerce-backend": {
    title: "E-Commerce Checkout & Fulfillment Backend",
    domain: "COMMERCE & ORDERS",
    summary:
      "Multi-AZ API gateway, idempotent checkout service, PostgreSQL + transactional outbox relay, and async order workers.",
    tags: ["Transactional Outbox", "Idempotency", "Multi-AZ"],
  },
  "notification-platform": {
    title: "Multi-Channel Notification Delivery Platform",
    domain: "ASYNC MESSAGING",
    summary:
      "Priority-queued fan-out pipeline routing Push, Email, and SMS deliveries with bounded retries and dead-letter quarantine.",
    tags: ["Priority Queues", "DLQ", "Backpressure"],
  },
  "rag-document-pipeline": {
    title: "Enterprise RAG Document Ingestion & Search",
    domain: "AI INFRASTRUCTURE",
    summary:
      "Async document chunking, dense embedding generation, hybrid lexical + vector retrieval, and LLM semantic caching.",
    tags: ["HNSW Vector", "Hybrid Search", "Semantic Cache"],
  },
  "realtime-chat": {
    title: "Real-Time 1:1 & Group Chat Architecture",
    domain: "WEBSOCKET MESSAGING",
    summary:
      "Stateful WebSocket connection gateways backed by presence cache, durable sequence ordering, and fan-out pub/sub.",
    tags: ["WebSockets", "Presence", "Ordered Inbox"],
  },
  "url-shortener": {
    title: "High-Throughput URL Shortener & Redirect Engine",
    domain: "WEB & KV STORAGE",
    summary:
      "Read-heavy 100:1 link redirect service using Redis RAM caching, collision-free short codes, and async click analytics.",
    tags: ["100:1 Read/Write", "Redis Cache", "Base62"],
  },
};

export const BrowseDesignsView: React.FC = () => {
  const {
    specs,
    selectedSpecPath,
    setSelectedSpecPath,
    setActiveTab,
    setActiveLab,
    loadCustomYamlIntoCanvas,
  } = useArchBench();

  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<BrowseFilter>("all");
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredWorkspaceSpecs = useMemo(() => {
    if (filter === "blueprints") return [];
    return specs.filter((spec) => {
      if (!normalizedQuery) return true;
      const meta = REFERENCE_SPEC_DETAILS[spec.name];
      return (
        spec.name.toLowerCase().includes(normalizedQuery) ||
        spec.path.toLowerCase().includes(normalizedQuery) ||
        (meta?.title.toLowerCase().includes(normalizedQuery) ?? false) ||
        (meta?.summary.toLowerCase().includes(normalizedQuery) ?? false) ||
        (meta?.tags.some((t) => t.toLowerCase().includes(normalizedQuery)) ?? false)
      );
    });
  }, [specs, filter, normalizedQuery]);

  const filteredBlueprints = useMemo(() => {
    if (filter === "workspace") return [];
    return INTERVIEW_CASE_STUDIES.filter((study) => {
      if (!normalizedQuery) return true;
      return (
        study.title.toLowerCase().includes(normalizedQuery) ||
        study.category.toLowerCase().includes(normalizedQuery) ||
        study.companyAnalog.toLowerCase().includes(normalizedQuery) ||
        (study.plainOverview?.toLowerCase().includes(normalizedQuery) ?? false) ||
        study.coreEntities.some((e) => e.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [filter, normalizedQuery]);

  return (
    <div className="h-full w-full overflow-y-auto drafting-desk-grid p-5 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Gallery Header */}
        <div className="chrome-chassis rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab("home")}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase text-zinc-400 hover:text-zinc-100 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-700/70 flex items-center justify-center text-sky-300">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-100">Browse System Designs</h1>
                <p className="text-xs text-zinc-400">
                  Open evaluated workspace architectures or load classic system blueprints onto the Topology Canvas.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Chat, Ledger, Cache..."
                className="w-full sm:w-56 bg-[#121419] border border-zinc-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="flex items-center bg-[#121419] border border-zinc-800 rounded-xl p-1 gap-1 text-[11px] font-mono shrink-0">
              <button
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                  filter === "all"
                    ? "bg-zinc-200 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All ({specs.length + INTERVIEW_CASE_STUDIES.length})
              </button>
              <button
                onClick={() => setFilter("workspace")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                  filter === "workspace"
                    ? "bg-zinc-200 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Workspace ({specs.length})
              </button>
              <button
                onClick={() => setFilter("blueprints")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                  filter === "blueprints"
                    ? "bg-zinc-200 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Blueprints ({INTERVIEW_CASE_STUDIES.length})
              </button>
            </div>
          </div>
        </div>

        {/* Workspace / Reference Architectures */}
        {filteredWorkspaceSpecs.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reference Workspace Specifications ({filteredWorkspaceSpecs.length})</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Full Stress Lab + Rule Audit Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkspaceSpecs.map((spec) => {
                const meta = REFERENCE_SPEC_DETAILS[spec.name];
                const isSelected = selectedSpecPath === spec.path;
                return (
                  <div
                    key={spec.path}
                    className={`paper-card drafting-corners rounded-xl p-4 flex flex-col justify-between gap-4 transition-all ${
                      isSelected
                        ? "border-emerald-600/70 ring-1 ring-emerald-500/20"
                        : "hover:border-zinc-500/70"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                          {meta?.domain || spec.type.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 truncate">
                          {spec.name}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-zinc-100 leading-snug">
                        {meta?.title || spec.name}
                      </h3>

                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {meta?.summary || `Loaded specification from ${spec.path}.`}
                      </p>

                      {meta?.tags && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {meta.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#121419] border border-zinc-800 text-zinc-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setActiveLab(null);
                          setSelectedSpecPath(spec.path);
                          setActiveTab("canvas");
                        }}
                        className="flex-1 chrome-button-accent py-2 px-3 rounded-lg text-[11px] font-mono uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Boxes className="w-3.5 h-3.5" />
                        <span>Open Topology</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveLab(null);
                          setSelectedSpecPath(spec.path);
                          setActiveTab("dashboard");
                        }}
                        className="chrome-button py-2 px-3 rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                        title="Open Health Audit"
                      >
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Health</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Classic System Design Blueprints */}
        {filteredBlueprints.length > 0 && (
          <section className="space-y-3 pb-6">
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>System Architecture Blueprints ({filteredBlueprints.length})</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                1-Click Load into Interactive Canvas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBlueprints.map((study) => {
                const isLoading = loadingSlug === study.id;
                return (
                  <div
                    key={study.id}
                    className="paper-card drafting-corners rounded-xl p-4 flex flex-col justify-between gap-4 hover:border-sky-600/60 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                        <span className="uppercase font-bold px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60">
                          {study.category}
                        </span>
                        <span className="uppercase text-zinc-400">{study.difficulty}</span>
                      </div>

                      <h3 className="text-sm font-bold text-zinc-100 leading-snug">
                        {study.title}
                      </h3>

                      <div className="text-[11px] font-mono text-emerald-300/90">
                        {study.scaleBadge}
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                        <RichInlineText
                          text={study.plainOverview || study.functionalRequirements[0] || ""}
                        />
                      </p>
                    </div>

                    <button
                      disabled={isLoading}
                      onClick={async () => {
                        setLoadingSlug(study.id);
                        try {
                          await loadCustomYamlIntoCanvas(
                            study.archSpecYaml,
                            study.title,
                            study.id,
                            "canvas"
                          );
                        } finally {
                          setLoadingSlug(null);
                        }
                      }}
                      className="w-full chrome-button py-2 px-3 rounded-lg text-[11px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer border-sky-700/50 hover:border-sky-500/80 text-sky-200 disabled:opacity-50"
                    >
                      <span>{isLoading ? "Loading..." : "Load Blueprint"}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {filteredWorkspaceSpecs.length === 0 && filteredBlueprints.length === 0 && (
          <div className="paper-card rounded-2xl p-10 text-center space-y-2">
            <div className="text-sm font-bold text-zinc-200">
              No matching designs found for "{query}"
            </div>
            <button
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="chrome-button px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
