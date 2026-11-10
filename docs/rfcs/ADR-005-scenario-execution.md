# ADR-005: Declarative Scenario Simulation with Pluggable Runtime Adapters

- **Status**: Accepted
- **Deciders**: ArchBench Core Architecture Team
- **Date**: 2026-11-10

---

## Context

Architectural validation requires testing how a design behaves under dynamic stress, including:
- Sudden 10x traffic surges and queue worker lag.
- Downstream database outages, network partitions, and cascading timeouts.
- Inconsistent dual-writes and split-brain scenarios.

Executing full physical chaos experiments (e.g. spinning up Kubernetes clusters, tearing down Kafka brokers) during initial system design is slow, costly, and impossible prior to implementation. Conversely, purely static architecture models cannot quantify whether retry policies amplify traffic surges or if worker pools can drain queues within acceptable SLAs.

## Decision

We adopted a **declarative scenario model** for the core engine, coupled with an extensible adapter interface for future physical runtime runners:
1. **Declarative Scenario Packs**:
   - Workload and failure scenarios are written in structured YAML (`packs/scenarios/**/*.yaml`).
   - Scenarios declare input stress conditions (e.g. `baseline_rps: 500`, `surge_multiplier: 10`, `failure_target: redis-cache`).
   - The scenario engine simulates cascading effects mathematically across the component graph.
   - Assertions define quantitative expectations (e.g. `latency_p99_ms <= 150`, `loss_rate_percent == 0`, `queue_drain_time_s <= 300`).
2. **Deterministic Mathematical Formulas**:
   - Expression evaluation uses a secure, AST-safe formula evaluator with whitelisted math operations.
   - No arbitrary shell scripts or code execution is permitted within scenario definitions.
3. **Pluggable Architecture for Future Runtime Adapters**:
   - The engine defines clean evaluation interfaces (`ScenarioRunner`, `ScenarioResult`).
   - Future physical runtime adapters (Docker Compose, Testcontainers, Chaos Mesh) can implement these interfaces without changing scenario declarations.

## Consequences

### Positive
- Instant feedback in local development and CI pipelines (< 10ms execution time).
- Can evaluate architectures *before* writing a single line of backend application code.
- Fully sandboxed and secure: scenario packs downloaded from community repositories cannot execute malicious host code.

### Negative
- Declarative mathematical models approximate real-world physics; they may not capture nuanced operating system or networking edge cases (e.g. TCP SYN floods, garbage collection pauses).

## Alternatives Considered
- **Runtime-Only Chaos Testing (Chaos Monkey / Chaos Mesh)**: Powerful, but requires a live, fully deployed system; useless during the initial design and proposal phase.
- **Embedded Python/JavaScript Scripts in Scenarios**: Allows complex custom simulation logic, but introduces critical security risks (remote code execution) and violates the local-first trust model.

