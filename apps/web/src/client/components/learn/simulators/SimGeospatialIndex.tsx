import React, { useMemo, useState } from "react";
import { MapPin, CheckCircle2, AlertTriangle } from "lucide-react";

interface SimProps {
  onInteract?: () => void;
}

interface DriverDot {
  id: string;
  x: number;
  y: number;
  cellCol: number;
  cellRow: number;
}

const DRIVERS: DriverDot[] = [
  { id: "D1", x: 185, y: 88, cellCol: 1, cellRow: 1 },
  { id: "D2", x: 204, y: 92, cellCol: 2, cellRow: 1 }, // right across grid border x=200!
  { id: "D3", x: 196, y: 128, cellCol: 1, cellRow: 2 }, // right below border y=120!
  { id: "D4", x: 92, y: 45, cellCol: 0, cellRow: 0 },
  { id: "D5", x: 318, y: 145, cellCol: 3, cellRow: 2 },
  { id: "D6", x: 145, y: 158, cellCol: 1, cellRow: 2 },
];

type GeoMode = "single_geohash" | "nine_neighbors" | "h3_radius";

export const SimGeospatialIndex: React.FC<SimProps> = ({ onInteract }) => {
  const [mode, setMode] = useState<GeoMode>("single_geohash");
  const [riderPos, setRiderPos] = useState<{ x: number; y: number }>({ x: 194, y: 90 });

  const riderCol = Math.min(3, Math.max(0, Math.floor(riderPos.x / 100)));
  const riderRow = Math.min(2, Math.max(0, Math.floor(riderPos.y / 60)));

  const matchedDrivers = useMemo(() => {
    return DRIVERS.filter((d) => {
      if (mode === "single_geohash") {
        return d.cellCol === riderCol && d.cellRow === riderRow;
      }
      if (mode === "nine_neighbors") {
        return Math.abs(d.cellCol - riderCol) <= 1 && Math.abs(d.cellRow - riderRow) <= 1;
      }
      const dist = Math.hypot(d.x - riderPos.x, d.y - riderPos.y);
      return dist <= 65;
    });
  }, [mode, riderPos, riderCol, riderRow]);

  const nearestDistDriver = useMemo(() => {
    return [...DRIVERS].sort(
      (a, b) =>
        Math.hypot(a.x - riderPos.x, a.y - riderPos.y) -
        Math.hypot(b.x - riderPos.x, b.y - riderPos.y)
    )[0];
  }, [riderPos]);

  const missedClosest =
    nearestDistDriver &&
    !matchedDrivers.some((m) => m.id === nearestDistDriver.id) &&
    Math.hypot(nearestDistDriver.x - riderPos.x, nearestDistDriver.y - riderPos.y) < 40;

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 400);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 180);
    setRiderPos({ x: Math.max(10, Math.min(390, x)), y: Math.max(10, Math.min(170, y)) });
    onInteract?.();
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#131519] border border-zinc-800 rounded-xl p-3.5 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "single_geohash", label: "Single Geohash Cell (Buggy)" },
              { id: "nine_neighbors", label: "Geohash + 8 Neighbors (3x3)" },
              { id: "h3_radius", label: "True Equidistant Ring (H3)" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setMode(opt.id);
                onInteract?.();
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
                mode === opt.id
                  ? "chrome-button-accent"
                  : "bg-[#1a1d24] text-zinc-400 border-zinc-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setRiderPos({ x: 194, y: 90 });
            onInteract?.();
          }}
          className="chrome-button px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Reset to Grid Border Test
        </button>
      </div>

      {/* Interactive 2D Spatial Grid Map */}
      <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3 drafting-dot-grid">
        <svg
          viewBox="0 0 400 180"
          onClick={handleSvgClick}
          className="w-full h-52 cursor-crosshair select-none"
        >
          {/* 4x3 Geohash Grid Cells */}
          {[0, 1, 2, 3].map((col) =>
            [0, 1, 2].map((row) => {
              const isSelected =
                mode === "single_geohash"
                  ? col === riderCol && row === riderRow
                  : mode === "nine_neighbors"
                  ? Math.abs(col - riderCol) <= 1 && Math.abs(row - riderRow) <= 1
                  : false;

              return (
                <g key={`${col}-${row}`}>
                  <rect
                    x={col * 100}
                    y={row * 60}
                    width={100}
                    height={60}
                    fill={isSelected ? "#10b981" : "transparent"}
                    fillOpacity={isSelected ? 0.14 : 0}
                    stroke="#27272a"
                    strokeWidth="1.2"
                  />
                  <text x={col * 100 + 6} y={row * 60 + 13} fill="#52525b" fontSize="8">
                    9q8{col}
                    {row}
                  </text>
                </g>
              );
            })
          )}

          {/* H3 Equidistant Radius */}
          {mode === "h3_radius" && (
            <circle
              cx={riderPos.x}
              cy={riderPos.y}
              r={65}
              fill="#10b981"
              fillOpacity={0.14}
              stroke="#34d399"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
          )}

          {/* Drivers */}
          {DRIVERS.map((d) => {
            const matched = matchedDrivers.some((m) => m.id === d.id);
            return (
              <g key={d.id}>
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={7}
                  fill={matched ? "#10b981" : "#3f3f46"}
                  stroke={matched ? "#d1fae5" : "#71717a"}
                  strokeWidth="1.5"
                />
                <text x={d.x} y={d.y + 3} textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="700">
                  {d.id}
                </text>
              </g>
            );
          })}

          {/* Rider Pin */}
          <circle cx={riderPos.x} cy={riderPos.y} r={8} fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
          <text x={riderPos.x} y={riderPos.y - 12} textAnchor="middle" fill="#bae6fd" fontSize="8.5" fontWeight="700">
            RIDER
          </text>
        </svg>
        <div className="text-[10px] text-zinc-500 text-center mt-1">
          Click anywhere on the grid to reposition the Rider &amp; watch neighbor detection!
        </div>
      </div>

      {/* Diagnostic Readout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3 flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Matched Drivers</div>
            <div className="font-bold text-zinc-100">
              {matchedDrivers.length > 0
                ? matchedDrivers.map((d) => d.id).join(", ")
                : "None in scanned zone"}
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl border p-3 text-[11px] flex items-start gap-2 ${
            missedClosest
              ? "bg-amber-950/30 border-amber-800/70 text-amber-200"
              : "bg-emerald-950/30 border-emerald-800/70 text-emerald-200"
          }`}
        >
          {missedClosest ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span>
            {missedClosest
              ? `GEOHASH BORDER BUG! Driver ${nearestDistDriver.id} is right across the street (x=200 line) yet missed because it sits in neighbor cell 9q8${nearestDistDriver.cellCol}${nearestDistDriver.cellRow}!`
              : "Border-safe proximity match! Nearby neighbor cells & H3 rings never drop drivers across meridian edges."}
          </span>
        </div>
      </div>
    </div>
  );
};

