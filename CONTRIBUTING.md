# Contributing to ArchBench

Thank you for your interest in contributing to ArchBench! ArchBench is an open-source framework dedicated to making system design reasoning, architecture evaluation, and failure-driven validation accessible, deterministic, and reproducible.

---

## How Can You Contribute?

1. **Fitness Tests (`packages/fitness-tests`):** Implement new deterministic architecture checks across scalability, reliability, data consistency, security, and operability.
2. **Synthesis & Presets (`packages/synthesis`):** Add iconic system design presets or improve heuristic normalization algorithms.
3. **Scenario Packs (`packs/`):** Write declarative failure and stress scenarios in YAML for the scenario engine.
4. **Reference Architectures (`examples/`):** Contribute real-world architectural case studies with expected findings and multiple alternatives.
5. **Interactive Web Studio (`apps/web`):** Enhance the visual canvas, telemetry graphs, and design system components.
6. **AI & Agent Integrations (`apps/mcp-server`):** Expand MCP tools, agent instructions, and CI review workflows.

---

## Monorepo Development Setup

### Prerequisites
- **Node.js**: LTS version >= 20.0.0 (Node 22 recommended)
- **pnpm**: >= 9.0.0 (pnpm 12 supported)
- **Git**: Modern git client

### Setup Steps

```bash
# 1. Clone your fork of the repository
git clone https://github.com/vishwa98/ArchBench.git
cd ArchBench

# 2. Install workspace dependencies
pnpm install

# 3. Build all workspace packages
pnpm build

# 4. Verify test suite and static analysis
pnpm test
pnpm typecheck
```

---

## Development Workflow & Workspace Scripts

The root `package.json` provides scripts to manage all packages across the monorepo:

| Command | Action |
| :--- | :--- |
| `pnpm build` | Compiles TypeScript across all workspace packages and builds the web client. |
| `pnpm typecheck` | Runs `tsc --noEmit` across all 13 workspace packages. |
| `pnpm test` | Runs the Vitest test suite across all packages. |
| `pnpm ui` | Launches the interactive Web Studio on `http://localhost:3000`. |
| `pnpm cli <args>` | Runs the `archbench` CLI. |
| `pnpm run benchmark` | Runs the 50-case empirical benchmark harness. |
| `pnpm run release:check` | Executes all 5 pre-release verification gates. |

---

## Quality Bar & Verification Gates

Before submitting any Pull Request, you **must** ensure that the pre-release verification gate passes:

```bash
pnpm run release:check
```

This gate runs 5 automated checks:
1. **JSON Schema Compile & Validation:** Verifies Draft 2020-12 schema rules.
2. **Full Monorepo TypeCheck:** Ensures zero TypeScript errors across all 13 workspace packages.
3. **Vitest Unit & Integration Suites:** All unit tests must pass.
4. **Golden Reference Examples Validation:** All reference architectures under `examples/` must validate without syntax or schema errors.
5. **Empirical Benchmark Suite:** The 50-case benchmark harness must maintain 100% Precision, Recall, and F1 score with zero regressions.

### Guidelines for New Fitness Rules
Every new fitness rule must adhere to the following standards:
- **Deterministic:** The same specification and inputs must yield identical findings across repeated runs.
- **Evidence-Grounded:** Every finding must cite the exact component, connection, requirement, or calculation that produced it.
- **Three-State Testing:** Tests must include explicit test fixtures for passing (`pass`), failing (`fail`), and missing information (`unknown`).
- **Zero-Network Execution:** Must run 100% locally with zero external network requests (ADR-010).

---

## Submitting Pull Requests

1. **Fork & Branch:** Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-new-fitness-rule
   ```
2. **Commit Messages:** Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(fitness-tests): add distributed lock timeout rule`
   - `fix(graph-engine): resolve cycle detection edge case`
   - `docs(readme): add mcp server setup example`
3. **Run Pre-Release Checks:**
   ```bash
   pnpm run release:check
   ```
4. **Open a PR:** Submit a Pull Request targeting `main`. Fill in the PR template with the motivation, changes made, and test evidence.

---

## License

By contributing to ArchBench, you agree that your contributions will be licensed under the project's [Apache 2.0 License](LICENSE).
