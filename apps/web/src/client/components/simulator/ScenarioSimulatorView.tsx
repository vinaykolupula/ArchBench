import React, { useState } from "react";
import { useArchBench } from "../../context/ArchBenchContext.js";
import {
  Flame,
  Gauge,
  Play,
  RotateCcw,
  Zap,
  Clock,
  Activity,
  ArrowRight,
  ShieldAlert,
  Server,
  Sliders,
} from "lucide-react";

export const ScenarioSimulatorView: React.FC = () => {
  const {
    scenarios,
    runScenario,
    evaluation,
    activeAltId,
    simulationResult,
    setSimulationResult,
    setActiveTab,
  } = useArchBench();

  const [selectedScenario, setSelectedScenario] = useState<string>(
    "packs/scenarios/scalability/traffic-burst.yaml"
  );
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(10);
  const [failureTarget, setFailureTarget] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const activeGraph = evaluation?.graphs?.[activeAltId];
  const allNodes = activeGraph?.nodes || [];

  const handleRun = async () => {
    setIsSimulating(true);
    await runScenario(selectedScenario, surgeMultiplier, failureTarget || undefined);
    setIsSimulating(false);
  };

  const handleReset = () => {
    setSimulationResult(null);
    setSurgeMultiplier(10);
    setFailureTarget("");
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 overflow-y-auto h-full text-zinc-200 drafting-dot-grid font-mono">
      {/* Header - Machined Grey Chrome */}
      <div className="chrome-chassis rounded-2xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-b from-[#242730] to-[#17191e] border border-zinc-700/80 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-zinc-300 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700">
              <Flame className="w-3.5 h-3.5 text-zinc-400" />
              <span>// STRESS TESTING LABORATORY & FAULT INJECTION</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight uppercase">
              Workload Surge & Fault Injection Simulation
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Stress-test architectural resilience against 10x traffic surges, database outages, and
              queue worker lag before committing to physical infrastructure or writing backend code.
            </p>
          </div>

          {simulationResult && (
            <button
              onClick={() => setActiveTab("canvas")}
              className="chrome-button-accent flex items-center space-x-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-lg shrink-0 cursor-pointer"
            >
              <span>View Blast Radius on Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Control Rack */}
        <div className="lg:col-span-1 paper-card drafting-corners p-6 rounded-xl space-y-6 border border-zinc-700/80 bg-[#16181e] shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              // SIMULATION PARAMETERS
            </h2>
          </div>

          {/* Scenario Pack Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Scenario Template</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full bg-[#131519] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none font-mono"
            >
              {scenarios.map((sc) => (
                <option key={sc.path} value={sc.path} className="bg-zinc-900 text-zinc-200">
                  {sc.category} / {sc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Traffic Surge Slider */}
          <div className="space-y-3 bg-[#131519] p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Traffic Surge</label>
              <span className="font-mono text-xs font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                [{surgeMultiplier}x SURGE]
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={surgeMultiplier}
              onChange={(e) => setSurgeMultiplier(Number(e.target.value))}
              className="calibrated-slider w-full cursor-ew-resize"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>1x (Nominal)</span>
              <span>10x (Spike)</span>
              <span>20x (Extreme)</span>
            </div>
          </div>

          {/* Fault Injection Target */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Inject Outage Target (Optional)
            </label>
            <select
              value={failureTarget}
              onChange={(e) => setFailureTarget(e.target.value)}
              className="w-full bg-[#131519] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none font-mono"
            >
              <option value="" className="bg-zinc-900 text-zinc-200">
                None (Nominal Topology)
              </option>
              {allNodes
                .filter((n) => n.kind !== "user")
                .map((n) => (
                  <option key={n.id} value={n.id} className="bg-zinc-900 text-zinc-200">
                    {n.name} ({n.id})
                  </option>
                ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex space-x-2">
            <button
              onClick={handleRun}
              disabled={isSimulating}
              className="flex-1 chrome-button-accent flex items-center justify-center space-x-2 font-bold text-xs py-2.5 rounded-lg shadow-lg uppercase tracking-wider cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSimulating ? "COMPUTING..." : "RUN STRESS TEST"}</span>
            </button>
            <button
              onClick={handleReset}
              className="chrome-button p-2.5 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Reset Parameters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Simulation Outcomes Display */}
        <div className="lg:col-span-2 space-y-4">
          <div className="paper-card drafting-corners p-6 rounded-xl space-y-6 border border-zinc-700/80 bg-[#16181e] shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                // SIMULATION TELEMETRY
              </h3>
              {simulationResult ? (
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider border ${
                    simulationResult.healthImpact === "nominal"
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                      : simulationResult.healthImpact === "warning"
                      ? "bg-amber-950/60 text-amber-300 border-amber-800"
                      : "bg-red-950/60 text-red-300 border-red-800"
                  }`}
                >
                  STATUS: {simulationResult.healthImpact.toUpperCase()}
                </span>
              ) : (
                <span className="text-xs text-zinc-500">Awaiting simulation run</span>
              )}
            </div>

            {simulationResult ? (
              <div className="space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#131519] p-4 rounded-xl border border-zinc-800">
                    <div className="flex items-center space-x-2 text-zinc-400 text-xs font-semibold uppercase">
                      <Zap className="w-4 h-4" />
                      <span>Projected RPS</span>
                    </div>
                    <span className="text-2xl font-black text-zinc-100 mt-2 block font-mono">
                      {simulationResult.projectedRps.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      From baseline 500 RPS
                    </span>
                  </div>

                  <div className="bg-[#131519] p-4 rounded-xl border border-zinc-800">
                    <div className="flex items-center space-x-2 text-zinc-400 text-xs font-semibold uppercase">
                      <Activity className="w-4 h-4" />
                      <span>Surge P99 Latency</span>
                    </div>
                    <span className="text-2xl font-black text-zinc-100 mt-2 block font-mono">
                      {simulationResult.projectedLatencyMs} ms
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Baseline: 25 ms
                    </span>
                  </div>

                  <div className="bg-[#131519] p-4 rounded-xl border border-zinc-800">
                    <div className="flex items-center space-x-2 text-zinc-400 text-xs font-semibold uppercase">
                      <Clock className="w-4 h-4" />
                      <span>Drain Window</span>
                    </div>
                    <span className="text-2xl font-black text-zinc-100 mt-2 block font-mono">
                      ~{simulationResult.queueDrainTimeSeconds}s
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Worker scaleout window
                    </span>
                  </div>
                </div>

                {/* Blast Radius Section */}
                <div className="p-4 rounded-xl bg-[#131519] border border-zinc-800 space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>// FAULT BLAST RADIUS</span>
                  </div>
                  {simulationResult.blastRadiusNodes.length > 0 ? (
                    <div className="space-y-2.5">
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        The simulated failure directly degrades the target node and cascades to
                        synchronous dependencies:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {simulationResult.blastRadiusNodes.map((id) => (
                          <span
                            key={id}
                            className="text-xs font-mono font-semibold bg-red-950/60 text-red-300 border border-red-700 px-3 py-1 rounded-lg flex items-center space-x-1.5"
                          >
                            <Server className="w-3.5 h-3.5" />
                            <span>{id}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Zero single-point-of-failure outages detected under this traffic surge. The
                      asynchronous message queues absorb incoming spikes without cascading timeouts.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-500 space-y-3 font-mono">
                <Gauge className="w-12 h-12 mx-auto text-zinc-600" />
                <h4 className="font-bold text-zinc-300 text-sm uppercase">// READY TO SIMULATE WORKLOAD SURGE</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Select a scenario parameter and click <strong>RUN STRESS TEST</strong> to calculate
                  queue overflow thresholds and latency escalation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
