import express, { Express } from "express";
import cors from "cors";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import open from "open";
import YAML from "yaml";
import {
  loadArchSpecText,
  evaluateLoadedSpecification,
  BUILTIN_FITNESS_TESTS,
  CURRICULUM_TRACKS,
  ACADEMY_RANK_TIERS,
  ALL_LESSONS,
  BREAK_AND_FIX_LABS,
  DELIVERY_FRAMEWORK_STAGES,
  LATENCY_LADDER,
  CAPACITY_PRESETS,
  INTERVIEW_CASE_STUDIES,
  FLASHCARD_DECK,
  calculateCapacityEstimates,
  getLessonById,
  getLearningCard,
} from "@archbench/core";
import {
  SYSTEM_DESIGN_PRESETS,
  synthesizeAndBenchmarkArchitecture,
  detectAvailableAIProvider,
} from "@archbench/synthesis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerOptions {
  port?: number;
  openBrowser?: boolean;
  initialSpec?: string;
}

class PathAccessError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode = 403) {
    super(message);
    this.statusCode = statusCode;
  }
}

function toPosixPath(p: string): string {
  return p.replace(/\\/g, "/");
}

function resolveWithinBase(baseDir: string, targetPath: string): string {
  if (!targetPath || targetPath.includes("\0")) {
    throw new PathAccessError("Invalid file path.", 400);
  }
  const normalizedBase = path.resolve(baseDir);
  const candidate = path.resolve(normalizedBase, targetPath);
  if (candidate !== normalizedBase && !candidate.startsWith(normalizedBase + path.sep)) {
    throw new PathAccessError(`Access denied: path escapes workspace root (${targetPath}).`, 403);
  }
  return candidate;
}

async function resolveExistingDir(candidates: string[]): Promise<string | null> {
  for (const dir of candidates) {
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory()) return path.resolve(dir);
    } catch {
      // Try next candidate
    }
  }
  return null;
}

