# ArchBench Benchmark Methodology & Whitepaper

**Version:** 1.0  
**Date:** November 2026  
**Authors:** ArchBench Team

---

## Abstract

ArchBench is an open-source framework for evaluating software architecture quality through deterministic, evidence-based structural analysis. This document describes the **ArchBench Benchmark Suite**: a curated dataset of 50 architecture specification test cases spanning 10 architectural archetypes, designed to measure the precision and recall of architecture evaluation engines — whether human, deterministic rule-based, or AI-augmented.

The benchmark enables reproducible measurement of:
- **Architectural reasoning correctness** across structural, reliability, scalability, and data consistency categories.
- **Hallucination detection** in AI coding agent architectural recommendations.
- **False positive and false negative rates** of automated evaluation tools.

---

## 1. Benchmark Design Principles

### 1.1 Evidence-Based, Not Opinion-Based

Every finding in ArchBench must cite specific structural evidence: a component ID, a connection path, a missing requirement mapping, or a measurable configuration value. The benchmark ground truth follows this same principle — each expected finding is traceable to a concrete schema element.

### 1.2 Deterministic and Reproducible

All 10 fitness rules operate on the ArchSpec YAML AST and property graph without probabilistic inference, LLM calls, or network dependencies. A given input specification always produces the same findings, making benchmark results perfectly reproducible across environments.

### 1.3 Occam's Razor Baseline

The benchmark establishes that the **simplest architecture satisfying stated requirements is correct**. Optimal cases (zero findings) intentionally use minimal component topologies. Flawed cases introduce precisely one anti-pattern per case (except Case 03, which is a deliberately overengineered "speculative" design with multiple compounding issues).

---

## 2. Dataset Composition

### 2.1 Archetypes

The 50 benchmark cases span 10 representative system design archetypes:

| # | Archetype | Cases | Description |
|:--|:----------|:-----:|:------------|
| 01 | URL Shortener | 5 | Stateless redirection with cache, database, and analytics |
| 02 | Notification Platform | 5 | Async multi-channel dispatch with queues, DLQ, and providers |
| 03 | E-Commerce Checkout | 5 | Transactional order processing with payment and inventory |
| 04 | Real-time Chat | 5 | WebSocket messaging with presence and persistence |
| 05 | RAG Document Pipeline | 5 | Retrieval-augmented generation with embedding and vector search |
| 06 | Video Transcoding | 5 | Media processing pipeline with fan-out workers |
| 07 | Payment Ledger | 5 | Double-entry accounting with audit trail and reconciliation |
| 08 | IoT Telemetry | 5 | High-throughput sensor data ingestion and time-series storage |
| 09 | Multi-Tenant SaaS | 5 | Tenant-isolated workspace management with shared infra |
| 10 | Feature Flagging | 5 | Real-time feature evaluation with rules engine and cache |

### 2.2 Case Categories

Each archetype contains 5 cases across 3 categories:

| Category | Count | Purpose |
|:---------|:-----:|:--------|
| **Optimal** | 10 | Zero-finding architectures that satisfy all requirements with minimal complexity |
| **Flawed** | 38 | Architectures with exactly one targeted anti-pattern triggering a specific fitness rule |
| **Speculative** | 2 | Overengineered architectures with multiple compounding issues |

### 2.3 Targeted Anti-Patterns

Each flawed case targets exactly one of the following deterministic fitness rules:

| Rule ID | Category | Anti-Pattern | Cases |
|:--------|:---------|:-------------|:-----:|
| REQ-COV-001 | Requirement Coverage | `must` requirement not mapped to any component | 8 |
| STRUC-001 | Structure | Synchronous call chain exceeding 3 hops | 2 |
| STRUC-002 | Structure | Shared database accessed by multiple services | 8 |
| SCAL-001 | Scalability | Unconsumed queue or missing overload policy | 1 |
| REL-001 | Reliability | Excessive retry attempts (> 10) without circuit breaker | 1 |
| REL-002 | Reliability | At-least-once consumer without idempotency | 9 |
| REL-003 | Reliability | Worker retry policy without dead-letter target | 2 |
| REL-004 | Reliability | Articulation point (SPOF) with single replica | 8 |
| DATA-001 | Data Consistency | Dual write to DB and queue without Outbox pattern | 2 |

---

## 3. Scoring Methodology

### 3.1 Ground Truth Structure

Each benchmark case is paired with a ground truth record in `benchmarks/expected-findings/ground-truth.json`:

