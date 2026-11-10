import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useArchBench } from "../../context/ArchBenchContext.js";
import { GraphNodeData } from "../../types.js";
import {
  User,
  Globe,
  Server,
  Database,
  Inbox,
  Cpu,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  AlertTriangle,
  Flame,
  Grid,
} from "lucide-react";

interface NodePosition {
  x: number;
  y: number;
}

interface TierGroup {
  tier: number;
  title: string;
  icon: React.ReactNode;
  nodes: GraphNodeData[];
  y: number;
  height: number;
}

const CARD_WIDTH = 260;
const CARD_HEIGHT = 88;

export const TopologyCanvas: React.FC = () => {
  const {
    evaluation,
    activeAltId,
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,
    simulationResult,
  } = useArchBench();

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 35 });
  const [zoom, setZoom] = useState<number>(0.85);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const activeGraph = evaluation?.graphs?.[activeAltId];
  const rawNodes = activeGraph?.nodes || [];
  const rawEdges = activeGraph?.edges || [];

  // Categorize nodes into 5 clean architectural tiers
  const getNodeTier = useCallback((node: GraphNodeData): { tier: number; tierName: string } => {
    if (node.kind === "user") return { tier: 0, tierName: "Clients & Users" };
    if (node.kind === "external_system") return { tier: 4, tierName: "External Cloud & SaaS" };
    const type = (node.componentType || "").toLowerCase();
    if (type.includes("gateway") || type.includes("ingress") || type.includes("load_balancer")) {
      return { tier: 0, tierName: "Clients & Gateways" };
    }
    if (type.includes("database") || type.includes("cache") || type.includes("store")) {
      return { tier: 3, tierName: "Persistence & Data Stores" };
    }
    if (type.includes("queue") || type.includes("bus") || type.includes("stream") || type.includes("worker")) {
      return { tier: 2, tierName: "Async Messaging & Workers" };
    }
    return { tier: 1, tierName: "Core Services & APIs" };
  }, []);

  const TIER_VERTICAL_SPACING = 260;
  const SWIMLANE_START_Y = 40;
  const SWIMLANE_HEIGHT = 175;

  // Compute balanced canvas width
  const canvasWidth = useMemo(() => {
    if (!rawNodes || rawNodes.length === 0) return 1400;
    const countMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    rawNodes.forEach((node) => {
      const { tier } = getNodeTier(node);
      countMap[tier] = (countMap[tier] || 0) + 1;
    });
    const maxNodesInTier = Math.max(...Object.values(countMap), 1);
    return Math.max(maxNodesInTier * (CARD_WIDTH + 140) + 160, 1400);
  }, [rawNodes, getNodeTier]);

  // Compute balanced tier layout
  useEffect(() => {
    if (!rawNodes || rawNodes.length === 0) return;

    const tiersMap: Record<number, GraphNodeData[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    rawNodes.forEach((node) => {
      const { tier } = getNodeTier(node);
      tiersMap[tier].push(node);
    });

    const positions: Record<string, NodePosition> = {};

    Object.entries(tiersMap).forEach(([tierStr, nodesInTier]) => {
      const tier = Number(tierStr);
      const count = nodesInTier.length;
      if (count === 0) return;

      const spacing = canvasWidth / (count + 1);
      nodesInTier.forEach((node, idx) => {
        positions[node.id] = {
          x: Math.round(spacing * (idx + 1)),
          y: Math.round(SWIMLANE_START_Y + tier * TIER_VERTICAL_SPACING + 115),
        };
      });
    });

    setNodePositions(positions);
  }, [activeAltId, rawNodes.length, getNodeTier, canvasWidth]);

  // Swimlanes calculation
  const tierGroups = useMemo<TierGroup[]>(() => {
    const groups: TierGroup[] = [
      {
        tier: 0,
        title: "Clients & Ingress Gateways",
        icon: <User className="w-4 h-4 text-sky-400" />,
        nodes: [],
        y: SWIMLANE_START_Y + 0 * TIER_VERTICAL_SPACING,
        height: SWIMLANE_HEIGHT,
      },
      {
        tier: 1,
        title: "Core Services & Business Logic",
        icon: <Server className="w-4 h-4 text-indigo-400" />,
        nodes: [],
        y: SWIMLANE_START_Y + 1 * TIER_VERTICAL_SPACING,
        height: SWIMLANE_HEIGHT,
      },
      {
        tier: 2,
        title: "Asynchronous Messaging & Workers",
        icon: <Inbox className="w-4 h-4 text-emerald-400" />,
        nodes: [],
        y: SWIMLANE_START_Y + 2 * TIER_VERTICAL_SPACING,
        height: SWIMLANE_HEIGHT,
      },
      {
        tier: 3,
        title: "Persistence & Data Storage",
        icon: <Database className="w-4 h-4 text-purple-400" />,
        nodes: [],
        y: SWIMLANE_START_Y + 3 * TIER_VERTICAL_SPACING,
        height: SWIMLANE_HEIGHT,
      },
      {
        tier: 4,
        title: "External SaaS & Third-Party APIs",
        icon: <Globe className="w-4 h-4 text-slate-400" />,
        nodes: [],
        y: SWIMLANE_START_Y + 4 * TIER_VERTICAL_SPACING,
        height: SWIMLANE_HEIGHT,
      },
    ];

    rawNodes.forEach((node) => {
      const { tier } = getNodeTier(node);
      if (groups[tier]) {
        groups[tier].nodes.push(node);
      }
    });

    return groups.filter((g) => g.nodes.length > 0);
  }, [rawNodes, getNodeTier]);

  // Pan & Zoom Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".canvas-node")) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setNodePositions((prev) => ({
        ...prev,
        [draggedNodeId]: {
          x: Math.round(mouseX - dragOffset.x),
          y: Math.round(mouseY - dragOffset.y),
        },
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(zoom * factor, 0.4), 2.2);

    // Zoom towards cursor
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const dx = (cursorX - pan.x) * (1 - factor);
      const dy = (cursorY - pan.y) * (1 - factor);
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }
    setZoom(newZoom);
  };

  const resetView = () => {
    setPan({ x: 80, y: 35 });
    setZoom(0.85);
  };

  const zoomToFit = () => {
    if (!containerRef.current || rawNodes.length === 0) return;
    const xs = Object.values(nodePositions).map((p) => p.x);
    const ys = Object.values(nodePositions).map((p) => p.y);
    if (xs.length === 0) return;

    const minX = Math.min(...xs) - 160;
    const maxX = Math.max(...xs) + 160;
    const minY = Math.min(...ys) - 120;
    const maxY = Math.max(...ys) + 120;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const { clientWidth, clientHeight } = containerRef.current;

    const targetZoom = Math.min(
      Math.max(Math.min(clientWidth / graphWidth, clientHeight / graphHeight) * 0.9, 0.4),
      1.5
    );

    setZoom(targetZoom);
    setPan({
      x: (clientWidth - graphWidth * targetZoom) / 2 - minX * targetZoom,
      y: (clientHeight - graphHeight * targetZoom) / 2 - minY * targetZoom,
    });
  };

  // Node Icon Helper
  const getNodeIcon = (node: GraphNodeData) => {
    if (node.kind === "user") return <User className="w-4 h-4 text-sky-400" />;
    if (node.kind === "external_system") return <Globe className="w-4 h-4 text-slate-300" />;
    const type = (node.componentType || "").toLowerCase();
    if (type.includes("database")) return <Database className="w-4 h-4 text-purple-400" />;
    if (type.includes("queue")) return <Inbox className="w-4 h-4 text-emerald-400" />;
    if (type.includes("worker")) return <Cpu className="w-4 h-4 text-amber-400" />;
    if (type.includes("gateway")) return <Layers className="w-4 h-4 text-cyan-400" />;
    return <Server className="w-4 h-4 text-indigo-400" />;
  };

  const isBlastRadius = (nodeId: string) => {
    return simulationResult?.blastRadiusNodes?.includes(nodeId) ?? false;
  };

  // Compute Clean Connection Anchors & SVG Paths
  const renderedEdges = useMemo(() => {
    return rawEdges.map((edge) => {
      const fromPos = nodePositions[edge.from];
      const toPos = nodePositions[edge.to];
      if (!fromPos || !toPos) return null;

      const isSync = edge.protocol === "synchronous";
      const isSelected = selectedEdge?.id === edge.id;
      const affectedBySimulation = isBlastRadius(edge.from) || isBlastRadius(edge.to);

      // Connect from bottom anchor of source card to top anchor of target card
      const startX = fromPos.x;
      const startY = fromPos.y + CARD_HEIGHT / 2;
      const endX = toPos.x;
      const endY = toPos.y - CARD_HEIGHT / 2;

      // Check if this edge skips intermediate tier(s) and would collide with a card
      const isMultiTier = Math.abs(endY - startY) > TIER_VERTICAL_SPACING * 1.3;
      let detourX = 0;

      if (isMultiTier) {
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        const directX = (startX + endX) / 2;

        const hasIntermediateCollision = rawNodes.some((n) => {
          if (n.id === edge.from || n.id === edge.to) return false;
          const pos = nodePositions[n.id];
          if (!pos) return false;
          const inYRange = pos.y > minY + 20 && pos.y < maxY - 20;
          const inXRange = Math.abs(pos.x - directX) < CARD_WIDTH / 2 + 35;
          return inYRange && inXRange;
        });

        if (hasIntermediateCollision) {
          detourX = directX <= canvasWidth / 2 ? -(CARD_WIDTH / 2 + 75) : (CARD_WIDTH / 2 + 75);
        }
      }

      // Cubic Bezier curve control points
      const dy = endY - startY;
      const cy1 = startY + Math.max(dy * 0.45, 50);
      const cy2 = endY - Math.max(dy * 0.45, 50);

      const pathData = detourX !== 0
        ? `M ${startX} ${startY} C ${startX + detourX} ${cy1}, ${endX + detourX} ${cy2}, ${endX} ${endY}`
        : `M ${startX} ${startY} C ${startX} ${cy1}, ${endX} ${cy2}, ${endX} ${endY}`;

      const midX = (startX + endX) / 2 + (detourX !== 0 ? detourX * 0.65 : 0);
      const midY = (startY + endY) / 2;

      const strokeColor = affectedBySimulation
        ? "#ef4444"
        : isSelected
        ? "#f4f4f5"
        : isSync
        ? "#71717a"
        : "#a1a1aa";

      return (
        <g
          key={edge.id}
          className="cursor-pointer group"
          onClick={() => {
            setSelectedEdge(edge);
            setSelectedNode(null);
          }}
        >
          {/* Invisible thick hover hit-area */}
          <path d={pathData} fill="none" stroke="transparent" strokeWidth="24" />

          {/* Glow backdrop on select or simulation */}
          {(isSelected || affectedBySimulation) && (
            <path
              d={pathData}
              fill="none"
              stroke={affectedBySimulation ? "rgba(239, 68, 68, 0.3)" : "rgba(129, 140, 248, 0.3)"}
              strokeWidth="8"
            />
          )}

          {/* Visible connection path */}
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={isSelected ? "2.5" : "1.8"}
            strokeDasharray={isSync ? undefined : "6,6"}
            className={
              affectedBySimulation
                ? "animate-pulse stroke-red-500"
                : !isSync
                ? "animate-flow-dash"
                : "transition-colors duration-200"
            }
            markerEnd={
              affectedBySimulation
                ? "url(#arrow-red)"
                : isSelected
                ? "url(#arrow-active)"
                : isSync
                ? "url(#arrow-sync)"
                : "url(#arrow-async)"
            }
          />

          {/* Edge Label Badge at curve midpoint */}
          <foreignObject
            x={midX - 55}
            y={midY - 12}
            width="110"
            height="24"
            className="pointer-events-none"
          >
            <div
              className={`flex items-center justify-center space-x-1 px-2 py-0.5 rounded text-[9px] font-mono font-medium border shadow-md transition-all ${
                isSelected
                  ? "bg-[#252833] text-zinc-100 border-zinc-400 ring-1 ring-white/20"
                  : affectedBySimulation
                  ? "bg-red-950/90 text-red-300 border-red-500/50"
                  : isSync
                  ? "bg-[#181a20] text-zinc-300 border-zinc-700/80"
                  : "bg-[#181a20] text-zinc-200 border-zinc-600"
              }`}
            >
              <span>{isSync ? "SYNC" : "ASYNC"}</span>
              {edge.transport && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="uppercase truncate max-w-[45px]">{edge.transport}</span>
                </>
              )}
            </div>
          </foreignObject>
        </g>
      );
    });
  }, [rawEdges, nodePositions, selectedEdge, simulationResult, setSelectedEdge, setSelectedNode]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#121316] drafting-desk-grid overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Floating Canvas Action Toolbar - Machined Grey Chrome */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-1 chrome-chassis rounded-xl p-1.5 shadow-2xl">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.15, 2.2))}
          className="p-1.5 hover:bg-zinc-700/50 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.85, 0.4))}
          className="p-1.5 hover:bg-zinc-700/50 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={zoomToFit}
          className="p-1.5 hover:bg-zinc-700/50 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="Zoom to Fit Diagram"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 hover:bg-zinc-700/50 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="Reset Canvas Position"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-zinc-700/80 mx-1" />
        <button
          onClick={() => setShowGrid((g) => !g)}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            showGrid ? "text-zinc-100 bg-zinc-700/60" : "text-zinc-400 hover:text-white"
          }`}
          title="Toggle Grid Lines"
        >
          <Grid className="w-4 h-4" />
        </button>
        <span className="text-xs text-zinc-300 font-mono px-2 font-bold">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Canvas Architectural Legend - Pinned Drafting Note */}
      <div className="absolute bottom-4 left-4 z-30 hidden md:flex items-center space-x-4 bg-[#16181f]/95 rounded-lg px-3.5 py-2 text-xs border border-zinc-700/80 font-mono shadow-2xl backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-0.5 bg-zinc-400 inline-block rounded-full"></span>
          <span className="text-[11px] font-medium text-zinc-300">Sync HTTP/gRPC</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-0.5 border-b border-dashed border-zinc-400 inline-block"></span>
          <span className="text-[11px] font-medium text-zinc-300">Async Event Queue</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block ring-2 ring-amber-400/30"></span>
          <span className="text-[11px] font-medium text-amber-300">Single Point of Failure</span>
        </div>
      </div>

      {/* Interactive Transform Plane */}
      <div
        className="absolute top-0 left-0 w-full h-full transform-origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Tier Swimlanes / Subgraphs - Technical Architectural Zones */}
        {tierGroups.map((g) => (
          <div
            key={g.tier}
            className="absolute left-8 rounded-xl border border-dashed border-zinc-700/60 bg-[#16181d]/75 pointer-events-none backdrop-blur-[2px]"
            style={{
              top: `${g.y}px`,
              width: `${Math.max(canvasWidth + 60, 1400)}px`,
              height: `${g.height}px`,
            }}
          >
            <div className="flex items-center space-x-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-800/80">
              {g.icon}
              <span>// ZONE {g.tier}: {g.title}</span>
              <span className="text-[10px] text-zinc-500 font-mono">[{g.nodes.length} NODES]</span>
            </div>
          </div>
        ))}

        {/* SVG Arrowhead Markers & Edges */}
        <svg
          className="absolute top-0 left-0 w-[4500px] h-[4500px] pointer-events-auto"
          style={{ overflow: "visible" }}
        >
          <defs>
            <marker
              id="arrow-sync"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#71717a" />
            </marker>
            <marker
              id="arrow-async"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#a1a1aa" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f4f4f5" />
            </marker>
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
            </marker>
          </defs>

          {renderedEdges}
        </svg>

        {/* Node Cards Layer - Architectural Drafting Blocks */}
        {rawNodes.map((node) => {
          const pos = nodePositions[node.id] || { x: 500, y: 300 };
          const isSelected = selectedNode?.id === node.id;
          const isSpof = activeGraph?.spofs?.includes(node.id);
          const hasBlast = isBlastRadius(node.id);

          return (
            <div
              key={node.id}
              className={`canvas-node drafting-corners absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-xl border transition-all duration-150 select-none shadow-lg ${
                isSelected
                  ? "border-zinc-200 bg-[#252833] ring-2 ring-white/30 shadow-2xl z-30"
                  : hasBlast
                  ? "border-red-500 bg-[#241719] ring-2 ring-red-500/50 animate-pulse z-30"
                  : isSpof
                  ? "border-amber-600/70 bg-[#1c1a17] hover:border-amber-500 hover:bg-[#221f1c] z-20"
                  : "border-zinc-700/80 bg-[#181a20] hover:border-zinc-500 hover:bg-[#20232a] z-10"
              }`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${CARD_WIDTH}px`,
                height: `${CARD_HEIGHT}px`,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const mouseX = (e.clientX - rect.left - pan.x) / zoom;
                const mouseY = (e.clientY - rect.top - pan.y) / zoom;
                setDragOffset({
                  x: mouseX - pos.x,
                  y: mouseY - pos.y,
                });
                setDraggedNodeId(node.id);
                setSelectedNode(node);
                setSelectedEdge(null);
              }}
            >
              {/* Card Anchor Indicator Pins */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-900 pointer-events-none" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-900 pointer-events-none" />

              <div className="p-3 flex flex-col justify-between h-full">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 shadow-inner">
                      {getNodeIcon(node)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100 font-mono truncate max-w-[145px] leading-snug">
                        {node.name}
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block truncate max-w-[140px]">
                        [{node.componentType || node.kind}]
                      </span>
                    </div>
                  </div>

                  {/* Alert / Status LED */}
                  {hasBlast ? (
                    <span className="flex items-center text-[9px] font-mono font-bold bg-red-950/60 text-red-300 border border-red-700 rounded px-1.5 py-0.5">
                      <Flame className="w-3 h-3 mr-1 text-red-400" /> DEGRADED
                    </span>
                  ) : isSpof ? (
                    <span
                      className="flex items-center text-[9px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-600/70 rounded px-1.5 py-0.5"
                      title="Single Point of Failure"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" /> SPOF
                    </span>
                  ) : (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-400 ring-2 ring-zinc-500/20 mt-1"
                      title="Healthy Node"
                    />
                  )}
                </div>

                {/* Footer Meta Row */}
                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-800">
                  <span className="truncate max-w-[155px] font-mono text-zinc-300">
                    {node.technology || "Logical Module"}
                  </span>
                  <span className="font-mono text-zinc-400 text-[9px]">
                    {node.metrics ? `↓${node.metrics.inDegree} // ↑${node.metrics.outDegree}` : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
