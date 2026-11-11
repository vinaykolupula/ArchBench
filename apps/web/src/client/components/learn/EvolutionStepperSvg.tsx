import React, { useMemo, useState } from "react";
import { EvolutionStage } from "@archbench/learning-mode";
import { ChevronLeft, ChevronRight, Layers, Sparkles, AlertTriangle } from "lucide-react";
import { RichInlineText } from "./RichInlineText.js";

interface Props {
  stages: EvolutionStage[];
}

export const EvolutionStepperSvg: React.FC<Props> = ({ stages }) => {
  const [stageIdx, setStageIdx] = useState<number>(0);
  const safeIdx = Math.min(stageIdx, Math.max(0, stages.length - 1));
  const stage = stages[safeIdx];

  const layout = useMemo(() => {
    if (!stage) return new Map<string, { x: number; y: number }>();
    const map = new Map<string, { x: number; y: number }>();
    const byTier = new Map<number, typeof stage.nodes>();
    for (const node of stage.nodes) {
      const list = byTier.get(node.tier) || [];
      list.push(node);
      byTier.set(node.tier, list);
    }
    const tiers = Array.from(byTier.keys()).sort((a, b) => a - b);
    const tierCount = Math.max(1, tiers.length);
    const xPad = 36;
    const usableW = 700 - xPad * 2;

    tiers.forEach((tier, tIdx) => {
      const nodesInTier = byTier.get(tier) || [];
      const x =
        tierCount === 1
          ? 350 - 55
          : xPad + Math.round((tIdx / (tierCount - 1)) * (usableW - 110));
      const rowH = 190 / (nodesInTier.length + 1);
      nodesInTier.forEach((node, nIdx) => {
        const y = Math.round((nIdx + 1) * rowH) - 22;
        map.set(node.id, { x, y });
      });
    });
    return map;
  }, [stage]);

  if (!stage) return null;

  return (
    <div className="chrome-chassis border border-zinc-700/70 rounded-xl p-4 space-y-3 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Progressive Architecture Blueprint (Stage {stage.stageNumber} of {stages.length})
            </div>
            <div className="text-xs font-bold text-zinc-100">
              {stage.title} — <span className="text-emerald-300">{stage.scaleLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStageIdx((s) => Math.max(0, s - 1))}
            disabled={safeIdx === 0}
            className="chrome-button p-1.5 rounded-lg disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {stages.map((st, idx) => (
            <button
              key={st.stageNumber}
              onClick={() => setStageIdx(idx)}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer border ${
                idx === safeIdx
                  ? "chrome-button-accent"
                  : "bg-[#1a1d24] text-zinc-400 border-zinc-700"
              }`}
            >
              S{st.stageNumber}
            </button>
          ))}
          <button
            onClick={() => setStageIdx((s) => Math.min(stages.length - 1, s + 1))}
            disabled={safeIdx === stages.length - 1}
            className="chrome-button p-1.5 rounded-lg disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progressive Diagram Canvas */}
      <div className="bg-[#111317] border border-zinc-800 rounded-xl p-2 drafting-dot-grid">
        <svg viewBox="0 0 700 195" className="w-full h-48">
          <defs>
            <marker id="evo-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="#71717a" />
            </marker>
          </defs>

          {stage.edges.map((edge, idx) => {
            const p1 = layout.get(edge.from);
            const p2 = layout.get(edge.to);
            if (!p1 || !p2) return null;

            const isSameCol = Math.abs(p1.x - p2.x) < 20;
            let x1: number;
            let y1: number;
            let x2: number;
            let y2: number;
            let lx: number;
            let ly: number;
            let anchor: "middle" | "start" = "middle";

            if (isSameCol) {
              x1 = p1.x + 55;
              x2 = p2.x + 55;
              if (p2.y >= p1.y) {
                y1 = p1.y + 44;
                y2 = p2.y - 2;
              } else {
                y1 = p1.y;
                y2 = p2.y + 46;
              }
              lx = x1 + 8;
              ly = Math.round((y1 + y2) / 2) + 3;
              anchor = "start";
            } else if (p2.x < p1.x) {
              x1 = p1.x;
              y1 = p1.y + 22;
              x2 = p2.x + 112;
              y2 = p2.y + 22;
              lx = Math.round((x1 + x2) / 2);
              ly = Math.round((y1 + y2) / 2) - 5;
            } else {
              x1 = p1.x + 110;
              y1 = p1.y + 22;
              x2 = p2.x - 2;
              y2 = p2.y + 22;
              lx = Math.round((x1 + x2) / 2);
              ly = Math.round((y1 + y2) / 2) - 5;
            }

            return (
              <g key={`${edge.from}-${edge.to}-${idx}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={edge.style === "async" ? "#38bdf8" : "#71717a"}
                  strokeWidth="1.5"
                  strokeDasharray={edge.style === "async" ? "4 3" : undefined}
                  markerEnd="url(#evo-arrow)"
                />
                <text x={lx} y={ly} textAnchor={anchor} fill="#a1a1aa" fontSize="8">
                  {edge.label}
                </text>
              </g>
            );
          })}

          {stage.nodes.map((node) => {
            const pos = layout.get(node.id);
            if (!pos) return null;
            return (
              <g key={node.id}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={110}
                  height={44}
                  rx={7}
                  fill={node.highlight ? "#15251f" : "#1a1d24"}
                  stroke={node.highlight ? "#10b981" : "#52525b"}
                  strokeWidth={node.highlight ? 1.8 : 1.1}
                />
                <text
                  x={pos.x + 55}
                  y={pos.y + 20}
                  textAnchor="middle"
                  fill="#f4f4f5"
                  fontSize="9"
                  fontWeight="700"
                >
                  {node.label.length > 17 ? `${node.label.slice(0, 16)}..` : node.label}
                </text>
                <text
                  x={pos.x + 55}
                  y={pos.y + 34}
                  textAnchor="middle"
                  fill={node.highlight ? "#6ee7b7" : "#71717a"}
                  fontSize="7.5"
                >
                  {node.kind.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottleneck Evolution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-emerald-950/25 border border-emerald-800/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Problem Solved at Stage {stage.stageNumber}</span>
          </div>
          <p className="text-zinc-200 font-sans text-xs leading-relaxed">
            <RichInlineText text={stage.problemSolved} />
          </p>
        </div>

        <div className="bg-amber-950/25 border border-amber-800/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Next Bottleneck to Address</span>
          </div>
          <p className="text-zinc-200 font-sans text-xs leading-relaxed">
            <RichInlineText text={stage.remainingBottleneck} />
          </p>
        </div>
      </div>
    </div>
  );
};
