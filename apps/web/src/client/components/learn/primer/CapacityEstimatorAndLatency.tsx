import React, { useMemo, useState } from "react";
import {
  CAPACITY_PRESETS,
  CapacityEstimationInput,
  LATENCY_LADDER,
  calculateCapacityEstimates,
} from "@archbench/learning-mode";
import { Calculator, Gauge, HelpCircle } from "lucide-react";

export const CapacityEstimatorAndLatency: React.FC = () => {
  const [input, setInput] = useState<CapacityEstimationInput>(
    CAPACITY_PRESETS[0].input
  );
  const [catFilter, setCatFilter] = useState<string>("all");
  const [showFormulas, setShowFormulas] = useState<boolean>(true);

  const estimate = useMemo(() => calculateCapacityEstimates(input), [input]);

  const updateField = (key: keyof CapacityEstimationInput, val: number) => {
    setInput((prev) => ({ ...prev, [key]: val }));
  };

  const filteredLatency = useMemo(
    () =>
      catFilter === "all"
        ? LATENCY_LADDER
        : LATENCY_LADDER.filter((i) => i.category === catFilter),
    [catFilter]
  );

  const maxLogNs = Math.log10(LATENCY_LADDER[LATENCY_LADDER.length - 1].nanoseconds + 1);

  return (
    <div className="space-y-6 font-mono">
      {/* Back-of-the-Envelope Calculator */}
      <div className="chrome-chassis drafting-corners rounded-2xl p-5 border border-zinc-700/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-extrabold text-zinc-100 uppercase">
                Back-of-the-Envelope Capacity Estimator
              </h3>
              <p className="text-[11px] text-zinc-400">
                100% deterministic math anchored on 86,400 sec/day &amp; 80/20 Pareto caching
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CAPACITY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setInput(preset.input)}
                className="chrome-button px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders & Numeric Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#131519] border border-zinc-800 rounded-xl p-3">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Daily Active Users</span>
              <span className="font-bold text-zinc-100">
                {(input.dailyActiveUsers / 1_000_000).toFixed(1)}M
              </span>
            </div>
            <input
              type="range"
              min={100_000}
              max={1_000_000_000}
              step={1_000_000}
              value={input.dailyActiveUsers}
              onChange={(e) => updateField("dailyActiveUsers", Number(e.target.value))}
              className="calibrated-slider w-full"
            />
          </div>

          <div className="bg-[#131519] border border-zinc-800 rounded-xl p-3">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Actions / User / Day</span>
              <span className="font-bold text-zinc-100">{input.actionsPerUserPerDay}</span>
            </div>
            <input
              type="range"
              min={1}
              max={600}
              value={input.actionsPerUserPerDay}
              onChange={(e) => updateField("actionsPerUserPerDay", Number(e.target.value))}
              className="calibrated-slider w-full"
            />
          </div>

          <div className="bg-[#131519] border border-zinc-800 rounded-xl p-3">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Read : Write Ratio</span>
              <span className="font-bold text-zinc-100">{input.readToWriteRatio} : 1</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={100}
              step={0.5}
              value={input.readToWriteRatio}
              onChange={(e) => updateField("readToWriteRatio", Number(e.target.value))}
              className="calibrated-slider w-full"
            />
          </div>

          <div className="bg-[#131519] border border-zinc-800 rounded-xl p-3">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Payload Size (KB)</span>
              <span className="font-bold text-zinc-100">{input.payloadSizeKb} KB</span>
            </div>
            <input
              type="range"
              min={0.25}
              max={500}
              step={0.25}
              value={input.payloadSizeKb}
              onChange={(e) => updateField("payloadSizeKb", Number(e.target.value))}
              className="calibrated-slider w-full"
            />
          </div>

          <div className="bg-[#131519] border border-zinc-800 rounded-xl p-3">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Peak Surge Factor</span>
              <span className="font-bold text-zinc-100">{input.peakMultiplier}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={input.peakMultiplier}
              onChange={(e) => updateField("peakMultiplier", Number(e.target.value))}
              className="calibrated-slider w-full"
            />
          </div>

          <div className="bg-[#131519] border border-zinc-800 rounded-xl p-3">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Retention Window</span>
              <span className="font-bold text-zinc-100">{input.retentionYears} Yrs</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={input.retentionYears}
              onChange={(e) => updateField("retentionYears", Number(e.target.value))}
              className="calibrated-slider w-full"
            />
          </div>

          <div className="bg-[#131519] border border-zinc-800 rounded-xl p-3">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Replication Factor</span>
              <span className="font-bold text-zinc-100">{input.replicationFactor}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={input.replicationFactor}
              onChange={(e) => updateField("replicationFactor", Number(e.target.value))}
              className="calibrated-slider w-full"
            />
          </div>

          <div className="bg-[#131519] border border-zinc-800 rounded-xl p-3">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Hot Cache Set %</span>
              <span className="font-bold text-zinc-100">{input.cacheHotSetPercent}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={input.cacheHotSetPercent}
              onChange={(e) => updateField("cacheHotSetPercent", Number(e.target.value))}
              className="calibrated-slider w-full"
            />
          </div>
        </div>

        {/* Computed Sizing Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3">
            <div className="text-[10px] text-zinc-500 uppercase">Avg / Peak RPS</div>
            <div className="text-sm font-extrabold text-zinc-100 mt-0.5">
              {estimate.avgRps.toLocaleString()} /{" "}
              <span className="text-amber-300">{estimate.peakRps.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              R: {estimate.readQps.toLocaleString()} | W: {estimate.writeQps.toLocaleString()} QPS
            </div>
          </div>

          <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3">
            <div className="text-[10px] text-zinc-500 uppercase">Storage ({input.retentionYears} Yr)</div>
            <div className="text-sm font-extrabold text-zinc-100 mt-0.5">
              {estimate.replicatedStorageTb.toLocaleString()} TB
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              Daily new: {estimate.dailyStorageGb.toLocaleString()} GB
            </div>
          </div>

          <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3">
            <div className="text-[10px] text-zinc-500 uppercase">Redis Hot Set &amp; Fleet</div>
            <div className="text-sm font-extrabold text-emerald-300 mt-0.5">
              {estimate.hotCacheMemoryGb.toLocaleString()} GB RAM
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              ~{estimate.estimatedAppServers} App Nodes | Egress: {estimate.egressBandwidthMbps.toLocaleString()} Mbps
            </div>
          </div>

          <div className="bg-emerald-950/25 border border-emerald-800/60 rounded-xl p-3">
            <div className="text-[10px] text-emerald-400 uppercase font-bold">
              Recommended Tiering
            </div>
            <div className="text-[11px] font-bold text-zinc-100 mt-1 leading-snug">
              {estimate.recommendedArchetype}
            </div>
          </div>
        </div>

        {/* Live Step-by-Step Math ("Show Your Work") */}
        <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-sky-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Exact Interview Math Breakdown (How These Sliders Calculate)</span>
            </div>
            <button
              onClick={() => setShowFormulas((f) => !f)}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              {showFormulas ? "Hide Steps" : "Show Steps"}
            </button>
          </div>

          {showFormulas && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-sans text-xs text-zinc-300">
              <div className="bg-[#16181e] border border-zinc-800/80 rounded-lg p-2.5 space-y-1">
                <div className="font-mono text-[10px] text-zinc-400 uppercase">
                  1. Requests Per Second (RPS)
                </div>
                <div>
                  {(input.dailyActiveUsers / 1_000_000).toFixed(1)}M DAU &times; {input.actionsPerUserPerDay} actions &divide; 86,400s
                  = <strong className="text-zinc-100 font-mono">{estimate.avgRps.toLocaleString()} avg RPS</strong>
                </div>
                <div>
                  &times; {input.peakMultiplier}x peak surge ={" "}
                  <strong className="text-amber-300 font-mono">{estimate.peakRps.toLocaleString()} peak RPS</strong>{" "}
                  (1 app box &asymp; 2.5K RPS &rarr; ~{estimate.estimatedAppServers} containers)
                </div>
              </div>

              <div className="bg-[#16181e] border border-zinc-800/80 rounded-lg p-2.5 space-y-1">
                <div className="font-mono text-[10px] text-zinc-400 uppercase">
                  2. Storage, Cache RAM &amp; Egress
                </div>
                <div>
                  Writes/sec ({estimate.writeQps.toLocaleString()}) &times; {input.payloadSizeKb} KB &times; 86,400s
                  = <strong className="text-zinc-100 font-mono">{estimate.dailyStorageGb} GB/day</strong> &rarr;{" "}
                  {estimate.replicatedStorageTb} TB ({input.retentionYears}y &times; {input.replicationFactor}x)
                </div>
                <div>
                  Hot {input.cacheHotSetPercent}% daily RAM ={" "}
                  <strong className="text-emerald-300 font-mono">{estimate.hotCacheMemoryGb} GB Redis</strong>{" "}
                  | Outbound traffic ={" "}
                  <strong className="text-sky-300 font-mono">{estimate.egressBandwidthMbps.toLocaleString()} Mbps</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Jeff Dean Latency Ladder */}
      <div className="chrome-chassis drafting-corners rounded-2xl p-5 border border-zinc-700/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className="text-sm font-extrabold text-zinc-100 uppercase">
                Numbers Every Engineer Should Know (Logarithmic Scale)
              </h3>
              <p className="font-sans text-xs text-zinc-400">
                Imagine 1 nanosecond (CPU cache) = 1 second on a human watch &mdash; suddenly you feel how painful disk seeks (days) and cross-ocean hops (years!) really are.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {(["all", "cpu", "memory", "disk", "network"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer border ${
                  catFilter === cat
                    ? "chrome-button-accent"
                    : "bg-[#131519] text-zinc-400 border-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredLatency.map((item) => {
            const pct = Math.max(
              6,
              Math.round((Math.log10(item.nanoseconds + 1) / maxLogNs) * 100)
            );
            const barColor =
              item.category === "cpu"
                ? "bg-emerald-500"
                : item.category === "memory"
                ? "bg-sky-500"
                : item.category === "disk"
                ? "bg-amber-500"
                : "bg-red-500";

            return (
              <div
                key={item.id}
                className="bg-[#131519] border border-zinc-800 rounded-xl p-3 space-y-1.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-zinc-100">
                    {item.operation}
                    <span className="ml-2 text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-zinc-400">Analogy: {item.humanScaleAnalogy}</span>
                    <span className="font-extrabold text-amber-300">{item.displayTime}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[#0d0f12] rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} opacity-80`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-zinc-400">{item.architecturalTakeaway}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

