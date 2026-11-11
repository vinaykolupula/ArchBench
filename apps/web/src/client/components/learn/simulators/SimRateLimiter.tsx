import React, { useMemo, useState } from "react";
import { RateLimitAlgorithm, simulateRateLimiter } from "@archbench/learning-mode";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface SimProps {
  onInteract?: () => void;
}

const TRAFFIC_PATTERNS: Record<string, { label: string; pattern: number[] }> = {
  steady: {
    label: "Steady API Traffic",
    pattern: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  },
  boundary_attack: {
    label: "Boundary Edge Attack (2x Burst)",
    pattern: [1, 1, 1, 10, 10, 1, 1, 10, 10, 1, 1, 1],
  },
  flash_spike: {
    label: "Flash Spike Recovery",
    pattern: [2, 2, 14, 12, 8, 2, 2, 2, 2, 2, 2, 2],
  },
};

const ALGORITHMS: Array<{ id: RateLimitAlgorithm; label: string }> = [
  { id: "token_bucket", label: "Token Bucket" },
  { id: "leaky_bucket", label: "Leaky Bucket" },
  { id: "fixed_window", label: "Fixed Window" },
  { id: "sliding_window_log", label: "Sliding Log" },
  { id: "sliding_window_counter", label: "Sliding Counter" },
];

export const SimRateLimiter: React.FC<SimProps> = ({ onInteract }) => {
  const [algorithm, setAlgorithm] = useState<RateLimitAlgorithm>("token_bucket");
  const [capacity, setCapacity] = useState<number>(10);
  const [refillRate, setRefillRate] = useState<number>(4);
  const [patternKey, setPatternKey] = useState<string>("boundary_attack");

  const result = useMemo(
    () =>
      simulateRateLimiter(
        algorithm,
        capacity,
        refillRate,
        TRAFFIC_PATTERNS[patternKey].pattern
      ),
    [algorithm, capacity, refillRate, patternKey]
  );

  const act = (fn: () => void) => {
    fn();
    onInteract?.();
  };

  const maxBar = Math.max(
    14,
    ...result.ticks.map((t) => Math.max(t.incoming, t.allowed + t.rejected))
  );

  return (
    <div className="space-y-4 font-mono">
      {/* Controls */}
      <div className="bg-[#131519] border border-zinc-800 rounded-xl p-3.5 space-y-3 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {ALGORITHMS.map((alg) => (
            <button
              key={alg.id}
              onClick={() => act(() => setAlgorithm(alg.id))}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
                algorithm === alg.id
                  ? "chrome-button-accent"
                  : "bg-[#1a1d24] text-zinc-400 border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {alg.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Bucket / Window Quota</span>
              <span className="font-bold text-zinc-100">{capacity} req</span>
            </div>
            <input
              type="range"
              min={4}
              max={16}
              value={capacity}
              onChange={(e) => act(() => setCapacity(Number(e.target.value)))}
              className="calibrated-slider w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Refill / Drain Rate</span>
              <span className="font-bold text-zinc-100">{refillRate} req/tick</span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              value={refillRate}
              onChange={(e) => act(() => setRefillRate(Number(e.target.value)))}
              className="calibrated-slider w-full"
            />
          </div>

          <div>
            <div className="text-[10px] text-zinc-400 mb-1">Traffic Workload</div>
            <select
              value={patternKey}
              onChange={(e) => act(() => setPatternKey(e.target.value))}
              className="w-full bg-[#1a1d24] text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[11px]"
            >
              {Object.entries(TRAFFIC_PATTERNS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SVG Timeline Bar Chart */}
      <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3 drafting-dot-grid space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-zinc-300">
          <span className="text-zinc-400">Traffic Requests per Tick (Quota = {capacity} req/window)</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              Allowed (200 OK)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
              Throttled (HTTP 429)
            </span>
          </div>
        </div>
        <svg viewBox="0 0 720 195" className="w-full h-44">
          {/* Window Boundary markers every 4 ticks */}
          {[4, 8].map((boundaryTick) => {
            const bx = 42 + boundaryTick * 54;
            return (
              <g key={boundaryTick}>
                <line
                  x1={bx}
                  y1={24}
                  x2={bx}
                  y2={152}
                  stroke="#f59e0b"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.65"
                />
                <text x={bx + 5} y={20} fill="#fbbf24" fontSize="8.5" fontWeight="700">
                  Window Reset
                </text>
              </g>
            );
          })}

          {result.ticks.map((t, idx) => {
            const x = 44 + idx * 54;
            const allowedH = Math.round((t.allowed / maxBar) * 105);
            const rejH = Math.round((t.rejected / maxBar) * 105);
            const baselineY = 150;

            return (
              <g key={t.tick}>
                {/* Allowed Green Bar */}
                {allowedH > 0 && (
                  <rect
                    x={x}
                    y={baselineY - allowedH}
                    width={28}
                    height={allowedH}
                    rx={3}
                    fill="#10b981"
                    opacity="0.85"
                  />
                )}
                {/* Rejected 429 Red Stacked Bar */}
                {rejH > 0 && (
                  <rect
                    x={x}
                    y={baselineY - allowedH - rejH}
                    width={28}
                    height={rejH}
                    rx={3}
                    fill="#ef4444"
                    opacity="0.85"
                  />
                )}
                <text x={x + 14} y={165} textAnchor="middle" fill="#71717a" fontSize="9">
                  T{t.tick}
                </text>
                <text x={x + 14} y={178} textAnchor="middle" fill="#a1a1aa" fontSize="8">
                  {t.allowed}/{t.incoming}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Diagnostic Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">Total Admitted</div>
          <div className="text-lg font-extrabold text-emerald-300">
            {result.allowedCount}{" "}
            <span className="text-xs text-zinc-500">/ {result.totalSent} req</span>
          </div>
        </div>
        <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">Rejected HTTP 429</div>
          <div className="text-lg font-extrabold text-red-400">{result.rejected429Count}</div>
        </div>
        <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold mb-1">
            {result.boundaryBurstVulnerable ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">Boundary Leak Risk</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Boundary Protected</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-zinc-300 leading-relaxed">{result.summaryNote}</div>
        </div>
      </div>
    </div>
  );
};

