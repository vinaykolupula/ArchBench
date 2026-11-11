import React, { useMemo, useState } from "react";
import { simulateQuorum } from "@archbench/learning-mode";
import { WifiOff, Wifi, CheckCircle2, AlertTriangle } from "lucide-react";

interface SimProps {
  onInteract?: () => void;
}

export const SimQuorumCap: React.FC<SimProps> = ({ onInteract }) => {
  const [n, setN] = useState<number>(5);
  const [w, setW] = useState<number>(3);
  const [r, setR] = useState<number>(3);
  const [partitioned, setPartitioned] = useState<boolean>(false);

  const safeW = Math.min(n, w);
  const safeR = Math.min(n, r);

  const res = useMemo(
    () => simulateQuorum(n, safeW, safeR, partitioned),
    [n, safeW, safeR, partitioned]
  );

  const act = (fn: () => void) => {
    fn();
    onInteract?.();
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#131519] border border-zinc-800 rounded-xl p-3.5 text-xs">
        <div>
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
            <span>Replicas (N)</span>
            <span className="font-bold text-zinc-100">N = {res.n}</span>
          </div>
          <input
            type="range"
            min={3}
            max={7}
            step={2}
            value={n}
            onChange={(e) => act(() => setN(Number(e.target.value)))}
            className="calibrated-slider w-full"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
            <span>Write Quorum (W)</span>
            <span className="font-bold text-zinc-100">W = {res.w}</span>
          </div>
          <input
            type="range"
            min={1}
            max={res.n}
            value={safeW}
            onChange={(e) => act(() => setW(Number(e.target.value)))}
            className="calibrated-slider w-full"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
            <span>Read Quorum (R)</span>
            <span className="font-bold text-zinc-100">R = {res.r}</span>
          </div>
          <input
            type="range"
            min={1}
            max={res.n}
            value={safeR}
            onChange={(e) => act(() => setR(Number(e.target.value)))}
            className="calibrated-slider w-full"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => act(() => setPartitioned((p) => !p))}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase cursor-pointer border transition-all ${
              partitioned
                ? "bg-red-950/60 text-red-200 border-red-700"
                : "chrome-button text-zinc-200"
            }`}
          >
            {partitioned ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span>Heal Fiber Split</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sever Network (P)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SVG Replica Cluster Diagram */}
      <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3 drafting-dot-grid">
        <svg viewBox="0 0 740 190" className="w-full h-44">
          {partitioned && (
            <g>
              <line
                x1={Math.ceil(res.n / 2) * (700 / res.n) + 20}
                y1={14}
                x2={Math.ceil(res.n / 2) * (700 / res.n) + 20}
                y2={176}
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              <text
                x={Math.ceil(res.n / 2) * (700 / res.n) + 28}
                y={26}
                fill="#fca5a5"
                fontSize="9"
                fontWeight="700"
              >
                NETWORK PARTITION
              </text>
            </g>
          )}

          {res.replicas.map((rep, idx) => {
            const slotW = 700 / res.n;
            const x = 20 + idx * slotW + slotW / 2 - 42;
            const y = 42;
            const isV2 = rep.version === 2;

            return (
              <g key={rep.id}>
                <rect
                  x={x}
                  y={y}
                  width={84}
                  height={98}
                  rx={8}
                  fill={isV2 ? "#15251f" : "#1c1917"}
                  stroke={isV2 ? "#10b981" : "#71717a"}
                  strokeWidth={rep.participatedInRead ? 2.2 : 1.3}
                />
                <text x={x + 42} y={y + 20} textAnchor="middle" fill="#e4e4e7" fontSize="10" fontWeight="700">
                  Node {rep.id} ({rep.partitionGroup})
                </text>
                <text
                  x={x + 42}
                  y={y + 44}
                  textAnchor="middle"
                  fill={isV2 ? "#34d399" : "#fbbf24"}
                  fontSize="14"
                  fontWeight="800"
                >
                  v{rep.version}
                </text>
                <text x={x + 42} y={y + 66} textAnchor="middle" fill="#a1a1aa" fontSize="8">
                  {rep.participatedInWrite ? "WROTE ACK" : "NO WRITE"}
                </text>
                <rect
                  x={x + 12}
                  y={y + 74}
                  width={60}
                  height={16}
                  rx={4}
                  fill={rep.participatedInRead ? "#0ea5e9" : "#27272a"}
                  opacity={rep.participatedInRead ? 0.35 : 0.7}
                />
                <text
                  x={x + 42}
                  y={y + 85}
                  textAnchor="middle"
                  fill={rep.participatedInRead ? "#7dd3fc" : "#71717a"}
                  fontSize="8"
                  fontWeight="700"
                >
                  {rep.participatedInRead ? "READ QUORUM" : "IDLE"}
                </text>
              </g>
            );
          })}

          <text x="20" y="172" fill="#d4d4d8" fontSize="10" fontWeight="700">
            INVARIANT: W ({res.w}) + R ({res.r}) = {res.w + res.r} {res.strictQuorum ? ">" : "<="} N ({res.n})
            {"  •  "}
            {res.capClassification}
          </text>
        </svg>
      </div>

      {/* Diagnostic Status Card */}
      <div
        className={`rounded-xl border p-3.5 text-xs flex items-start gap-2.5 ${
          res.staleReadOccurred || !res.readSucceeded
            ? "bg-amber-950/30 border-amber-800/70"
            : "bg-emerald-950/30 border-emerald-800/70"
        }`}
      >
        {res.staleReadOccurred || !res.readSucceeded ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <div className="font-bold text-zinc-100 uppercase">
            {res.capClassification}
          </div>
          <div className="text-zinc-300 leading-relaxed text-[11px]">{res.explanation}</div>
        </div>
      </div>
    </div>
  );
};

