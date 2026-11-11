import React, { useMemo, useState } from "react";
import { Flame, ShieldCheck } from "lucide-react";

interface SimProps {
  onInteract?: () => void;
}

type PartitionScheme = "range" | "hash" | "salted";

export const SimShardingStorage: React.FC<SimProps> = ({ onInteract }) => {
  const [scheme, setScheme] = useState<PartitionScheme>("range");
  const [celebritySkewPct, setCelebritySkewPct] = useState<number>(65);
  const [shards] = useState<number>(4);

  const act = (fn: () => void) => {
    fn();
    onInteract?.();
  };

  const shardLoads = useMemo(() => {
    const baseTraffic = 100 - celebritySkewPct;
    return Array.from({ length: shards }, (_, idx) => {
      let pct = 0;
      if (scheme === "range") {
        // Recent-time or celebrity ID range lands almost exclusively on Shard 4 / Shard 1
        pct = idx === shards - 1 ? celebritySkewPct + baseTraffic * 0.45 : baseTraffic * 0.18;
      } else if (scheme === "hash") {
        // Uniform random traffic balanced, BUT one hot celebrity UUID still slams 1 single shard!
        pct = idx === 1 ? celebritySkewPct + baseTraffic / shards : baseTraffic / shards;
      } else {
        // Salted key (celebrity#0..#3) diffuses hot-key cleanly across ALL shards!
        pct = 100 / shards + (idx % 2 === 0 ? 1.5 : -1.5);
      }
      return {
        shardId: `Shard #${idx + 1}`,
        loadPercent: Math.min(100, Math.max(4, Number(pct.toFixed(1)))),
        isHot: pct > 52,
      };
    });
  }, [scheme, celebritySkewPct, shards]);

  const peakShard = Math.max(...shardLoads.map((s) => s.loadPercent));

  return (
    <div className="space-y-4 font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#131519] border border-zinc-800 rounded-xl p-3.5 text-xs">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase mb-1.5">Partitioning Key Strategy</div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "range", label: "Range (e.g. Date/ID)" },
                { id: "hash", label: "hash(celebrity_id)" },
                { id: "salted", label: "Salted hash(key + #0..9)" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => act(() => setScheme(opt.id))}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
                  scheme === opt.id
                    ? "chrome-button-accent"
                    : "bg-[#1a1d24] text-zinc-400 border-zinc-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
            <span>Viral Celebrity Hot-Key Traffic Share</span>
            <span className="font-bold text-amber-300">{celebritySkewPct}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={85}
            value={celebritySkewPct}
            onChange={(e) => act(() => setCelebritySkewPct(Number(e.target.value)))}
            className="calibrated-slider w-full"
          />
        </div>
      </div>

      {/* SVG Shard Utilization Bars */}
      <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3 drafting-dot-grid">
        <svg viewBox="0 0 720 175" className="w-full h-40">
          {shardLoads.map((s, idx) => {
            const bx = 36 + idx * 170;
            const barH = Math.round((s.loadPercent / 100) * 105);
            return (
              <g key={s.shardId}>
                <rect x={bx} y={24} width={118} height={106} rx={6} fill="#181b22" stroke="#3f3f46" />
                <rect
                  x={bx + 2}
                  y={128 - barH}
                  width={114}
                  height={barH}
                  rx={4}
                  fill={s.isHot ? "#ef4444" : "#10b981"}
                  opacity="0.75"
                />
                <text x={bx + 59} y={148} textAnchor="middle" fill="#e4e4e7" fontSize="10" fontWeight="700">
                  {s.shardId}
                </text>
                <text
                  x={bx + 59}
                  y={42}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="800"
                >
                  {s.loadPercent}% CPU
                </text>
              </g>
            );
          })}
          {/* Threshold dashed line */}
          <line x1={25} y1={72} x2={695} y2={72} stroke="#f59e0b" strokeDasharray="4 4" />
          <text x={30} y={16} fill="#fbbf24" fontSize="8.5" fontWeight="700">
            52% CPU SATURATION THRESHOLD — MAX SHARD LOAD: {peakShard}%
          </text>
        </svg>
      </div>

      <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3 text-[11px] flex items-start gap-2.5">
        {peakShard > 52 ? (
          <Flame className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
        <div className="text-zinc-300 leading-relaxed">
          {scheme === "range" && (
            <span>
              <strong className="text-amber-300">Append Hotspot:</strong> Time/ID range sharding piles newest
              traffic onto the rightmost shard, idling the other 3 machines.
            </span>
          )}
          {scheme === "hash" && (
            <span>
              <strong className="text-red-300">Single-Key Hotspot:</strong> Uniform hashing distributes <em>different</em>{" "}
              users evenly, yet one celebrity key still melts Shard #2!
            </span>
          )}
          {scheme === "salted" && (
            <span>
              <strong className="text-emerald-300">Salted Mitigation:</strong> Appending a random suffix{" "}
              <code className="text-zinc-100">key#00..#09</code> splits viral writes evenly across all{" "}
              {shards} shards (at the minor cost of fanout-reading 4 shards only for flagged VIPs).
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

