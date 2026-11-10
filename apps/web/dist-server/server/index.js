import express from "express";
import cors from "cors";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import open from "open";
import YAML from "yaml";
import { loadArchSpecText, evaluateLoadedSpecification, BUILTIN_FITNESS_TESTS, } from "@archbench/core";
import { SYSTEM_DESIGN_PRESETS, synthesizeAndBenchmarkArchitecture, detectAvailableAIProvider, } from "@archbench/synthesis";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function createServer(_options = {}) {
    const app = express();
    const rootDir = process.env.INIT_CWD || process.cwd();
    app.use(cors());
    app.use(express.json({ limit: "10mb" }));
    // 1. Health check
    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    // 2. Discover available ArchSpec files
    app.get("/api/specs", async (_req, res) => {
        try {
            const discoveredSpecs = [];
            // Check root archspec.yaml
            const rootSpec = path.join(rootDir, "archspec.yaml");
            try {
                await fs.access(rootSpec);
                discoveredSpecs.push({
                    path: "archspec.yaml",
                    name: "Root Workspace (archspec.yaml)",
                    type: "root",
                });
            }
            catch {
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
                                path: path.relative(rootDir, exSpec),
                                name: entry.name,
                                type: "example",
                            });
                        }
                        catch {
                            // No spec in dir
                        }
                    }
                }
            }
            catch {
                // Examples dir not found
            }
            res.json({ specs: discoveredSpecs });
        }
        catch (err) {
            res.status(500).json({ error: err.message || String(err) });
        }
    });
    // 3. Load spec content
    app.get("/api/spec", async (req, res) => {
        try {
            const relPath = req.query.path || "examples/ecommerce-backend/archspec.yaml";
            const fullPath = path.resolve(rootDir, relPath);
            const rawText = await fs.readFile(fullPath, "utf-8");
            const loaded = loadArchSpecText(rawText);
            res.json({
                path: relPath,
                rawYaml: rawText,
                valid: loaded.validation.valid,
                errors: loaded.validation.errors,
                spec: loaded.spec,
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || String(err) });
        }
    });
    // 4. Evaluate spec
    app.post("/api/evaluate", async (req, res) => {
        try {
            const { yaml, path: specPath } = req.body;
            let rawText = yaml;
            if (!rawText && specPath) {
                const fullPath = path.resolve(rootDir, specPath);
                rawText = await fs.readFile(fullPath, "utf-8");
            }
            if (!rawText) {
                return res.status(400).json({ error: "Missing yaml content or spec path" });
            }
            const loaded = loadArchSpecText(rawText);
            if (!loaded.validation.valid) {
                return res.json({
                    valid: false,
                    errors: loaded.validation.errors,
                    evaluation: null,
                    graphs: {},
                });
            }
            const evaluated = evaluateLoadedSpecification(loaded);
            function categorizeNode(n) {
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
            const graphsData = {};
            for (const [altId, graph] of loaded.graphs.entries()) {
                const nodes = graph.getAllNodes().map((n) => ({
                    ...n,
                    ...categorizeNode(n),
                    metrics: graph.getNodeMetrics(n.id),
                    isSpof: graph.findSinglePointsOfFailure().includes(n.id),
                }));
                const edges = graph.getAllEdges();
                const cycles = graph.findSynchronousCycles();
                const mermaid = graph.toMermaid();
                graphsData[altId] = {
                    nodes,
                    edges,
                    cycles,
                    mermaid,
                    spofs: graph.findSinglePointsOfFailure(),
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
        }
        catch (err) {
            res.status(500).json({ error: err.message || String(err) });
        }
    });
    // 5. Run scenario stress test
    app.post("/api/scenarios/run", async (req, res) => {
        try {
            const { scenarioPath, surgeMultiplier, failureTarget } = req.body;
            const fullScenarioPath = path.resolve(rootDir, scenarioPath || "packs/scenarios/scalability/traffic-burst.yaml");
            const fileContent = await fs.readFile(fullScenarioPath, "utf-8");
            const scenarioPack = YAML.parse(fileContent);
            // Simple mathematical blast radius and latency simulator based on inputs
            const multiplier = Number(surgeMultiplier) || 10;
            const baseRps = 500;
            const projectedRps = baseRps * multiplier;
            const baselineLatencyMs = 25;
            const projectedLatencyMs = baselineLatencyMs * (1 + Math.pow(multiplier / 4, 1.8));
            res.json({
                scenario: scenarioPack,
                simulatedOutput: {
                    projectedRps,
                    projectedLatencyMs: Math.round(projectedLatencyMs),
                    queueDrainTimeSeconds: Math.round(multiplier * 2.5),
                    blastRadiusNodes: failureTarget ? [failureTarget] : [],
                    healthImpact: multiplier > 12 ? "critical" : multiplier > 5 ? "warning" : "nominal",
                },
            });
        }
        catch (err) {
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
            const scenariosDir = path.join(rootDir, "packs/scenarios");
            const packs = [];
            async function scanDir(dir, category) {
                try {
                    const entries = await fs.readdir(dir, { withFileTypes: true });
                    for (const e of entries) {
                        const fullP = path.join(dir, e.name);
                        if (e.isDirectory()) {
                            await scanDir(fullP, e.name);
                        }
                        else if (e.name.endsWith(".yaml") || e.name.endsWith(".yml")) {
                            packs.push({
                                path: path.relative(rootDir, fullP),
                                name: e.name.replace(/\.ya?ml$/, ""),
                                category,
                            });
                        }
                    }
                }
                catch {
                    // ignore missing dirs
                }
            }
            await scanDir(scenariosDir, "root");
            res.json({ scenarios: packs });
        }
        catch (err) {
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
        }
        catch (err) {
            res.status(500).json({ error: err.message || String(err) });
        }
    });
    // 9. Serve built static frontend if present
    const distDir = path.resolve(__dirname, "../../dist");
    try {
        await fs.access(distDir);
        app.use(express.static(distDir));
        app.get("*", (req, res, next) => {
            if (req.path.startsWith("/api"))
                return next();
            res.sendFile(path.join(distDir, "index.html"));
        });
    }
    catch {
        // In pure dev mode without built dist, only /api routes are active
    }
    return app;
}
export async function startServer(options = {}) {
    const app = await createServer(options);
    const port = options.port || 3000;
    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            const url = `http://localhost:${port}`;
            console.log(`\n🚀 ArchBench Studio is running at: ${url}\n`);
            if (options.openBrowser !== false) {
                open(url).catch(() => { });
            }
            resolve({ server, url });
        });
    });
}
// When executed directly (e.g. pnpm --filter @archbench/web run dev)
if (process.argv[1] && process.argv[1].endsWith("index.ts")) {
    startServer({ port: 3000, openBrowser: false }).catch(console.error);
}
//# sourceMappingURL=index.js.map