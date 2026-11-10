import React from "react";
import { useArchBench } from "../../context/ArchBenchContext.js";
import {
  X,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Clock,
  Layers,
  BookOpen,
  FileCheck,
  Server,
} from "lucide-react";

export const ComponentInspector: React.FC = () => {
  const {
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,
    evaluation,
    activeAltId,
  } = useArchBench();

  if (!selectedNode && !selectedEdge) return null;

  const activeAlt = evaluation?.evaluation?.alternatives?.[activeAltId];
  const activeGraph = evaluation?.graphs?.[activeAltId];
  const spec = evaluation?.spec;

  // Find incoming & outgoing edges for selectedNode
  const incomingEdges = activeGraph?.edges.filter((e) => e.to === selectedNode?.id) || [];
  const outgoingEdges = activeGraph?.edges.filter((e) => e.from === selectedNode?.id) || [];

  // Find justification for selectedNode
  const justification = activeAlt?.justEnough?.componentJustifications?.find(
    (j) => j.componentId === selectedNode?.id
  );

  // Find requirements served by this component
  const servedReqs =
    spec?.requirements?.filter((r: any) =>
      r.mapped_components?.includes(selectedNode?.id)
    ) || [];

  return (
    <aside className="w-80 md:w-96 border-l border-zinc-800 bg-[#16181e] flex flex-col h-full overflow-y-auto text-zinc-200 z-30 shadow-2xl transition-all select-text font-mono">
      {/* Header - Machined Grey Chrome Finish */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700/80 bg-gradient-to-b from-[#242730] to-[#1a1c22]">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-zinc-300" />
          <h3 className="font-bold text-xs tracking-wider uppercase text-zinc-100">
            {selectedNode ? "// COMPONENT SPEC SHEET" : "// CONNECTION SPEC SHEET"}
          </h3>
        </div>
        <button
          onClick={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
          className="chrome-button p-1.5 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-6 bg-[#131519] drafting-dot-grid flex-1">
        {/* Node Inspector */}
        {selectedNode && (
          <>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  [{selectedNode.componentType || selectedNode.kind}]
                </span>
                {selectedNode.isSpof && (
                  <span className="flex items-center text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-600/70 px-2 py-0.5 rounded">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-400" /> SPOF
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-zinc-100 mt-2.5 tracking-tight uppercase">
                {selectedNode.name}
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{selectedNode.id}</p>
              {selectedNode.responsibility && (
                <p className="text-xs text-zinc-300 mt-2.5 bg-[#181a20] p-3 rounded-lg border border-zinc-800 leading-relaxed paper-card">
                  {selectedNode.responsibility}
                </p>
              )}
            </div>

            {/* Technical Metadata */}
            {selectedNode.technology && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  // TECHNOLOGY STACK
                </h4>
                <div className="text-xs font-mono bg-[#181a20] p-2.5 rounded-lg border border-zinc-700/80 text-zinc-200 font-semibold flex items-center space-x-2">
                  <Server className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{selectedNode.technology}</span>
                </div>
              </div>
            )}

            {/* JustEnough Architecture Justification */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center">
                <FileCheck className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                // OCCAM JUSTIFICATION
              </h4>
              {justification ? (
                <div className="bg-[#181a20] p-3 rounded-lg border border-zinc-800 text-xs space-y-2">
                  <div className="flex items-center space-x-1.5">
                    {justification.status === "justified" ? (
                      <span className="flex items-center text-emerald-300 font-bold text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> [JUSTIFIED COMPONENT]
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-300 font-bold text-[10px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                        <ShieldAlert className="w-3 h-3 mr-1" /> [PREMATURE COMPLEXITY]
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {justification.reason}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic font-mono">No explicit justification record.</p>
              )}
            </div>

            {/* Mapped Requirements */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center">
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                // SERVED REQUIREMENTS ({servedReqs.length})
              </h4>
              {servedReqs.length > 0 ? (
                <div className="space-y-1.5">
                  {servedReqs.map((req: any) => (
                    <div
                      key={req.id}
                      className="text-xs bg-[#181a20] p-2.5 rounded-lg border border-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-zinc-200 font-bold">[{req.id}]</span>
                        <span className="text-[9px] uppercase text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
                          {req.type}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-[11px] mt-1 leading-relaxed">
                        {req.statement}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic font-mono">
                  Not directly mapped to any formal requirement.
                </p>
              )}
            </div>

            {/* Connections */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                // NETWORK TOPOLOGY HOPS
              </h4>

              {/* Ingress */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-mono">
                  INCOMING HOPS ({incomingEdges.length}):
                </span>
                <div className="space-y-1">
                  {incomingEdges.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => {
                        setSelectedEdge(e);
                        setSelectedNode(null);
                      }}
                      className="cursor-pointer text-xs bg-[#181a20] hover:bg-[#22252e] p-2 rounded-lg flex items-center justify-between border border-zinc-800 transition-all"
                    >
                      <span className="truncate max-w-[170px] font-mono text-zinc-300">{e.from}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold bg-zinc-800 text-zinc-300">
                        {e.protocol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Egress */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-mono">
                  OUTGOING HOPS ({outgoingEdges.length}):
                </span>
                <div className="space-y-1">
                  {outgoingEdges.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => {
                        setSelectedEdge(e);
                        setSelectedNode(null);
                      }}
                      className="cursor-pointer text-xs bg-[#181a20] hover:bg-[#22252e] p-2 rounded-lg flex items-center justify-between border border-zinc-800 transition-all"
                    >
                      <span className="truncate max-w-[170px] font-mono text-zinc-300">{e.to}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold bg-zinc-800 text-zinc-300">
                        {e.protocol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Edge Inspector */}
        {selectedEdge && !selectedNode && (
          <div className="space-y-5">
            <div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                [CONNECTION LINK]
              </span>
              <div className="flex items-center space-x-2 mt-3 font-bold text-sm text-zinc-100 font-mono">
                <span className="truncate max-w-[110px]">{selectedEdge.from}</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="truncate max-w-[110px]">{selectedEdge.to}</span>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-1">{selectedEdge.id}</p>
            </div>

            {selectedEdge.purpose && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">// PURPOSE</h4>
                <p className="text-xs text-zinc-300 bg-[#181a20] p-3 rounded-lg border border-zinc-800 leading-relaxed font-mono">
                  {selectedEdge.purpose}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#181a20] p-3 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">PROTOCOL</span>
                <span className="font-bold text-zinc-200 capitalize mt-0.5 block">{selectedEdge.protocol}</span>
              </div>
              <div className="bg-[#181a20] p-3 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">TRANSPORT</span>
                <span className="font-bold text-zinc-200 uppercase mt-0.5 block">
                  {selectedEdge.transport || "TCP / IP"}
                </span>
              </div>
            </div>

            {selectedEdge.timeout_ms && (
              <div className="flex items-center space-x-2.5 bg-[#181a20] p-3 rounded-lg border border-zinc-800 text-xs font-mono">
                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase font-bold">TIMEOUT SLA</span>
                  <span className="font-bold text-zinc-200">
                    {selectedEdge.timeout_ms} ms
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
