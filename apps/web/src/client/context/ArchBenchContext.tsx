import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { SynthesisResult } from "@archbench/synthesis";
import {
  getLessonByComponentType,
  getLessonById,
  getLessonByRuleId,
} from "@archbench/learning-mode";
import {
  DiscoveredSpec,
  EvaluationPayload,
  GraphNodeData,
  GraphEdgeData,
  ActiveTab,
  ScenarioPack,
  SimulationResult,
  ActiveLabMission,
} from "../types.js";
import { useLearnProgress } from "../hooks/useLearnProgress.js";

export type LearnSubView = "curriculum" | "sandbox" | "primer";

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
  reEvaluate: (yamlOverride?: string) => Promise<boolean>;
  simulationResult: SimulationResult | null;
  setSimulationResult: (res: SimulationResult | null) => void;
  synthesisResult: SynthesisResult | null;
  setSynthesisResult: (res: SynthesisResult | null) => void;
  loadSynthesizedArchitecture: (result: SynthesisResult, targetAltId?: string) => Promise<void>;
  selectedLessonId: string;
  setSelectedLessonId: (lessonId: string) => void;
  learnSubView: LearnSubView;
  setLearnSubView: (view: LearnSubView) => void;
  openLessonInLearn: (query: string, kind?: "id" | "rule" | "component") => void;
  activeLab: ActiveLabMission | null;
  setActiveLab: (lab: ActiveLabMission | null) => void;
  loadCustomYamlIntoCanvas: (
    yaml: string,
    title: string,
    slug: string,
    targetTab?: ActiveTab,
    labMission?: ActiveLabMission | null
  ) => Promise<void>;
  learn: ReturnType<typeof useLearnProgress>;
}

const ArchBenchContext = createContext<ArchBenchContextType | null>(null);

function normalizeEvaluationPayload(raw: EvaluationPayload): EvaluationPayload {
  if (!raw?.evaluation?.alternatives) return raw;
  const normalizedAlts: EvaluationPayload["evaluation"]["alternatives"] = {};
  for (const [altKey, alt] of Object.entries(raw.evaluation.alternatives)) {
    normalizedAlts[altKey] = {
      ...alt,
      findings: (alt.findings || []).map((f) => ({
        ...f,
        ruleId: f.ruleId || f.testId || "RULE",
        message: f.message || f.summary || f.title,
        remediation:
          f.remediation ||
          (Array.isArray(f.suggestedActions) && f.suggestedActions.length > 0
            ? f.suggestedActions.join(" • ")
            : undefined),
      })),
    };
  }
  return {
    ...raw,
    evaluation: {
      ...raw.evaluation,
      alternatives: normalizedAlts,
    },
  };
}

const VALID_INITIAL_TABS: ActiveTab[] = [
  "home",
  "browse",
  "canvas",
  "dashboard",
  "complexity",
  "simulator",
  "comparison",
  "editor",
  "learn",
];

function getInitialTab(): ActiveTab {
  if (typeof window === "undefined") return "home";
  const requested = new URLSearchParams(window.location.search).get("tab") as ActiveTab | null;
  if (requested && VALID_INITIAL_TABS.includes(requested)) {
    return requested;
  }
  return "home";
}

