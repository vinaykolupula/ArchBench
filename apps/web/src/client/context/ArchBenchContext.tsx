import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { SynthesisResult } from "@archbench/synthesis";
import {
  DiscoveredSpec,
  EvaluationPayload,
  GraphNodeData,
  GraphEdgeData,
  ActiveTab,
  ScenarioPack,
  SimulationResult,
} from "../types.js";

interface ArchBenchContextType {
  specs: DiscoveredSpec[];
  selectedSpecPath: string;
  setSelectedSpecPath: (path: string) => void;
  yamlContent: string;
  setYamlContent: (yaml: string) => void;
  evaluation: EvaluationPayload | null;
  loading: boolean;
  error: string | null;
  activeAltId: string;
  setActiveAltId: (id: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedNode: GraphNodeData | null;
  setSelectedNode: (node: GraphNodeData | null) => void;
  selectedEdge: GraphEdgeData | null;
  setSelectedEdge: (edge: GraphEdgeData | null) => void;
  scenarios: ScenarioPack[];
  runScenario: (scenarioPath: string, surgeMultiplier: number, failureTarget?: string) => Promise<SimulationResult | null>;
  reEvaluate: (yamlOverride?: string) => Promise<void>;
  simulationResult: SimulationResult | null;
  setSimulationResult: (res: SimulationResult | null) => void;
  synthesisResult: SynthesisResult | null;
  setSynthesisResult: (res: SynthesisResult | null) => void;
  loadSynthesizedArchitecture: (result: SynthesisResult, targetAltId?: string) => Promise<void>;
}

const ArchBenchContext = createContext<ArchBenchContextType | null>(null);

export const ArchBenchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [specs, setSpecs] = useState<DiscoveredSpec[]>([]);
  const [selectedSpecPath, setSelectedSpecPath] = useState<string>("examples/ecommerce-backend/archspec.yaml");
  const [yamlContent, setYamlContent] = useState<string>("");
  const [evaluation, setEvaluation] = useState<EvaluationPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAltId, setActiveAltId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("canvas");
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeData | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioPack[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResult | null>(null);

  // Load available specs
  useEffect(() => {
    async function fetchSpecs() {
      try {
        const res = await fetch("/api/specs");
        const data = await res.json();
        if (data.specs && data.specs.length > 0) {
          setSpecs(data.specs);
          // Default to first example or root
          const preferred = data.specs.find((s: DiscoveredSpec) => s.path.includes("ecommerce-backend")) || data.specs[0];
          setSelectedSpecPath(preferred.path);
        }
      } catch (err: any) {
        console.error("Failed to fetch specs:", err);
      }
    }

    async function fetchScenarios() {
      try {
        const res = await fetch("/api/scenarios");
        const data = await res.json();
        if (data.scenarios) {
          setScenarios(data.scenarios);
        }
      } catch (err: any) {
        console.error("Failed to fetch scenarios:", err);
      }
    }

    fetchSpecs();
    fetchScenarios();
  }, []);

  // Evaluate when selectedSpecPath changes
  const evaluatePath = useCallback(async (path: string, overrideYaml?: string) => {
    setLoading(true);
    setError(null);
    try {
      let rawText = overrideYaml;
      if (!rawText) {
        const fileRes = await fetch(`/api/spec?path=${encodeURIComponent(path)}`);
        const fileData = await fileRes.json();
        rawText = fileData.rawYaml;
        setYamlContent(rawText || "");
      }

      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: rawText, path }),
      });
      const evalData: EvaluationPayload = await evalRes.json();

      setEvaluation(evalData);
      if (evalData.evaluation?.alternatives) {
        const altKeys = Object.keys(evalData.evaluation.alternatives);
        if (altKeys.length > 0) {
          setActiveAltId((prev) => (altKeys.includes(prev) ? prev : altKeys[0]));
        }
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSpecPath) {
      evaluatePath(selectedSpecPath);
    }
  }, [selectedSpecPath, evaluatePath]);

  const reEvaluate = useCallback(
    async (yamlOverride?: string) => {
      await evaluatePath(selectedSpecPath, yamlOverride || yamlContent);
    },
    [evaluatePath, selectedSpecPath, yamlContent]
  );

  const loadSynthesizedArchitecture = useCallback(
    async (result: SynthesisResult, targetAltId?: string) => {
      setSynthesisResult(result);
      const specName = `✨ ${result.brief.name}`;
      const specPath = `synthesized:${result.fullArchSpec.archbench.project}`;

      setSpecs((prev) => {
        const filtered = prev.filter((s) => s.path !== specPath);
        return [{ path: specPath, name: specName, type: "example" }, ...filtered];
      });

      setSelectedSpecPath(specPath);
      setYamlContent(result.fullArchSpecYaml);

      await evaluatePath(specPath, result.fullArchSpecYaml);
      if (targetAltId) {
        setActiveAltId(targetAltId);
      } else if (result.verdict.recommendedAlternativeId) {
        setActiveAltId(result.verdict.recommendedAlternativeId);
      }
    },
    [evaluatePath]
  );

  const runScenario = async (
    scenarioPath: string,
    surgeMultiplier: number,
    failureTarget?: string
  ): Promise<SimulationResult | null> => {
    try {
      const res = await fetch("/api/scenarios/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioPath, surgeMultiplier, failureTarget }),
      });
      const data = await res.json();
      setSimulationResult(data.simulatedOutput);
      return data.simulatedOutput;
    } catch (err) {
      console.error("Scenario run failed:", err);
      return null;
    }
  };

  return (
    <ArchBenchContext.Provider
      value={{
        specs,
        selectedSpecPath,
        setSelectedSpecPath,
        yamlContent,
        setYamlContent,
        evaluation,
        loading,
        error,
        activeAltId,
        setActiveAltId,
        activeTab,
        setActiveTab,
        selectedNode,
        setSelectedNode,
        selectedEdge,
        setSelectedEdge,
        scenarios,
        runScenario,
        reEvaluate,
        simulationResult,
        setSimulationResult,
        synthesisResult,
        setSynthesisResult,
        loadSynthesizedArchitecture,
      }}
    >
      {children}
    </ArchBenchContext.Provider>
  );
};

export const useArchBench = () => {
  const context = useContext(ArchBenchContext);
  if (!context) {
    throw new Error("useArchBench must be used within an ArchBenchProvider");
  }
  return context;
};

