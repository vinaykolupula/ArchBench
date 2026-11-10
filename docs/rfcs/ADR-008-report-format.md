# ADR-008: Dual Report Format - Machine-Readable JSON and Human-Readable Markdown

- **Status**: Accepted
- **Deciders**: ArchBench Core Architecture Team
- **Date**: 2026-11-10

---

## Context

Architectural evaluation reports have two distinct audiences with contradictory requirements:
1. **Automated Systems and Tools**: CI/CD pipelines, dashboard ingestors, SARIF converters, and AI agent contexts need strict, versioned, machine-parseable data with predictable schemas.
2. **Human Stakeholders**: Software architects, engineering directors, and product managers need clean, readable narratives with executive summaries, visual Mermaid topology diagrams, clear trade-off tables, and learning notes.

Generating only JSON makes reports inaccessible to human reviewers in pull requests; generating only unstructured Markdown breaks automated CI gating and agent programmatic consumption.

## Decision

We adopted a dual-output strategy implemented in `@archbench/report-engine`:
1. **Machine-Readable JSON Schema (`schemas/report/v1.schema.json`)**:
   - Strictly versioned (`schemaVersion: "1.0.0"`).
   - Contains raw metadata, timestamps, input file hashes, complete lists of findings (with rule IDs, severities, affected entities, and recommendations), detailed scenario simulation outcomes, and quantitative complexity vectors.
   - Designed for CI gating, programmatic diffs, and long-term trend analysis.
2. **Human-Centric GitHub Flavored Markdown**:
   - Executive Summary table featuring the **Architecture Health Score** (`/ 100`), status banner, and high-level verdict.
   - Visual Mermaid architecture diagrams rendered directly in GitHub PRs.
   - Grouped findings table (Critical, Error, Warning, Info) with rationale and remediation links.
   - Multi-alternative side-by-side trade-off comparison matrix.
   - JustEnough complexity breakdown with evidence lists.
   - Learning Mode callouts providing educational background on architectural patterns (e.g. idempotency, backpressure, outbox patterns).

## Consequences

### Positive
- Zero compromise between automation integration and human communication.
- Markdown reports can be committed alongside ADRs or posted automatically as pull request comments.
- JSON reports can be validated against `schemas/report/v1.schema.json` via Ajv in test suites.

### Negative
- Requires maintaining two report rendering pipelines (`json.ts` and `markdown.ts`) when new finding attributes or metrics are added.

## Alternatives Considered
- **HTML Report Generation**: Rich styling, but cannot be rendered inline within GitHub Pull Request comments or raw terminal sessions.
- **SARIF Only (Static Analysis Results Interchange Format)**: Excellent for code vulnerability linters, but lacks domain-specific representations for architectural alternatives, complexity vectors, and scenario simulations.