```json
{
  "case-14-shared-database-coupling": {
    "id": "case-14-shared-database-coupling",
    "archetype": "03-ecommerce-checkout",
    "category": "flawed",
    "expectedFindingRuleIds": ["STRUC-002"],
    "expectedFindingSeverities": { "error": 1 }
  }
}
```

### 3.2 Metrics

Given a set of evaluated cases E and ground truth G:

- **True Positive (TP):** A rule ID that appears in both `expectedFindingRuleIds` and actual findings.
- **False Positive (FP):** A rule ID in actual findings but NOT in `expectedFindingRuleIds`.
- **False Negative (FN):** A rule ID in `expectedFindingRuleIds` but NOT in actual findings.

$$\text{Precision} = \frac{TP}{TP + FP}$$

$$\text{Recall} = \frac{TP}{TP + FN}$$

$$F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

### 3.3 Baseline Results (ArchBench v0.1 Engine)

| Metric | Value |
|:-------|:-----:|
| Total Cases | 50 |
| Schema Validation Rate | 100.0% (50/50) |
| True Positives | 43 |
| False Positives | 0 |
| False Negatives | 0 |
| **Precision** | **100.00%** |
| **Recall** | **100.00%** |
| **F1 Score** | **100.00%** |
| Avg. Evaluation Time | 1.2ms per case |

---

## 4. Using the Benchmark for AI Agent Evaluation

### 4.1 Measuring AI Architectural Reasoning

To benchmark an AI coding agent's architecture quality:

1. Provide the agent with system requirements (from the `system.requirements` section of each benchmark case).
2. Ask the agent to produce an `archspec.yaml` architecture specification.
3. Run `archbench evaluate` on the agent's output.
4. Compare the agent's findings against the ground truth.

### 4.2 Detecting AI Hallucinations

Common AI hallucination patterns in system design:

| Hallucination Type | ArchBench Detection Rule |
|:-------------------|:------------------------|
| Recommending Kafka for 2 req/min traffic | JustEnough complexity analysis (speculative infra) |
| Claiming "exactly-once" without 2PC | REL-002 idempotency check |
| Omitting database ownership in microservices | STRUC-002 shared database check |
| Suggesting infinite retries for "resilience" | REL-001 bounded retries check |
| Missing audit trail for compliance requirements | REQ-COV-001 unmapped requirement |
| Synchronous chains across 5 microservices | STRUC-001 sync depth analysis |

### 4.3 Leaderboard Scoring

Agents are ranked by:
1. **F1 Score** on the 50-case benchmark (primary metric).
2. **False positive rate** (lower is better — penalizes hallucinated findings).
3. **Evaluation latency** (tiebreaker).

---

## 5. Reproducing Results

```bash
# 1. Clone and install
git clone https://github.com/archbench/archbench.git
cd archbench && pnpm install

# 2. Generate benchmark cases
pnpm tsx scripts/generate-benchmarks.ts

# 3. Run benchmark harness
pnpm tsx scripts/run-benchmarks.ts

# 4. View results
cat benchmarks/benchmark-run-results.json
```

---

## 6. Extending the Benchmark

### Adding New Cases

1. Add a new entry to `scripts/generate-benchmarks.ts` with the ArchSpec YAML structure and ground truth.
2. Regenerate: `pnpm tsx scripts/generate-benchmarks.ts`
3. Verify: `pnpm tsx scripts/run-benchmarks.ts`

### Adding New Fitness Rules

1. Implement the rule in `packages/fitness-tests/src/rules/`.
2. Register it in `packages/fitness-tests/src/index.ts`.
3. Create benchmark cases that specifically trigger (and do not trigger) the new rule.
4. Update ground truth accordingly.

---

## 7. Limitations and Future Work

1. **Current scope:** The benchmark tests deterministic structural analysis only. Capacity modeling, cost estimation, and probabilistic reliability analysis are not yet covered.
2. **Case diversity:** While 50 cases across 10 archetypes provide broad coverage, edge cases in event sourcing, CQRS, and saga patterns warrant additional benchmark entries.
3. **Multi-alternative comparison:** The benchmark currently evaluates single alternatives per case. Future versions will include cases requiring cross-alternative trade-off analysis.
4. **Human baseline:** Establishing a human expert baseline score against the same 50 cases would calibrate the benchmark's difficulty.

---

## References

1. Martin Fowler, "MonolithFirst" (2015)
2. Martin Kleppmann, *Designing Data-Intensive Applications* (O'Reilly, 2017)
3. Chris Richardson, *Microservices Patterns* (Manning, 2018)
4. Google SRE Book, "Addressing Cascading Failures"
5. Dan McKinley, "Choose Boring Technology" (2015)
6. AWS Well-Architected Framework, Reliability Pillar

