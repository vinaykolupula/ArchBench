import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Zap,
  Sliders,
  DollarSign,
  Users,
  Activity,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Cpu,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  SystemDesignBrief,
  SystemDesignPreset,
  SynthesisResult,
} from "@archbench/synthesis";

interface SystemDesignIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSynthesisComplete: (result: SynthesisResult) => void;
}

export const SystemDesignIntakeModal: React.FC<SystemDesignIntakeModalProps> = ({
  isOpen,
  onClose,
  onSynthesisComplete,
}) => {
  const [presets, setPresets] = useState<SystemDesignPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{ available: boolean; provider: string | null } | null>(null);

  // Form State
  const [name, setName] = useState<string>("Real-Time Ride Dispatch Platform");
  const [description, setDescription] = useState<string>(
    "Geospatial driver matching, real-time location tracking, dynamic surge pricing, and asynchronous payment processing for 10M daily rides."
  );
  const [domain, setDomain] = useState<string>("mobility-logistics");
  const [peakRps, setPeakRps] = useState<number>(20000);
  const [p99LatencyMs, setP99LatencyMs] = useState<number>(75);
  const [availabilityPercent, setAvailabilityPercent] = useState<number>(99.99);
  const [budgetMonthlyUsd, setBudgetMonthlyUsd] = useState<number>(8500);
  const [teamSize, setTeamSize] = useState<number>(8);
  const [cloudProvider, setCloudProvider] = useState<"aws" | "gcp" | "azure" | "agnostic">("aws");
  const [readWriteRatio, setReadWriteRatio] = useState<string>("60:40");
  const [preferredLanguages, setPreferredLanguages] = useState<string>("Go, TypeScript, Rust");
  const [functionalRequirements, setFunctionalRequirements] = useState<string[]>([
    "Ingest real-time driver GPS telemetry updates every 3 seconds.",
    "Match ride requests to the nearest available driver within 500 meters under 200ms.",
    "Calculate dynamic surge pricing based on local geospatial demand clusters.",
    "Execute idempotent customer charge and driver payout through external payment gateway.",
  ]);
  const [newReqInput, setNewReqInput] = useState<string>("");

  useEffect(() => {
    async function fetchPresets() {
      try {
        const res = await fetch("/api/synthesis/presets");
        const data = await res.json();
        if (data.presets && data.presets.length > 0) {
          setPresets(data.presets);
          setSelectedPresetId(data.presets[0].id);
        }
      } catch (err) {
        console.error("Failed to load presets:", err);
      }
    }

    async function fetchAiStatus() {
      try {
        const res = await fetch("/api/synthesis/ai-status");
        const data = await res.json();
        setAiStatus(data);
      } catch {
        setAiStatus({ available: false, provider: null });
      }
    }

    if (isOpen) {
      fetchPresets();
      fetchAiStatus();
    }
  }, [isOpen]);

  const loadPreset = (preset: SystemDesignPreset) => {
    setSelectedPresetId(preset.id);
    setName(preset.brief.name);
    setDescription(preset.brief.description);
    setDomain(preset.brief.domain);
    setPeakRps(preset.brief.scaleTargets.peakRps);
    setP99LatencyMs(preset.brief.scaleTargets.p99LatencyMs);
    setAvailabilityPercent(preset.brief.scaleTargets.availabilityPercent);
    setBudgetMonthlyUsd(preset.brief.constraints.budgetMonthlyUsd || 5000);
    setTeamSize(preset.brief.constraints.teamSize || 6);
    setCloudProvider(preset.brief.constraints.cloudProvider || "aws");
    setReadWriteRatio(preset.brief.scaleTargets.readWriteRatio || "80:20");
    setPreferredLanguages(preset.brief.constraints.preferredLanguages?.join(", ") || "Go, TypeScript");
    setFunctionalRequirements([...preset.brief.functionalRequirements]);
  };

  const handleAddRequirement = () => {
    if (newReqInput.trim()) {
      setFunctionalRequirements([...functionalRequirements, newReqInput.trim()]);
      setNewReqInput("");
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFunctionalRequirements(functionalRequirements.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    const brief: SystemDesignBrief = {
      name,
      description,
      domain,
      scaleTargets: {
        peakRps: Number(peakRps),
        p99LatencyMs: Number(p99LatencyMs),
        availabilityPercent: Number(availabilityPercent),
        readWriteRatio,
      },
      functionalRequirements: functionalRequirements.filter((r) => r.trim().length > 0),
      constraints: {
        budgetMonthlyUsd: Number(budgetMonthlyUsd),
        teamSize: Number(teamSize),
        cloudProvider,
        preferredLanguages: preferredLanguages.split(",").map((s) => s.trim()).filter(Boolean),
      },
    };

    try {
      const res = await fetch("/api/synthesis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Synthesis request failed");
      }

      const result: SynthesisResult = await res.json();
      onSynthesisComplete(result);
      onClose();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] chrome-chassis bg-[#17191e] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header - Machined Grey Chrome */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700/80 bg-gradient-to-b from-[#252830] via-[#1d2026] to-[#17191e]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 shadow-inner">
              <Sparkles className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100">
                  System Design Intake & Synthesis Studio
                </h2>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  DUAL-MODE SPEC
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                Input system specifications and scale SLAs to synthesize & benchmark 3 contrasting candidate architectures.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="chrome-button p-2 text-zinc-400 hover:text-zinc-100 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#141519] drafting-dot-grid">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-700/80 rounded-lg text-xs font-mono text-red-300 flex items-center gap-2">
              <span className="font-bold">[ERROR]:</span> {error}
            </div>
          )}

          {/* Preset Selection Strip */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-300" />
                // SELECT ICONIC BLUEPRINT TEMPLATE
              </label>
              <span className="text-[10px] font-mono text-zinc-500">Pick template to calibrate targets</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {presets.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => loadPreset(p)}
                    className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer font-mono ${
                      isSelected
                        ? "bg-[#252833] border-zinc-300 text-white ring-1 ring-white/20 shadow-lg"
                        : "bg-[#181a20] border-zinc-800 hover:border-zinc-600 hover:bg-[#1f2229] text-zinc-300"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 line-clamp-1">{p.category}</span>
                    <span className="text-xs font-bold text-zinc-100 mt-0.5 line-clamp-1">{p.title.split("(")[0]}</span>
                    <span className="text-[10px] text-zinc-400 mt-1">{p.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Form Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Brief Metadata & Functional Reqs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">System Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#181a20] border border-zinc-700/80 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-400 shadow-inner"
                  placeholder="e.g. Real-Time Ride Dispatch Platform"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">High-Level Problem Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#181a20] border border-zinc-700/80 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-400 leading-relaxed shadow-inner"
                  placeholder="Describe core workflows, client interactions, and mission-critical invariants..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">Domain Category</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#181a20] border border-zinc-700/80 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-400 shadow-inner"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">Read / Write Ratio</label>
                  <input
                    type="text"
                    value={readWriteRatio}
                    onChange={(e) => setReadWriteRatio(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#181a20] border border-zinc-700/80 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-400 shadow-inner"
                    placeholder="e.g. 80:20"
                  />
                </div>
              </div>

              {/* Functional Requirements Builder */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>// FUNCTIONAL REQUIREMENTS ({functionalRequirements.length})</span>
                  <span className="text-[10px] font-normal text-zinc-500">Auto-mapped to components</span>
                </label>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {functionalRequirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#181a20] border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300"
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-[10px] text-zinc-400 font-bold mt-0.5">[REQ-{idx + 1}]</span>
                        <span className="line-clamp-2 leading-relaxed">{req}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newReqInput}
                    onChange={(e) => setNewReqInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddRequirement()}
                    placeholder="Add custom specification requirement..."
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#181a20] border border-zinc-700/80 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-400 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleAddRequirement}
                    className="chrome-button px-3 py-1.5 text-xs font-mono font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Scale Targets & Hard Constraints */}
            <div className="lg:col-span-5 space-y-4 paper-card drafting-corners p-4 rounded-xl border border-zinc-700/80 bg-[#17191f]">
              <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-800">
                <Sliders className="w-4 h-4 text-zinc-300" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                  // SLA CALIBRATION CONTROLS
                </h3>
              </div>

              {/* Peak RPS */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-zinc-400" /> Peak Throughput
                  </span>
                  <span className="font-bold text-zinc-100">{peakRps.toLocaleString()} RPS</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={100000}
                  step={500}
                  value={peakRps}
                  onChange={(e) => setPeakRps(Number(e.target.value))}
                  className="calibrated-slider w-full cursor-ew-resize"
                />
              </div>

              {/* P99 Latency SLA */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-zinc-400" /> P99 Latency SLA
                  </span>
                  <span className="font-bold text-zinc-100">{p99LatencyMs} ms</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={5}
                  value={p99LatencyMs}
                  onChange={(e) => setP99LatencyMs(Number(e.target.value))}
                  className="calibrated-slider w-full cursor-ew-resize"
                />
              </div>

              {/* Availability % */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> Availability Target
                  </span>
                  <span className="font-bold text-zinc-100">{availabilityPercent}%</span>
                </div>
                <input
                  type="range"
                  min={99.0}
                  max={99.999}
                  step={0.01}
                  value={availabilityPercent}
                  onChange={(e) => setAvailabilityPercent(Number(e.target.value))}
                  className="calibrated-slider w-full cursor-ew-resize"
                />
              </div>

              {/* Monthly Budget */}
              <div className="space-y-1 pt-2 border-t border-zinc-800">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400" /> Cloud Budget Ceiling
                  </span>
                  <span className="font-bold text-zinc-100">${budgetMonthlyUsd.toLocaleString()} / mo</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={30000}
                  step={500}
                  value={budgetMonthlyUsd}
                  onChange={(e) => setBudgetMonthlyUsd(Number(e.target.value))}
                  className="calibrated-slider w-full cursor-ew-resize"
                />
              </div>

              {/* Team Size */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400" /> Operating Team Size
                  </span>
                  <span className="font-bold text-zinc-100">{teamSize} Engineers</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="calibrated-slider w-full cursor-ew-resize"
                />
              </div>

              {/* Cloud Provider & Tech */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Target Cloud</label>
                  <select
                    value={cloudProvider}
                    onChange={(e: any) => setCloudProvider(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#14161a] border border-zinc-700/80 rounded-lg text-zinc-200 focus:outline-none"
                  >
                    <option value="aws">AWS</option>
                    <option value="gcp">Google Cloud (GCP)</option>
                    <option value="azure">Azure</option>
                    <option value="agnostic">Multi-Cloud / Agnostic</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Preferred Tech</label>
                  <input
                    type="text"
                    value={preferredLanguages}
                    onChange={(e) => setPreferredLanguages(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#14161a] border border-zinc-700/80 rounded-lg text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer - Machined Grey Chrome */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-700/80 bg-gradient-to-b from-[#1c1e24] to-[#15171b]">
          <div className="flex items-center gap-2 text-xs font-mono">
            {aiStatus?.available ? (
              <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                AI PROVIDER: {aiStatus.provider?.toUpperCase()}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                <Cpu className="w-4 h-4 text-zinc-400" />
                DETERMINISTIC HEURISTICS (ADR-010 ACTIVE)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="chrome-button px-4 py-2 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="chrome-button-accent flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow-lg cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>SYNTHESIZING CANDIDATES...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-zinc-950" />
                  <span>SYNTHESIZE & BENCHMARK</span>
                  <ArrowRight className="w-4 h-4 ml-0.5 text-zinc-950" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