export async function createServer(options: ServerOptions = {}): Promise<Express> {
  const app: Express = express();
  const rootDir = path.resolve(process.env.INIT_CWD || process.cwd());
  const bundledRootDir = path.resolve(__dirname, "../../../..");

  // Optional CLI-authorized initial spec (e.g. `archbench ui path/to/archspec.yaml`)
  let initialSpecEntry: { key: string; fullPath: string; name: string } | null = null;
  if (options.initialSpec && !options.initialSpec.includes("\0")) {
    const absInitial = path.resolve(rootDir, options.initialSpec);
    try {
      const stat = await fs.stat(absInitial);
      if (stat.isFile()) {
        const insideRoot =
          absInitial === rootDir || absInitial.startsWith(rootDir + path.sep);
        const key = insideRoot
          ? toPosixPath(path.relative(rootDir, absInitial))
          : absInitial;
        initialSpecEntry = {
          key,
          fullPath: absInitial,
          name: path.basename(path.dirname(absInitial)) || path.basename(absInitial),
        };
      }
    } catch {
      // Non-existent initialSpec falls back to workspace discovery
    }
  }

  async function resolveSpecReadPath(requestedPath: string): Promise<string> {
    if (
      initialSpecEntry &&
      (requestedPath === initialSpecEntry.key || requestedPath === initialSpecEntry.fullPath)
    ) {
      return initialSpecEntry.fullPath;
    }
    const candidate = resolveWithinBase(rootDir, requestedPath);
    const realRoot = await fs.realpath(rootDir).catch(() => rootDir);
    const realCandidate = await fs.realpath(candidate).catch(() => {
      throw new PathAccessError(`Specification file not found: ${requestedPath}`, 404);
    });
    if (realCandidate !== realRoot && !realCandidate.startsWith(realRoot + path.sep)) {
      throw new PathAccessError(`Access denied: symlink escapes workspace root.`, 403);
    }
    return realCandidate;
  }

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // 1. Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 2. Discover available ArchSpec files
  app.get("/api/specs", async (_req, res) => {
    try {
      const discoveredSpecs: Array<{ path: string; name: string; type: "root" | "example" }> = [];

      // Check root archspec.yaml
      const rootSpec = path.join(rootDir, "archspec.yaml");
      try {
        await fs.access(rootSpec);
        discoveredSpecs.push({
          path: "archspec.yaml",
          name: "Root Workspace (archspec.yaml)",
          type: "root",
        });
      } catch {
        // Root spec does not exist
      }

      // Check examples
      const examplesDir = path.join(rootDir, "examples");
      try {
        const entries = await fs.readdir(examplesDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const exSpec = path.join(examplesDir, entry.name, "archspec.yaml");
            try {
              await fs.access(exSpec);
              discoveredSpecs.push({
                path: toPosixPath(path.relative(rootDir, exSpec)),
                name: entry.name,
                type: "example",
              });
            } catch {
              // No spec in dir
            }
          }
        }
      } catch {
        // Examples dir not found
      }

      if (
        initialSpecEntry &&
        !discoveredSpecs.some((s) => s.path === initialSpecEntry!.key)
      ) {
        discoveredSpecs.unshift({
          path: initialSpecEntry.key,
          name: `${initialSpecEntry.name} (CLI Target)`,
          type: "root",
        });
      }

      res.json({
        specs: discoveredSpecs,
        initialSpecPath: initialSpecEntry?.key || null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // 3. Load spec content
  app.get("/api/spec", async (req, res) => {
    try {
      const relPath =
        (typeof req.query.path === "string" && req.query.path) ||
        "examples/ecommerce-backend/archspec.yaml";
      const fullPath = await resolveSpecReadPath(relPath);
      const rawText = await fs.readFile(fullPath, "utf-8");
      const loaded = loadArchSpecText(rawText);

      res.json({
        path: relPath,
        rawYaml: rawText,
        valid: loaded.validation.valid,
        errors: loaded.validation.errors,
        spec: loaded.spec,
      });
    } catch (err: any) {
      if (err instanceof PathAccessError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      if (err instanceof SyntaxError) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // 4. Evaluate spec
  app.post("/api/evaluate", async (req, res) => {
    try {
      const { yaml, path: specPath } = req.body || {};
      let rawText = typeof yaml === "string" ? yaml : "";

      if (!rawText && typeof specPath === "string" && specPath.trim().length > 0) {
        const fullPath = await resolveSpecReadPath(specPath);
        rawText = await fs.readFile(fullPath, "utf-8");
      }

      if (!rawText) {
        return res.status(400).json({ error: "Missing yaml content or spec path" });
      }

      let loaded;
      try {
        loaded = loadArchSpecText(rawText);
      } catch (parseErr: any) {
        return res.status(400).json({
          valid: false,
          errors: [
            {
              path: "yaml",
              message: parseErr?.message || "Invalid YAML syntax",
            },
          ],
          evaluation: null,
          graphs: {},
          error: parseErr?.message || "Invalid YAML syntax",
        });
      }

      if (!loaded.validation.valid) {
        return res.json({
          valid: false,
          errors: loaded.validation.errors,
          evaluation: null,
          graphs: {},
        });
      }

      const evaluated = evaluateLoadedSpecification(loaded);

      function categorizeNode(n: any): { tier: number; tierName: string } {
        if (n.kind === "user") {
          return { tier: 0, tierName: "Clients & Users" };
        }
        if (n.kind === "external_system") {
          return { tier: 5, tierName: "External Cloud & SaaS" };
        }
        const type = (n.componentType || "").toLowerCase();
        if (type.includes("gateway") || type.includes("ingress") || type.includes("load_balancer")) {
          return { tier: 1, tierName: "Ingress & API Gateways" };
        }
        if (type.includes("database") || type.includes("cache") || type.includes("store")) {
          return { tier: 4, tierName: "Persistence & Caches" };
        }
        if (type.includes("queue") || type.includes("bus") || type.includes("stream") || type.includes("worker")) {
          return { tier: 3, tierName: "Async Messaging & Workers" };
        }
        return { tier: 2, tierName: "Core Services & APIs" };
      }

      // Serialize graph topology data for interactive canvas
      const graphsData: Record<string, any> = {};
      for (const [altId, graph] of loaded.graphs.entries()) {
        const spofs = graph.findSinglePointsOfFailure();
        const nodes = graph.getAllNodes().map((n) => ({
          ...n,
          ...categorizeNode(n),
          metrics: graph.getNodeMetrics(n.id),
          isSpof: spofs.includes(n.id),
        }));
        const edges = graph.getAllEdges();
        const cycles = graph.findSynchronousCycles();
        const mermaid = graph.toMermaid();

        graphsData[altId] = {
          nodes,
          edges,
          cycles,
          mermaid,
          spofs,
        };
      }

      res.json({
        valid: true,
        errors: [],
        evaluation: evaluated.evaluation,
        markdownReport: evaluated.markdownReport,
        jsonReport: evaluated.jsonReport,
        graphs: graphsData,
        spec: loaded.normalizedSpec,
      });
    } catch (err: any) {
      if (err instanceof PathAccessError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // 5. Run scenario stress test
  app.post("/api/scenarios/run", async (req, res) => {
    try {
      const { scenarioPath, surgeMultiplier, failureTarget } = req.body || {};
      const scenariosBase = await resolveExistingDir([
        path.join(rootDir, "packs/scenarios"),
        path.join(bundledRootDir, "packs/scenarios"),
      ]);
      if (!scenariosBase) {
        return res.status(404).json({ error: "Scenario packs directory not found." });
      }

      const requestedScenario =
        typeof scenarioPath === "string" && scenarioPath.trim().length > 0
          ? scenarioPath
          : "packs/scenarios/scalability/traffic-burst.yaml";
      const normalizedReq = toPosixPath(requestedScenario).replace(/^packs\/scenarios\//, "");
      if (!/\.ya?ml$/i.test(normalizedReq)) {
        return res.status(400).json({ error: "Scenario path must point to a YAML definition." });
      }
      const fullScenarioPath = resolveWithinBase(scenariosBase, normalizedReq);
      const realScenariosBase = await fs.realpath(scenariosBase).catch(() => scenariosBase);
      const realScenarioPath = await fs.realpath(fullScenarioPath).catch(() => {
        throw new PathAccessError(`Scenario file not found: ${requestedScenario}`, 404);
      });
      if (!realScenarioPath.startsWith(realScenariosBase + path.sep)) {
        throw new PathAccessError("Access denied: scenario path escapes packs/scenarios.", 403);
      }

      const fileContent = await fs.readFile(realScenarioPath, "utf-8");
      const scenarioPack = YAML.parse(fileContent);

      // Validate surge multiplier bounds so NaN / negative values cannot corrupt simulation output
      const rawMultiplier = surgeMultiplier === undefined ? 10 : Number(surgeMultiplier);
      if (!Number.isFinite(rawMultiplier) || rawMultiplier < 0.1 || rawMultiplier > 100) {
        return res.status(400).json({
          error: "surgeMultiplier must be a finite number between 0.1 and 100.",
        });
      }
      const multiplier = rawMultiplier;
      const baseRps = 500;
      const projectedRps = Math.round(baseRps * multiplier);
      const baselineLatencyMs = 25;
      const projectedLatencyMs = baselineLatencyMs * (1 + Math.pow(multiplier / 4, 1.8));

      res.json({
        scenario: scenarioPack,
        simulatedOutput: {
          projectedRps,
          projectedLatencyMs: Math.round(projectedLatencyMs),
          queueDrainTimeSeconds: Math.round(multiplier * 2.5),
          blastRadiusNodes: typeof failureTarget === "string" && failureTarget ? [failureTarget] : [],
          healthImpact: multiplier > 12 ? "critical" : multiplier > 5 ? "warning" : "nominal",
        },
      });
    } catch (err: any) {
      if (err instanceof PathAccessError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // 6. Registered fitness tests
  app.get("/api/tests", (_req, res) => {
    res.json({ tests: BUILTIN_FITNESS_TESTS });
  });

  // 7. Registered scenario packs
  app.get("/api/scenarios", async (_req, res) => {
    try {
      const scenariosDir = await resolveExistingDir([
        path.join(rootDir, "packs/scenarios"),
        path.join(bundledRootDir, "packs/scenarios"),
      ]);
      const packs: Array<{ path: string; name: string; category: string }> = [];
      if (!scenariosDir) {
        res.json({ scenarios: packs });
        return;
      }

      async function scanDir(dir: string, category: string) {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const e of entries) {
            const fullP = path.join(dir, e.name);
            if (e.isDirectory()) {
              await scanDir(fullP, e.name);
            } else if (e.name.endsWith(".yaml") || e.name.endsWith(".yml")) {
              packs.push({
                path: `packs/scenarios/${toPosixPath(path.relative(scenariosDir!, fullP))}`,
                name: e.name.replace(/\.ya?ml$/, ""),
                category,
              });
            }
          }
        } catch {
          // ignore missing dirs
        }
      }

      await scanDir(scenariosDir, "root");
      res.json({ scenarios: packs });
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // 8. Dynamic Architecture Synthesis & Benchmarking
  app.get("/api/synthesis/presets", (_req, res) => {
    res.json({ presets: SYSTEM_DESIGN_PRESETS });
  });

  app.get("/api/synthesis/ai-status", (_req, res) => {
    const aiConfig = detectAvailableAIProvider();
    res.json({
      available: aiConfig !== null,
      provider: aiConfig?.provider || null,
      model: aiConfig?.model || null,
    });
  });

  app.post("/api/synthesis/generate", async (req, res) => {
    try {
      const { brief, aiConfig } = req.body;
      if (!brief || !brief.name || !brief.scaleTargets) {
        res.status(400).json({ error: "Missing required brief fields (name, scaleTargets)." });
        return;
      }
      const result = await synthesizeAndBenchmarkArchitecture(brief, aiConfig);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // 8b. Interactive Learning Mode & Interview Primer API
  app.get("/api/learn/curriculum", (_req, res) => {
    res.json({
      tracks: CURRICULUM_TRACKS,
      rankTiers: ACADEMY_RANK_TIERS,
      lessons: ALL_LESSONS,
      labs: Object.values(BREAK_AND_FIX_LABS),
    });
  });

  app.get("/api/learn/lessons/:id", (req, res) => {
    const lesson = getLessonById(req.params.id);
    if (!lesson) {
      res.status(404).json({ error: `Lesson "${req.params.id}" not found.` });
      return;
    }
    const card = getLearningCard(req.params.id);
    res.json({ lesson, card });
  });

  app.get("/api/learn/primer", (_req, res) => {
    res.json({
      deliveryFramework: DELIVERY_FRAMEWORK_STAGES,
      latencyLadder: LATENCY_LADDER,
      capacityPresets: CAPACITY_PRESETS,
      caseStudies: INTERVIEW_CASE_STUDIES,
      flashcards: FLASHCARD_DECK,
    });
  });

  app.post("/api/learn/estimate", (req, res) => {
    try {
      const body = req.body || {};
      const finiteOr = (val: unknown, fallback: number): number => {
        if (val === undefined || val === null || val === "") return fallback;
        const n = Number(val);
        return Number.isFinite(n) ? n : fallback;
      };
      const result = calculateCapacityEstimates({
        dailyActiveUsers: finiteOr(body.dailyActiveUsers, 1_000_000),
        actionsPerUserPerDay: finiteOr(body.actionsPerUserPerDay, 10),
        readToWriteRatio: finiteOr(body.readToWriteRatio, 10),
        payloadSizeKb: finiteOr(body.payloadSizeKb, 2),
        retentionYears: finiteOr(body.retentionYears, 5),
        peakMultiplier: finiteOr(body.peakMultiplier, 3),
        replicationFactor: finiteOr(body.replicationFactor, 3),
        cacheHotSetPercent: finiteOr(body.cacheHotSetPercent, 20),
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || String(err) });
    }
  });

  // 9. Serve workspace assets/ folder live at /assets/... (before dist static fallback)
  const candidateAssetsDirs = Array.from(
    new Set([
      path.join(rootDir, "assets"),
      path.resolve(__dirname, "../../../../assets"),
    ])
  );
  for (const candidateDir of candidateAssetsDirs) {
    try {
      await fs.access(candidateDir);
      app.use("/assets", express.static(candidateDir, { index: false, dotfiles: "ignore" }));
    } catch {
      // Skip non-existent assets directory candidate
    }
  }

  // 10. Serve built static frontend if present
  const distDir = path.resolve(__dirname, "../../dist");
  try {
    await fs.access(distDir);
    app.use(express.static(distDir));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/assets/")) return next();
      res.sendFile(path.join(distDir, "index.html"));
    });
  } catch {
    // In pure dev mode without built dist, only /api routes are active
  }

  return app;
}

export async function startServer(options: ServerOptions = {}) {
  const app = await createServer(options);
  const requestedPort = options.port ?? 3000;

  return new Promise<{ server: any; url: string }>((resolve, reject) => {
    const server = app.listen(requestedPort, () => {
      const address = server.address();
      const actualPort =
        address && typeof address === "object" ? address.port : requestedPort;
      const url = `http://localhost:${actualPort}`;
      console.log(`\n🚀 ArchBench Studio is running at: ${url}\n`);
      if (options.openBrowser !== false) {
        open(url).catch(() => {});
      }
      resolve({ server, url });
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`Port ${requestedPort} is already in use. Try passing --port <number>.`));
      } else {
        reject(err);
      }
    });
  });
}

// When executed directly (e.g. pnpm --filter @archbench/web run dev)
if (process.argv[1] && process.argv[1].endsWith("index.ts")) {
  startServer({ port: 3000, openBrowser: false }).catch(console.error);
}
