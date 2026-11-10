# ADR-006: Local-First CLI as the Primary User Interface

- **Status**: Accepted
- **Deciders**: ArchBench Core Architecture Team
- **Date**: 2026-11-10

---

## Context

Software architects, staff engineers, and automated agents interact with architectures in diverse environments: local terminal emulators, Git pre-commit hooks, continuous integration runners (GitHub Actions, GitLab CI), and IDE integrations.

Creating a hosted SaaS platform or requiring a web browser UI as the primary interaction point introduces friction, requires network connectivity, raises data confidentiality concerns for proprietary designs, and complicates headless CI/CD automation.

## Decision

We chose a **local-first Command-Line Interface (`@archbench/cli`, binary `archbench`)** as the primary canonical interface for ArchBench:
1. **Core Command Grammar**:
   - `archbench validate <spec>`: Strict schema and topological graph validation.
   - `archbench evaluate <spec>`: Full architecture fitness evaluation, complexity scoring, and scenario execution.
   - `archbench scenarios list`: Discovery of available workload and failure packs.
   - `archbench tests list`: Inspection of registered fitness rules and severities.
   - `archbench report <file>`: Generation of Markdown and JSON reports from existing evaluation results.
2. **Standard Output Conventions**:
   - Clean, colorized terminal summaries with emoji indicators and ANSI tables for interactive humans.
   - Standard Unix exit codes (`0` for success/pass, `1` for critical failures) for direct integration into CI test matrices.
   - Flags for machine-readable output: `--json`, `--output <path>`, `--learning-mode`.
3. **Local Filesystem Resolution**: Resolves all file paths relative to `process.env.INIT_CWD || process.cwd()`, supporting execution from repository root or package directories.

## Consequences

### Positive
- Works offline and behind corporate firewalls without external dependencies.
- Zero latency for rapid local design iteration.
- Trivial integration into GitHub Actions, pre-commit hooks, and terminal workflows.
- Single command surface wraps all underlying engine packages (`@archbench/archeval`, `@archbench/scenarios`, `@archbench/report-engine`).

### Negative
- Terminal text formatting limits visual diagram richness compared to an interactive graphical canvas (mitigated by exporting Mermaid diagrams to Markdown).

## Alternatives Considered
- **Web-First GUI / Cloud SaaS Dashboard**: Rich visualization capabilities, but high hosting complexity, user authentication overhead, and privacy concerns regarding enterprise architecture data.
- **Language-Specific IDE Extension Only**: Good for VS Code users, but excludes CLI automation, pre-commit hooks, CI runners, and users of other editors (Neovim, JetBrains).