export const ArchBenchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [specs, setSpecs] = useState<DiscoveredSpec[]>([]);
  const [selectedSpecPath, setSelectedSpecPath] = useState<string>("examples/ecommerce-backend/archspec.yaml");
  const [yamlContent, setYamlContent] = useState<string>("");
  const [evaluation, setEvaluation] = useState<EvaluationPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAltId, setActiveAltId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeData | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioPack[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResult | null>(null);

  const learn = useLearnProgress();
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    learn.progress.lastActiveLessonId || "lesson-zero-to-millions"
  );
  const [learnSubView, setLearnSubView] = useState<LearnSubView>("curriculum");
  const [activeLab, setActiveLab] = useState<ActiveLabMission | null>(null);
  const evalRequestIdRef = useRef<number>(0);

  // Load available specs
  useEffect(() => {
    async function fetchSpecs() {
      try {
        const res = await fetch("/api/specs");
        if (!res.ok) throw new Error(`Failed to fetch workspace specs (${res.status})`);
        const data = await res.json();
        if (data.specs && data.specs.length > 0) {
          setSpecs(data.specs);
          const preferred =
            (data.initialSpecPath &&
              data.specs.find((s: DiscoveredSpec) => s.path === data.initialSpecPath)) ||
            data.specs.find((s: DiscoveredSpec) => s.path.includes("ecommerce-backend")) ||
            data.specs[0];
          setSelectedSpecPath(preferred.path);
          if (data.initialSpecPath && !new URLSearchParams(window.location.search).has("tab")) {
            setActiveTab("canvas");
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch specs:", err);
      }
    }

    async function fetchScenarios() {
      try {
        const res = await fetch("/api/scenarios");
        if (!res.ok) throw new Error(`Failed to fetch scenario packs (${res.status})`);
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

  const evaluatePath = useCallback(async (path: string, overrideYaml?: string): Promise<boolean> => {
    if (!overrideYaml && (path.startsWith("synthesized:") || path.startsWith("academy:"))) {
      return false;
    }
    const requestId = ++evalRequestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      let rawText = overrideYaml;
      if (!rawText) {
        const fileRes = await fetch(`/api/spec?path=${encodeURIComponent(path)}`);
        const fileData = await fileRes.json().catch(() => ({}));
        if (requestId !== evalRequestIdRef.current) return false;
        if (!fileRes.ok) {
          throw new Error(fileData?.error || `Failed to load spec (${fileRes.status})`);
        }
        rawText = fileData.rawYaml;
        setYamlContent(rawText || "");
      }

      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: rawText, path }),
      });
      const evalRaw: any = await evalRes.json().catch(() => ({}));
      if (requestId !== evalRequestIdRef.current) return false;

      if (!evalRes.ok && evalRaw?.valid !== false) {
        throw new Error(evalRaw?.error || `Evaluation request failed (${evalRes.status})`);
      }

      const evalData = normalizeEvaluationPayload(evalRaw as EvaluationPayload);
      setEvaluation(evalData);
      if (evalRaw?.valid === false) {
        if (evalRaw?.error) setError(evalRaw.error);
        return false;
      }

      if (evalData.evaluation?.alternatives) {
        const altKeys = Object.keys(evalData.evaluation.alternatives);
        if (altKeys.length > 0) {
          setActiveAltId((prev) => (altKeys.includes(prev) ? prev : altKeys[0]));
        }
      }
      return true;
    } catch (err: any) {
      if (requestId === evalRequestIdRef.current) {
        setError(err.message || String(err));
      }
      return false;
    } finally {
      if (requestId === evalRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setSimulationResult(null);
    setActiveLab((prev) =>
      prev && selectedSpecPath !== `academy:${prev.labId}` ? null : prev
    );
    if (selectedSpecPath && !selectedSpecPath.startsWith("synthesized:") && !selectedSpecPath.startsWith("academy:")) {
      evaluatePath(selectedSpecPath);
    }
  }, [selectedSpecPath, evaluatePath]);

  const reEvaluate = useCallback(
    async (yamlOverride?: string): Promise<boolean> => {
      return await evaluatePath(selectedSpecPath, yamlOverride ?? yamlContent);
    },
    [evaluatePath, selectedSpecPath, yamlContent]
  );

  const loadSynthesizedArchitecture = useCallback(
    async (result: SynthesisResult, targetAltId?: string) => {
      setSynthesisResult(result);
      setActiveLab(null);
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

  const loadCustomYamlIntoCanvas = useCallback(
    async (
      yaml: string,
      title: string,
      slug: string,
      targetTab: ActiveTab = "canvas",
      labMission: ActiveLabMission | null = null
    ) => {
      const specPath = `academy:${slug}`;
      setActiveLab(labMission);
      setSpecs((prev) => {
        const filtered = prev.filter((s) => s.path !== specPath);
        return [{ path: specPath, name: title, type: "example" }, ...filtered];
      });
      setSelectedSpecPath(specPath);
      setYamlContent(yaml);
      await evaluatePath(specPath, yaml);
      setActiveTab(targetTab);
    },
    [evaluatePath]
  );

  const openLessonInLearn = useCallback(
    (query: string, kind: "id" | "rule" | "component" = "id") => {
      let resolved =
        kind === "rule"
          ? getLessonByRuleId(query)
          : kind === "component"
          ? getLessonByComponentType(query)
          : getLessonById(query);

      if (!resolved) {
        resolved =
          getLessonById(query) ||
          getLessonByRuleId(query) ||
          getLessonByComponentType(query);
      }

      if (resolved) {
        setSelectedLessonId(resolved.id);
      }
      setLearnSubView("curriculum");
      setActiveTab("learn");
    },
    []
  );

  const runScenario = async (
    scenarioPath: string,
    surgeMultiplier: number,
    failureTarget?: string
  ): Promise<SimulationResult | null> => {
    setError(null);
    try {
      const res = await fetch("/api/scenarios/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioPath, surgeMultiplier, failureTarget }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Scenario simulation failed (${res.status})`);
      }
      setSimulationResult(data.simulatedOutput);
      return data.simulatedOutput;
    } catch (err: any) {
      console.error("Scenario run failed:", err);
      setError(err.message || "Scenario simulation failed.");
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
        selectedLessonId,
        setSelectedLessonId,
        learnSubView,
        setLearnSubView,
        openLessonInLearn,
        activeLab,
        setActiveLab,
        loadCustomYamlIntoCanvas,
        learn,
      }}
    >
      {children}
    </ArchBenchContext.Provider>
  );
};

export const useArchBench = (): ArchBenchContextType => {
  const ctx = useContext(ArchBenchContext);
  if (!ctx) throw new Error("useArchBench must be used within ArchBenchProvider");
  return ctx;
};
