# ADR-002: Architecture Representation via Versioned YAML/JSON ArchSpec

- **Status**: Accepted
- **Deciders**: ArchBench Core Architecture Team
- **Date**: 2026-11-10

---

## Context

To automate architectural evaluation, fitness testing, and complexity scoring, systems must be described in a format that is:
1. Human-readable and editable in standard text editors and pull requests.
2. Machine-parseable with deterministic schema validation.
3. Expressive enough to capture functional requirements, non-functional constraints, components, topologies, decisions (ADRs), and assumptions.
4. Diff-friendly in Git version control.

Existing formats (such as raw diagrams, informal Markdown documents, or proprietary modeling tools) fail to provide formal, machine-actionable boundaries suitable for automated fitness tests and AI agents.

## Decision

We designed and adopted **ArchSpec**: a declarative, versioned specification format encoded in **YAML or JSON**, governed by JSON Schema Draft 2020-12:
1. **Top-Level Sections**:
   - `version`: Explicit schema version identifier (e.g. `"0.1.0"`).
   - `metadata`: System name, description, domain, and author attribution.
   - `requirements`: Functional and non-functional requirements with criticality and quantitative targets.
   - `assumptions`: Explicit engineering assumptions with confidence levels and validation owners.
   - `constraints`: Inviolable boundaries (budget, SLA, team, compliance, technology policy).
   - `components`: Logical tiers, services, databases, queues, and gateways.
   - `connections`: Directed edges with protocols (synchronous vs. asynchronous), transports, timeouts, and retry policies.
   - `decisions`: Architecture Decision Records (ADRs) recorded inline or referenced.
   - `evolution`: Planned roadmap transitions and decommissioning targets.
2. **Multi-Alternative Support**: Specifications can define candidate alternatives (`alternatives: [...]`) within the same file for comparative trade-off analysis.

## Consequences

### Positive
- Declarative specifications live directly in the code repository (`archspec.yaml`).
- Strict schema validation using Ajv 2020 catches typos, missing required fields, and semantic errors before evaluation begins.
- Enables rich automated graph construction (directed multigraph of components and connections).
- Git diffs clearly highlight architectural evolution during pull request reviews.

### Negative
- Requires teams to learn the ArchSpec schema structure.
- Specifications can become verbose for very large enterprise systems, necessitating modular split-file support or directory composition in future iterations.

## Alternatives Considered
- **C4-PlantUML / Structurizr DSL**: Powerful for diagramming, but lacks native modeling of quantitative NFR targets, explicit risk-weighted assumptions, and structured evaluation assertions.
- **Pure Markdown Documents**: Highly accessible to humans, but brittle and non-deterministic for automated rule evaluation.
- **Protocol Buffers / Binary Schemas**: Superior wire efficiency, but poor human developer experience for authoring and Git code reviews.

