import React, { useState } from "react";
import { RefreshCw, AlertOctagon, CheckCircle2 } from "lucide-react";

interface SimProps {
  onInteract?: () => void;
}

export const SimReplicationFailover: React.FC<SimProps> = ({ onInteract }) => {
  const [replicaLagMs, setReplicaLagMs] = useState<number>(650);
  const [readYourWritesPin, setReadYourWritesPin] = useState<boolean>(false);
  const [replicationMode, setReplicationMode] = useState<"async" | "semi_sync">("async");
  const [lastOutcome, setLastOutcome] = useState<{
    status: "stale" | "fresh";
    detail: string;
  }>({
    status: "fresh",
    detail: "Click 'Write Profile & Immediately Reload' to test replica staleness.",
  });

  const act = (fn: () => void) => {
    fn();
    onInteract?.();
  };

  const simulateWriteAndRead = () => {
    onInteract?.();
    if (replicationMode === "semi_sync" || readYourWritesPin || replicaLagMs < 40) {
      setLastOutcome({
        status: "fresh",
        detail:
          replicationMode === "semi_sync"
            ? "Semi-sync replicated LSN #904 to quorum follower BEFORE returning 200 OK — reload returned fresh v2!"
            : "Read-Your-Writes routed author's read to Primary DB for 5s window (or verified replica LSN >= #904) — zero stale surprise!",
      });
    } else {
      setLastOutcome({
        status: "stale",
        detail: `Replica lagged ${replicaLagMs}ms behind Primary! User saved bio v2 -> reloaded page 80ms later -> LB hit lagging Follower at LSN #901 -> old bio v1 appeared!`,
      });
    }
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#131519] border border-zinc-800 rounded-xl p-3.5 text-xs">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase mb-1">WAL Replication Mode</div>
          <div className="flex gap-1.5">
            {(
              [
                { id: "async", label: "Async Replication" },
                { id: "semi_sync", label: "Semi-Sync + Fencing" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => act(() => setReplicationMode(m.id))}
                className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold uppercase cursor-pointer border ${
                  replicationMode === m.id
                    ? "chrome-button-accent"
                    : "bg-[#1a1d24] text-zinc-400 border-zinc-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
            <span>Async Network WAL Lag</span>
            <span className="font-bold text-amber-300">
              {replicationMode === "semi_sync" ? "0 ms (Synced)" : `${replicaLagMs} ms`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1500}
            step={50}
            disabled={replicationMode === "semi_sync"}
            value={replicaLagMs}
            onChange={(e) => act(() => setReplicaLagMs(Number(e.target.value)))}
            className="calibrated-slider w-full disabled:opacity-40"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => act(() => setReadYourWritesPin((p) => !p))}
            className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
              readYourWritesPin
                ? "bg-emerald-950/60 text-emerald-200 border-emerald-700"
                : "bg-[#1a1d24] text-zinc-400 border-zinc-700"
            }`}
          >
            {readYourWritesPin ? "Pin Writes -> Primary: ON" : "Pin Writes -> Primary: OFF"}
          </button>
        </div>
      </div>

      {/* SVG Leader-Follower Diagram */}
      <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3 drafting-dot-grid">
        <svg viewBox="0 0 720 175" className="w-full h-40">
          <defs>
            <marker id="rep-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="#34d399" />
            </marker>
          </defs>
          <rect x="30" y="55" width="125" height="62" rx="8" fill="#1b1e25" stroke="#52525b" />
          <text x="92" y="80" textAnchor="middle" fill="#f4f4f5" fontSize="10" fontWeight="700">
            Client Session
          </text>
          <text x="92" y="98" textAnchor="middle" fill="#a1a1aa" fontSize="8.5">
            Writes v2 @ t=0ms
          </text>

          <rect x="240" y="25" width="160" height="60" rx="8" fill="#15251f" stroke="#10b981" strokeWidth="1.6" />
          <text x="320" y="49" textAnchor="middle" fill="#f4f4f5" fontSize="10.5" fontWeight="700">
            Primary DB (Leader)
          </text>
          <text x="320" y="68" textAnchor="middle" fill="#6ee7b7" fontSize="9">
            LSN #904 | State: v2
          </text>

          <rect
            x="495"
            y="95"
            width="185"
            height="60"
            rx="8"
            fill={lastOutcome.status === "stale" ? "#261717" : "#1b1e25"}
            stroke={lastOutcome.status === "stale" ? "#ef4444" : "#52525b"}
            strokeWidth="1.6"
          />
          <text x="587" y="119" textAnchor="middle" fill="#f4f4f5" fontSize="10" fontWeight="700">
            Read Replica (Follower)
          </text>
          <text
            x="587"
            y="138"
            textAnchor="middle"
            fill={replicationMode === "semi_sync" || replicaLagMs < 40 ? "#6ee7b7" : "#fbbf24"}
            fontSize="9"
          >
            {replicationMode === "semi_sync"
              ? "LSN #904 | State: v2 (SYNCED)"
              : `LSN #901 | Lags ${replicaLagMs}ms (v1)`}
          </text>

          <line x1="155" y1="74" x2="236" y2="56" stroke="#34d399" strokeWidth="1.8" markerEnd="url(#rep-arrow)" />
          <line
            x1="400"
            y1="56"
            x2="492"
            y2="120"
            stroke="#fbbf24"
            strokeWidth="1.8"
            strokeDasharray={replicationMode === "async" ? "4 3" : undefined}
            markerEnd="url(#rep-arrow)"
          />
          <text x="462" y="75" fill="#fbbf24" fontSize="8.5">
            {replicationMode === "async" ? "Async WAL Stream" : "Sync WAL Commit"}
          </text>
          <line
            x1="155"
            y1="96"
            x2={readYourWritesPin ? 236 : 490}
            y2={readYourWritesPin ? 70 : 126}
            stroke={readYourWritesPin ? "#38bdf8" : "#a1a1aa"}
            strokeWidth="1.5"
            strokeDasharray="3 3"
            markerEnd="url(#rep-arrow)"
          />
        </svg>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <button
          onClick={simulateWriteAndRead}
          className="chrome-button-accent px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Write Profile &amp; Immediately Reload</span>
        </button>
        <div
          className={`flex-1 rounded-xl border p-3 text-[11px] flex items-start gap-2 ${
            lastOutcome.status === "stale"
              ? "bg-red-950/30 border-red-800/80 text-red-200"
              : "bg-emerald-950/30 border-emerald-800/80 text-emerald-200"
          }`}
        >
          {lastOutcome.status === "stale" ? (
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span>{lastOutcome.detail}</span>
        </div>
      </div>
    </div>
  );
};

