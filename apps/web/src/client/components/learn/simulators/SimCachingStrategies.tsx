import React, { useMemo, useState } from "react";
import {
  CacheEvictionType,
  CacheStrategyType,
  simulateCacheStrategy,
} from "@archbench/learning-mode";
import { Cpu, Database, AlertTriangle } from "lucide-react";

interface SimProps {
  onInteract?: () => void;
}

const WORKLOAD_OPS: Array<{ op: "READ" | "WRITE"; key: string }> = [
  { op: "READ", key: "A" },
  { op: "READ", key: "A" },
  { op: "WRITE", key: "B" },
  { op: "READ", key: "C" },
  { op: "READ", key: "A" },
  { op: "WRITE", key: "D" },
  { op: "READ", key: "B" },
  { op: "READ", key: "E" },
  { op: "READ", key: "A" },
  { op: "READ", key: "B" },
];

const STRATEGIES: Array<{ id: CacheStrategyType; label: string }> = [
  { id: "cache_aside", label: "Cache-Aside" },
  { id: "write_through", label: "Write-Through" },
  { id: "write_behind", label: "Write-Behind" },
  { id: "write_around", label: "Write-Around" },
];

export const SimCachingStrategies: React.FC<SimProps> = ({ onInteract }) => {
  const [strategy, setStrategy] = useState<CacheStrategyType>("cache_aside");
  const [eviction, setEviction] = useState<CacheEvictionType>("LRU");
  const [capacity, setCapacity] = useState<number>(3);

  const result = useMemo(
    () => simulateCacheStrategy(strategy, eviction, capacity, WORKLOAD_OPS),
    [strategy, eviction, capacity]
  );

  const act = (fn: () => void) => {
    fn();
    onInteract?.();
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#131519] border border-zinc-800 rounded-xl p-3.5 text-xs">
        <div className="md:col-span-2">
          <div className="text-[10px] text-zinc-500 uppercase mb-1.5">Write / Read Topology</div>
          <div className="flex flex-wrap gap-1.5">
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                onClick={() => act(() => setStrategy(s.id))}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
                  strategy === s.id
                    ? "chrome-button-accent"
                    : "bg-[#1a1d24] text-zinc-400 border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="text-[10px] text-zinc-500 uppercase mb-1">Eviction</div>
            <div className="flex gap-1">
              {(["LRU", "LFU"] as const).map((ev) => (
                <button
                  key={ev}
                  onClick={() => act(() => setEviction(ev))}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold cursor-pointer border ${
                    eviction === ev
                      ? "chrome-button-accent"
                      : "bg-[#1a1d24] text-zinc-400 border-zinc-700"
                  }`}
                >
                  {ev}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Slots</span>
              <span className="font-bold text-zinc-100">{capacity}</span>
            </div>
            <input
              type="range"
              min={2}
              max={5}
              value={capacity}
              onChange={(e) => act(() => setCapacity(Number(e.target.value)))}
              className="calibrated-slider w-full"
            />
          </div>
        </div>
      </div>

      {/* Interactive SVG Cache Slots + DB Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-[#111317] border border-zinc-800 rounded-xl p-3 drafting-dot-grid space-y-3">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Redis Memory Slots
            </span>
            <span>
              Hit Rate: <strong className="text-emerald-300">{result.hitRatePercent}%</strong>
            </span>
          </div>

          <div className="space-y-2">
            {result.finalSlots.map((slot) => (
              <div
                key={slot.key}
                className="flex items-center justify-between bg-[#181b22] border border-zinc-700 px-3 py-2 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-100 font-bold">
                    Key:{slot.key}
                  </span>
                  <span className="text-zinc-400">v{slot.valueVersion}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-zinc-500">Hits: {slot.freq}</span>
                  {slot.dirty && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold">
                      DIRTY
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px]">
            <div className="bg-[#181b22] border border-zinc-800 rounded-lg p-2">
              <div className="text-zinc-500">Avg Latency</div>
              <div className="font-bold text-zinc-100 text-sm">{result.avgLatencyMs}ms</div>
            </div>
            <div className="bg-[#181b22] border border-zinc-800 rounded-lg p-2">
              <div className="text-zinc-500">DB Reads</div>
              <div className="font-bold text-zinc-100 text-sm">{result.dbReads}</div>
            </div>
            <div className="bg-[#181b22] border border-zinc-800 rounded-lg p-2">
              <div className="text-zinc-500">DB Writes</div>
              <div className="font-bold text-zinc-100 text-sm">{result.dbWrites}</div>
            </div>
          </div>

          <div className="bg-[#16181e] border border-zinc-800 rounded-lg p-2.5 text-[11px] flex items-center gap-2">
            <AlertTriangle
              className={`w-4 h-4 shrink-0 ${
                result.staleWindowRisk.includes("High") ? "text-red-400" : "text-emerald-400"
              }`}
            />
            <span className="text-zinc-300">
              Data Loss / Stale Risk: <strong className="text-zinc-100">{result.staleWindowRisk}</strong>
            </span>
          </div>
        </div>

        {/* Step-by-step Execution Trace */}
        <div className="lg:col-span-7 bg-[#16181e] border border-zinc-800 rounded-xl p-3 space-y-2 max-h-72 overflow-y-auto">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase mb-1">
            <Database className="w-3.5 h-3.5" /> Operation Trace (10-Step Workload)
          </div>
          {result.trace.map((item) => {
            const isHit = item.outcome === "CACHE_HIT";
            const isBuf = item.outcome === "ASYNC_BUFFER";
            return (
              <div
                key={item.step}
                className="flex items-center justify-between text-[11px] bg-[#111317] border border-zinc-800/80 px-2.5 py-1.5 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">#{item.step}</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                      item.op === "READ"
                        ? "bg-zinc-800 text-zinc-200"
                        : "bg-sky-950 text-sky-300 border border-sky-800"
                    }`}
                  >
                    {item.op} {item.key}
                  </span>
                  <span
                    className={
                      isHit
                        ? "text-emerald-300 font-bold"
                        : isBuf
                        ? "text-amber-300 font-bold"
                        : "text-zinc-300"
                    }
                  >
                    {item.outcome}
                  </span>
                  {item.evictedKey && (
                    <span className="text-[10px] text-red-400">
                      (evicted {item.evictedKey})
                    </span>
                  )}
                </div>
                <span className="text-zinc-400">{item.latencyMs}ms</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

