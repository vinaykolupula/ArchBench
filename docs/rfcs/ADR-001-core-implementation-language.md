# ADR-001: Core Implementation Language and Repository Structure

- **Status**: Accepted
- **Deciders**: ArchBench Core Architecture Team
- **Date**: 2026-11-10

---

## Context

ArchBench requires a language and runtime that supports:
1. Strong static typing for schema modeling, graph operations, and analytical rules.
2. Broad cross-platform execution (macOS, Linux, Windows) with minimal prerequisite setup for developers and CI/CD pipelines.
3. Fast execution for deterministic rule engines and graph traversals.
4. Seamless integration with modern agent ecosystems (such as the Model Context Protocol SDK) and developer tooling.
5. Modular codebase organization allowing decoupled core engines, CLI tools, scenario packs, and SDKs.

## Decision

We chose **TypeScript** targeting Node.js (v20+) organized as a **pnpm monorepo** managed with Turborepo:
1. **Core Runtime**: TypeScript 5.x with ESNext modules and strict type checking enabled.
2. **Monorepo Architecture**:
   - `packages/core`: Core domain models, schemas, and graph abstractions.
   - `packages/archeval`: Evaluation orchestrator, rule engines, and fitness test harness.
   - `packages/just-enough`: Multi-dimensional complexity assessment engine.
   - `packages/scenarios`: Workload and failure simulation engine.
   - `packages/report-engine`: Structured Markdown, JSON, and Mermaid generator.
   - `apps/cli`: Local-first command-line interface.
   - `apps/mcp-server`: Model Context Protocol server exposing tools over stdio.
3. **Package Manager**: `pnpm` with workspace protocol (`workspace:*`) for deterministic dependency resolution and rapid link-free development.

## Consequences

### Positive
- Unified ecosystem across core domain modeling, CLI, report generators, and MCP adapters.
- First-class support for `@modelcontextprotocol/sdk` and JSON Schema validation tools (Ajv).
- Type sharing between domain models and runtime validator outputs ensures zero drift.
- Fast CI builds with parallel test and typecheck execution via Turborepo.

### Negative
- Not as lightweight as a single precompiled Go binary for CLI distribution; requires Node.js runtime or standalone bundled distributions.
- Heavy numerical simulation workloads might require future Rust native addons if graph sizes exceed 100,000 nodes.

## Alternatives Considered
- **Go**: Excellent single-binary CLI distribution and concurrency, but lacks mature MCP SDK support and creates friction for web/UI/report generation integration.
- **Python**: Popular in data science and AI, but weaker static type safety guarantees and slower cold-start CLI execution.
- **Rust**: Unmatched performance and safety, but higher contribution barrier for web/cloud engineers writing declarative scenarios and fitness rules.

