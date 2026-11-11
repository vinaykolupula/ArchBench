import React, { useMemo, useState } from "react";
import { Users, Zap, Database, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";

interface SimProps {
  onInteract?: () => void;
}

interface ScaleStageSpec {
  stage: number;
  label: string;
  usersLabel: string;
  qps: number;
  latencyMs: number;
  spofRisk: string;
  solved: string;
  nextPain: string;
  layers: string[];
}

const SCALE_STAGES: ScaleStageSpec[] = [
  {
    stage: 1,
    label: "Stage 1: Single Box",
    usersLabel: "500 Users",
    qps: 15,
    latencyMs: 12,
    spofRisk: "CRITICAL (100% SPOF)",
    solved: "Instant deployment with zero internal network hops.",
    nextPain: "CPU, RAM, and disk I/O starve each other inside one VM.",
    layers: ["Client", "DNS", "Monolith + SQLite/PG"],
  },
  {
    stage: 2,
    label: "Stage 2: Web / DB Split",
    usersLabel: "5,000 Users",
    qps: 180,
    latencyMs: 18,
    spofRisk: "HIGH (Single Web & Single DB)",
    solved: "Decoupled compute scaling from IOPS-tuned database storage.",
    nextPain: "A single API server crash causes complete downtime.",
    layers: ["Client", "App Server", "PostgreSQL"],
  },
  {
    stage: 3,
    label: "Stage 3: L7 LB + Fleet",
    usersLabel: "50,000 Users",
    qps: 1800,
    latencyMs: 24,
    spofRisk: "MODERATE (DB Primary Still Single)",
    solved: "Stateless App servers scale horizontally behind active health checks.",
    nextPain: "90% read queries crush primary DB CPU & connection limits.",
    layers: ["Client", "Load Balancer", "API Fleet (3x)", "Primary DB"],
  },
  {
    stage: 4,
    label: "Stage 4: Read Replicas",
    usersLabel: "250,000 Users",
    qps: 9500,
    latencyMs: 21,
    spofRisk: "LOW-MOD (Replica Lag Risk)",
    solved: "Read traffic spreads cleanly across multiple follower DBs.",
    nextPain: "Hot repeated reads still hit disk indexes and static files eat origin bandwidth.",
    layers: ["Client", "LB", "API Fleet", "Master DB (W)", "Read Replicas (3x)"],
  },
  {
    stage: 5,
    label: "Stage 5: Redis Cache + CDN",
    usersLabel: "1,000,000 Users",
    qps: 42000,
    latencyMs: 7,
    spofRisk: "LOW (Multi-AZ Cache + Origin)",
    solved: "80%+ of hot reads hit sub-millisecond RAM & global Edge POPs.",
    nextPain: "Cross-region latencies & synchronous post-checkout tasks spike p99 tail.",
    layers: ["Users", "CDN Edge", "LB", "API Fleet", "Redis Cluster", "Master + Replicas"],
  },
  {
    stage: 6,
    label: "Stage 6: Queues + Sharded DB",
    usersLabel: "10,000,000+ Users",
    qps: 380000,
    latencyMs: 9,
    spofRisk: "RESILIENT (Isolated Shards & DLQs)",
    solved: "Async Kafka workers flatten bursts; consistent sharding removes single DB write ceiling.",
    nextPain: "Hot-key celebrity skew & schema evolution across shards require active observability.",
    layers: ["Global Anycast + CDN", "Stateless API Mesh", "Redis", "Kafka + Workers", "Sharded DB Cluster"],
  },
];

export const SimZeroToMillions: React.FC<SimProps> = ({ onInteract }) => {
  const [stageIdx, setStageIdx] = useState<number>(0);
  const spec = SCALE_STAGES[stageIdx];

  const handleSelect = (idx: number) => {
    setStageIdx(idx);
    onInteract?.();
  };

  const utilizationPct = useMemo(
    () => Math.min(96, Math.max(18, Math.round((Math.log10(spec.qps + 1) / 6) * 95))),
    [spec.qps]
  );

  return (
    <div className="space-y-4 font-mono">
      {/* Control Scrubber */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#131519] border border-zinc-800 rounded-xl p-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSelect(Math.max(0, stageIdx - 1))}
            disabled={stageIdx === 0}
            className="chrome-button p-1.5 rounded-lg disabled:opacity-30 cursor-pointer"
            title="Previous evolution stage"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Progressive Scaling Evolution
            </div>
            <div className="text-xs font-bold text-zinc-100">{spec.label}</div>
          </div>
          <button
            onClick={() => handleSelect(Math.min(SCALE_STAGES.length - 1, stageIdx + 1))}
            disabled={stageIdx === SCALE_STAGES.length - 1}
            className="chrome-button p-1.5 rounded-lg disabled:opacity-30 cursor-pointer"
            title="Next evolution stage"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-[10px] text-zinc-500 uppercase whitespace-nowrap">Scale Slider:</span>
          <input
            type="range"
            min={0}
            max={SCALE_STAGES.length - 1}
            value={stageIdx}
            onChange={(e) => handleSelect(Number(e.target.value))}
            className="calibrated-slider flex-1"
          />
          <span className="text-xs font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-800/70 px-2 py-0.5 rounded whitespace-nowrap">
            {spec.usersLabel}
          </span>
        </div>
      </div>

      {/* Interactive SVG Topology Pipeline */}
      <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3 drafting-dot-grid">
        <svg viewBox="0 0 760 190" className="w-full h-44">
          <defs>
            <marker
              id="sim0-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="#71717a" />
            </marker>
          </defs>

          {spec.layers.map((layer, idx) => {
            const count = spec.layers.length;
            const spacing = Math.min(138, 690 / Math.max(1, count));
            const totalW = (count - 1) * spacing + 114;
            const startX = (760 - totalW) / 2;
            const x = startX + idx * spacing;
            const y = 52;
            const isNewest = idx === count - 1 || (stageIdx >= 4 && idx === count - 2);

            return (
              <g key={layer}>
                {idx > 0 && (
                  <line
                    x1={x - (spacing - 114)}
                    y1={y + 32}
                    x2={x - 4}
                    y2={y + 32}
                    stroke="#52525b"
                    strokeWidth="2"
                    strokeDasharray={layer.includes("Kafka") || layer.includes("Replicas") ? "4 3" : undefined}
                    markerEnd="url(#sim0-arrow)"
                  />
                )}
                <rect
                  x={x}
                  y={y}
                  width={114}
                  height={64}
                  rx={8}
                  fill={isNewest ? "#1b2822" : "#1b1e25"}
                  stroke={isNewest ? "#34d399" : "#52525b"}
                  strokeWidth={isNewest ? 1.8 : 1.2}
                />
                <text
                  x={x + 57}
                  y={y + 28}
                  textAnchor="middle"
                  fill="#f4f4f5"
                  fontSize="10"
                  fontWeight="700"
                >
                  {layer.length > 17 ? `${layer.slice(0, 16)}..` : layer}
                </text>
                <text
                  x={x + 57}
                  y={y + 45}
                  textAnchor="middle"
                  fill={isNewest ? "#6ee7b7" : "#a1a1aa"}
                  fontSize="8.5"
                >
                  {isNewest ? "ACTIVE LAYER" : `HOP #${idx}`}
                </text>
              </g>
            );
          })}

          {/* Capacity Pressure Bar inside SVG */}
          <rect x="40" y="148" width="680" height="22" rx="5" fill="#181a20" stroke="#3f3f46" />
          <rect
            x="42"
            y="150"
            width={Math.round((utilizationPct / 100) * 676)}
            height="18"
            rx="4"
            fill={stageIdx >= 4 ? "#10b981" : stageIdx >= 2 ? "#f59e0b" : "#ef4444"}
            opacity="0.7"
          />
          <text x="52" y="162" fill="#f4f4f5" fontSize="9.5" fontWeight="700">
            ESTIMATED THROUGHPUT: {spec.qps.toLocaleString()} RPS | P99 READ LATENCY: ~{spec.latencyMs}ms | HEADROOM: {utilizationPct}%
          </text>
        </svg>
      </div>

      {/* Telemetry & Trade-off Diagnostic Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold mb-1">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>SPOF Risk Posture</span>
          </div>
          <div className="font-bold text-zinc-100">{spec.spofRisk}</div>
        </div>
        <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 uppercase font-bold mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Bottleneck Solved</span>
          </div>
          <div className="text-zinc-300 text-[11px] leading-relaxed">{spec.solved}</div>
        </div>
        <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 uppercase font-bold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emerging Limit</span>
          </div>
          <div className="text-zinc-300 text-[11px] leading-relaxed">{spec.nextPain}</div>
        </div>
      </div>

      {/* Quick Stage Pills */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <Database className="w-3.5 h-3.5 text-zinc-500 mr-1" />
        {SCALE_STAGES.map((s, idx) => (
          <button
            key={s.stage}
            onClick={() => handleSelect(idx)}
            className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-all cursor-pointer border ${
              stageIdx === idx
                ? "chrome-button-accent"
                : "bg-[#16181e] text-zinc-400 border-zinc-800 hover:text-zinc-200"
            }`}
          >
            S{s.stage}: {s.usersLabel}
          </button>
        ))}
      </div>
    </div>
  );
};

