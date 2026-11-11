import React, { useMemo, useState } from "react";
import { RetryStrategyType, simulateRetryStorm } from "@archbench/learning-mode";
import { ShieldCheck, ZapOff } from "lucide-react";

interface SimProps {
  onInteract?: () => void;
}

const STRATEGIES: Array<{ id: RetryStrategyType; label: string }> = [
  { id: "immediate", label: "Naive Immediate Retry" },
  { id: "fixed_backoff", label: "Fixed Backoff (No Jitter)" },
  { id: "exp_backoff_jitter", label: "Exp Backoff + Full Jitter" },
  { id: "circuit_breaker_jitter", label: "Circuit Breaker + Jitter" },
];

export const SimRetryCircuitBreaker: React.FC<SimProps> = ({ onInteract }) => {
  const [strategy, setStrategy] = useState<RetryStrategyType>("immediate");
  const [workers, setWorkers] = useState<number>(60);

  const result = useMemo(
    () => simulateRetryStorm(workers, strategy),
    [workers, strategy]
  );

  const act = (fn: () => void) => {
    fn();
    onInteract?.();
  };

  const maxIncoming = Math.max(100, ...result.timeline.map((t) => t.incomingRequests));

  return (
    <div className="space-y-4 font-mono">
      <div className="bg-[#131519] border border-zinc-800 rounded-xl p-3.5 space-y-3 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => act(() => setStrategy(s.id))}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
                strategy === s.id
                  ? "chrome-button-accent"
                  : "bg-[#1a1d24] text-zinc-400 border-zinc-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="max-w-sm">
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
            <span>Concurrent Retrying Callers</span>
            <span className="font-bold text-zinc-100">{workers} Callers</span>
          </div>
          <input
            type="range"
            min={20}
            max={120}
            step={10}
            value={workers}
            onChange={(e) => act(() => setWorkers(Number(e.target.value)))}
            className="calibrated-slider w-full"
          />
        </div>
      </div>

      {/* SVG Dual Curve: Incoming Retry Amplification + Downstream Health */}
      <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3 drafting-dot-grid">
        <svg viewBox="0 0 720 190" className="w-full h-44">
          {result.timeline.map((pt, idx) => {
            const x = 44 + idx * 54;
            const loadH = Math.round((pt.incomingRequests / maxIncoming) * 115);
            const healthH = Math.round((pt.downstreamHealthPercent / 100) * 115);
            const stateColor =
              pt.circuitState === "OPEN"
                ? "#f59e0b"
                : pt.circuitState === "HALF_OPEN"
                ? "#38bdf8"
                : "#10b981";
            return (
              <g key={pt.tick}>
                {/* Incoming Load Bar */}
                <rect
                  x={x}
                  y={145 - loadH}
                  width={16}
                  height={loadH}
                  rx={2}
                  fill="#ef4444"
                  opacity="0.7"
                />
                {/* Downstream Health Bar */}
                <rect
                  x={x + 18}
                  y={145 - healthH}
                  width={16}
                  height={healthH}
                  rx={2}
                  fill="#10b981"
                  opacity="0.85"
                />
                <circle cx={x + 17} cy={156} r={3.5} fill={stateColor} />
                <text x={x + 17} y={172} textAnchor="middle" fill="#71717a" fontSize="8.5">
                  T{pt.tick}
                </text>
              </g>
            );
          })}

          <rect x="40" y="10" width="9" height="9" fill="#ef4444" />
          <text x="54" y="18" fill="#d4d4d8" fontSize="9">
            Incoming Retry Amplification Req/tick
          </text>
          <rect x="290" y="10" width="9" height="9" fill="#10b981" />
          <text x="304" y="18" fill="#d4d4d8" fontSize="9">
            Downstream Health %
          </text>
          <circle cx="465" cy="14" r="4" fill="#f59e0b" />
          <text x="474" y="18" fill="#d4d4d8" fontSize="9">
            Circuit OPEN (Fast-Fail)
          </text>
        </svg>
      </div>

      {/* Diagnostic Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">Total Generated Load</div>
          <div className="text-lg font-extrabold text-zinc-100">
            {result.totalGeneratedRequests.toLocaleString()} req
          </div>
          <div className="text-[10px] text-zinc-400">Peak Load Multiplier: {result.peakLoadMultiplier}x</div>
        </div>

        <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">Circuit Breaker Trip</div>
          <div className="text-lg font-extrabold text-amber-300">
            {result.circuitTrippedAtTick ? `Tick #${result.circuitTrippedAtTick}` : "No Breaker"}
          </div>
        </div>

        <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3 flex items-start gap-2">
          {result.downstreamRecovered ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ZapOff className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="text-[11px] text-zinc-300">
            {result.downstreamRecovered
              ? "Downstream DB recovered cleanly! Jitter & circuit fast-fail drained connection backlog."
              : "CATASTROPHIC COLLAPSE: Unjittered retries pinned CPU at 0% health even after the transient error cleared."}
          </div>
        </div>
      </div>
    </div>
  );
};

