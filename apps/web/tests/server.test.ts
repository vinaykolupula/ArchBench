import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as path from "node:path";
import type { Server } from "node:http";
import { startServer } from "../src/server/index.js";

describe("ArchBench Studio HTTP Server Security & API Contracts", () => {
  let server: Server;
  let baseUrl: string;
  const origInitCwd = process.env.INIT_CWD;

  beforeAll(async () => {
    process.env.INIT_CWD = path.resolve(__dirname, "../../..");
    const started = await startServer({
      port: 0,
      openBrowser: false,
      initialSpec: "examples/notification-platform/archspec.yaml",
    });
    server = started.server;
    baseUrl = started.url;
  });

  afterAll(async () => {
    process.env.INIT_CWD = origInitCwd;
    await new Promise<void>((resolve) => {
      if (server) server.close(() => resolve());
      else resolve();
    });
  });

  it("exposes initialSpecPath when configured on startup", async () => {
    const res = await fetch(`${baseUrl}/api/specs`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.initialSpecPath).toBe("examples/notification-platform/archspec.yaml");
    expect(Array.isArray(data.specs)).toBe(true);
    expect(data.specs.length).toBeGreaterThanOrEqual(5);
  });

  it("blocks path traversal on /api/spec, /api/evaluate, and /api/scenarios/run", async () => {
    const specRes = await fetch(`${baseUrl}/api/spec?path=../../package.json`);
    expect(specRes.status).toBe(403);

    const evalRes = await fetch(`${baseUrl}/api/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "../../package.json" }),
    });
    expect(evalRes.status).toBe(403);

    const scenRes = await fetch(`${baseUrl}/api/scenarios/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioPath: "../../package.json", surgeMultiplier: 5 }),
    });
    expect(scenRes.status).toBe(400);

    const scenYamlEscapeRes = await fetch(`${baseUrl}/api/scenarios/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioPath: "../../../etc/foo.yaml", surgeMultiplier: 5 }),
    });
    expect(scenYamlEscapeRes.status).toBe(403);
  });

  it("returns structured 400 validation payload on malformed YAML", async () => {
    const res = await fetch(`${baseUrl}/api/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yaml: "archbench: [unclosed" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors[0].path).toBe("yaml");
  });

  it("rejects out-of-range surgeMultiplier values cleanly", async () => {
    const res = await fetch(`${baseUrl}/api/scenarios/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioPath: "packs/scenarios/scalability/traffic-burst.yaml",
        surgeMultiplier: -5,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects cleanly on port conflict (EADDRINUSE) instead of crashing", async () => {
    const address = server.address();
    const busyPort = typeof address === "object" && address ? address.port : 0;
    await expect(
      startServer({ port: busyPort, openBrowser: false })
    ).rejects.toThrow(/already in use/i);
  });
});

