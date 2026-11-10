import { ArchSpec, ArchitectureAlternative } from "@archbench/archspec";
import { ArchitectureGraph } from "@archbench/graph-engine";
import {
  ScenarioDefinition,
  ScenarioRunResult,
  AssertionResult,
  ScenarioPackResult,
} from "../types.js";
import { evaluateSafeExpression } from "../expressions/evaluator.js";

export function runScenario(
  scenario: ScenarioDefinition,
  spec: ArchSpec,
  alternative: ArchitectureAlternative,
  _graph: ArchitectureGraph
): ScenarioRunResult {
  // 1. Check Preconditions
  if (scenario.preconditions?.required_components) {
    for (const reqType of scenario.preconditions.required_components) {
      const hasComponent = alternative.components.some((c) => c.type === reqType);
      if (!hasComponent) {
        return {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          category: scenario.category,
          level: scenario.level,
          status: "not_applicable",
          notApplicableReason: `Architecture lacks required component type "${reqType}".`,
          computedMetrics: {},
          assertions: [],
          learning: scenario.learning,
        };
      }
    }
  }

  // 2. Build Evaluation Context
  const inputs: Record<string, any> = {};
  for (const [key, def] of Object.entries(scenario.inputs || {})) {
    // Check if declared in workload
    const workloadVal = alternative.workload?.[key];
    if (workloadVal !== undefined) {
      inputs[key] = workloadVal;
    } else if (def.default !== undefined) {
      inputs[key] = def.default;
    }
  }

  const contextObj: Record<string, any> = {
    inputs,
    workload: alternative.workload || {},
    objectives: alternative.objectives || {},
    system: spec.system || {},
    components: {},
    simulation: {},
  };

  for (const comp of alternative.components) {
    contextObj.components[comp.id] = comp;
  }

  // 3. Run Simulation Calculations
  const computedMetrics: Record<string, any> = {};
  for (const [key, expr] of Object.entries(scenario.simulation || {})) {
    try {
      const val = evaluateSafeExpression(expr, contextObj);
      computedMetrics[key] = val;
      contextObj.simulation[key] = val;
    } catch (err: any) {
      computedMetrics[key] = `Calculation error: ${err.message}`;
    }
  }

  // 4. Evaluate Assertions
  const assertionResults: AssertionResult[] = [];
  let hasCriticalFail = false;
  let hasWarningFail = false;

  for (const assertion of scenario.assertions) {
    const sev = assertion.severity || "warning";
    let passed = false;
    let message = "";

    try {
      const result = evaluateSafeExpression(assertion.condition, contextObj);
      passed = Boolean(result);
      message = passed
        ? `Assertion passed: ${assertion.description}`
        : `Assertion violated: ${assertion.description}`;
    } catch (err: any) {
      passed = false;
      message = `Expression evaluation failed: ${err.message}`;
    }

    if (!passed) {
      if (sev === "critical" || sev === "error") hasCriticalFail = true;
      else if (sev === "warning") hasWarningFail = true;
    }

    assertionResults.push({
      id: assertion.id,
      description: assertion.description,
      passed,
      severity: sev,
      message,
    });
  }

  let status: "pass" | "fail" | "warning" = "pass";
  if (hasCriticalFail) status = "fail";
  else if (hasWarningFail) status = "warning";

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    category: scenario.category,
    level: scenario.level,
    status,
    computedMetrics,
    assertions: assertionResults,
    learning: scenario.learning,
  };
}

export function runScenarioPack(
  packName: string,
  scenarios: ScenarioDefinition[],
  spec: ArchSpec,
  alternative: ArchitectureAlternative,
  _graph: ArchitectureGraph
): ScenarioPackResult {
  const results: ScenarioRunResult[] = [];
  let passedCount = 0;
  let failedCount = 0;
  let warningCount = 0;
  let skippedCount = 0;

  for (const s of scenarios) {
    const res = runScenario(s, spec, alternative, _graph);
    results.push(res);
    if (res.status === "pass") passedCount++;
    else if (res.status === "fail") failedCount++;
    else if (res.status === "warning") warningCount++;
    else if (res.status === "not_applicable") skippedCount++;
  }

  return {
    packName,
    totalScenarios: scenarios.length,
    passedCount,
    failedCount,
    warningCount,
    skippedCount,
    results,
  };
}
