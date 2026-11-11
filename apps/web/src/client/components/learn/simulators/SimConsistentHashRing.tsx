import React, { useMemo, useState } from "react";
import { simulateConsistentHashRing } from "@archbench/learning-mode";
import { RefreshCw, Skull, Network } from "lucide-react";

interface SimProps {
  onInteract?: () => void;
}

export const SimConsistentHashRing: React.FC<SimProps> = ({ onInteract }) => {
  const [nodeCount, setNodeCount] = useState<number>(4);
  const [vnodesPerServer, setVnodesPerServer] = useState<number>(12);
  const [mode, setMode] = useState<"consistent" | "modulo">("consistent");
  const [removeLastNode, setRemoveLastNode] = useState<boolean>(false);

  const result = useMemo(
    () =>
      simulateConsistentHashRing(
        nodeCount,
        vnodesPerServer,
        180,
        mode,
        removeLastNode
      ),
    [nodeCount, vnodesPerServer, mode, removeLastNode]
  );

  const trigger = (fn: () => void) => {
    fn();
    onInteract?.();
  };

  const cx = 155;
  const cy = 140;
  const radius = 104;

  const degToXy = (deg: number, r = radius) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#131519] border border-zinc-800 rounded-xl p-3.5 text-xs">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase mb-1">Hashing Strategy</div>
          <div className="flex gap-1.5">
            <button
              onClick={() => trigger(() => setMode("consistent"))}
              className={`flex-1 px-2 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer border ${
                mode === "consistent"
                  ? "chrome-button-accent"
                  : "bg-[#1a1d24] text-zinc-400 border-zinc-700"
              }`}
            >
              Ring (Vnodes)
            </button>
            <button
              onClick={() => trigger(() => setMode("modulo"))}
              className={`flex-1 px-2 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer border ${
                mode === "modulo"
                  ? "bg-amber-950/70 text-amber-200 border-amber-700"
                  : "bg-[#1a1d24] text-zinc-400 border-zinc-700"
              }`}
            >
              hash % N
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
            <span>Physical Shards</span>
            <span className="font-bold text-zinc-100">{nodeCount} Nodes</span>
          </div>
          <input
            type="range"
            min={2}
            max={6}
            value={nodeCount}
            onChange={(e) => trigger(() => setNodeCount(Number(e.target.value)))}
            className="calibrated-slider w-full"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
            <span>Vnodes / Shard</span>
            <span className="font-bold text-zinc-100">
              {mode === "modulo" ? "N/A" : vnodesPerServer}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            disabled={mode === "modulo"}
            value={vnodesPerServer}
            onChange={(e) => trigger(() => setVnodesPerServer(Number(e.target.value)))}
            className="calibrated-slider w-full disabled:opacity-40"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => trigger(() => setRemoveLastNode((p) => !p))}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase cursor-pointer border transition-all ${
              removeLastNode
                ? "bg-red-950/60 text-red-200 border-red-700"
                : "chrome-button text-zinc-200"
            }`}
          >
            {removeLastNode ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Crash</span>
              </>
            ) : (
              <>
                <Skull className="w-3.5 h-3.5 text-red-400" />
                <span>Kill 1 Shard</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Ring SVG + Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-5 bg-[#111317] border border-zinc-800 rounded-xl p-2 drafting-dot-grid flex justify-center">
          <svg viewBox="0 0 310 280" className="w-full max-w-[300px] h-64">
            {/* Ring circle */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#3f3f46"
              strokeWidth="2.5"
            />
            <circle
              cx={cx}
              cy={cy}
              r={radius - 22}
              fill="none"
              stroke="#27272a"
              strokeDasharray="3 4"
            />

            {/* Sample Key Dots on inner ring */}
            {result.sampleKeys.map((sk) => {
              const pt = degToXy(sk.angleDeg, radius - 22);
              const ownerSlice = result.nodes.find((n) => n.nodeId === sk.assignedNode);
              return (
                <circle
                  key={sk.key}
                  cx={pt.x}
                  cy={pt.y}
                  r={sk.moved ? 4.2 : 2.8}
                  fill={sk.moved ? "#ef4444" : ownerSlice?.color || "#a1a1aa"}
                  stroke={sk.moved ? "#fef2f2" : "none"}
                  strokeWidth={1}
                />
              );
            })}

            {/* Vnode pins */}
            {result.nodes.map((node) =>
              node.vnodePositions.slice(0, 24).map((deg, idx) => {
                const pt = degToXy(deg, radius);
                return (
                  <g key={`${node.nodeId}-${idx}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={5}
                      fill={node.color}
                      stroke="#111317"
                      strokeWidth="1.5"
                    />
                    {idx === 0 && (
                      <text
                        x={degToXy(deg, radius + 16).x}
                        y={degToXy(deg, radius + 16).y + 3}
                        textAnchor="middle"
                        fill={node.color}
                        fontSize="8.5"
                        fontWeight="700"
                      >
                        {node.nodeId}
                      </text>
                    )}
                  </g>
                );
              })
            )}

            {/* Center readout */}
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#a1a1aa" fontSize="9">
              KEY CHURN ON CRASH
            </text>
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              fill={
                !removeLastNode
                  ? "#34d399"
                  : result.migrationPercentAfterRemoval > 45
                  ? "#ef4444"
                  : "#34d399"
              }
              fontSize="20"
              fontWeight="800"
            >
              {removeLastNode ? `${result.migrationPercentAfterRemoval}%` : "0.0%"}
            </text>
            <text x={cx} y={cy + 30} textAnchor="middle" fill="#71717a" fontSize="8">
              Skew StdDev: {result.stdDevPercent}%
            </text>
          </svg>
        </div>

        {/* Distribution Bars & Diagnostic Explanation */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-200 uppercase">
              <span className="flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-zinc-400" />
                Live Key Distribution ({result.totalKeys} Keys)
              </span>
              <span className="text-zinc-400">
                {removeLastNode ? `${result.removedNodeId} Offline` : "Cluster Healthy"}
              </span>
            </div>

            {result.nodes.map((node) => (
              <div key={node.nodeId} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold" style={{ color: node.color }}>
                    {node.nodeId} ({node.vnodePositions.length} vnodes)
                  </span>
                  <span className="text-zinc-300">
                    {node.keyCount} keys ({node.sharePercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#111317] rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.min(100, node.sharePercent)}%`,
                      backgroundColor: node.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="paper-card bg-[#16181e] border border-zinc-800 rounded-xl p-3.5 text-[11px] text-zinc-300 leading-relaxed">
            <div className="font-bold text-zinc-100 uppercase mb-1">
              {mode === "modulo"
                ? "Why hash(k) % N Triggers Cache Meltdown"
                : "Consistent Hashing + Virtual Nodes Insight"}
            </div>
            {removeLastNode ? (
              mode === "modulo" ? (
                <span>
                  Dropping 1 shard under <code className="text-amber-300">hash(k) % N</code> remapped{" "}
                  <strong className="text-red-400">{result.migrationPercentAfterRemoval}%</strong> of ALL
                  cached keys simultaneously, causing a massive origin DB stampede!
                </span>
              ) : (
                <span>
                  Only <strong className="text-emerald-300">{result.migrationPercentAfterRemoval}%</strong> of
                  keys (~1/N) had to migrate clockwise to neighbors — unaffected shards kept full cache hits!
                </span>
              )
            ) : (
              <span>
                Slide <strong>Vnodes / Shard</strong> down to <strong>1</strong> and watch StdDev skew spike,
                then raise it back above <strong>15+</strong> to see balanced ownership. Click{" "}
                <strong>Kill 1 Shard</strong> to compare churn!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

