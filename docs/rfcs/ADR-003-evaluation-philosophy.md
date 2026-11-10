# ADR-003: Evaluation Philosophy - Deterministic Checks First, AI-Assisted Second

- **Status**: Accepted
- **Deciders**: ArchBench Core Architecture Team
- **Date**: 2026-11-10

---

## Context

Many AI-powered software engineering tools rely completely on large language models (LLMs) to perform architectural critique and code generation. However, LLMs suffer from non-determinism, stochastic variation across runs, hallucinated technical requirements, and inability to provide mathematical guarantees on topology or graph cycles. 

Conversely, purely static analysis tools cannot provide pedagogical advice, contextual nuance, or natural language explanations tailored to specific engineering teams.

## Decision

We adopted an architectural evaluation philosophy based on a strict two-stage hierarchy:
1. **Deterministic Verification First (ArchEval)**:
   - All architecture fitness tests (unmapped requirements, cyclic dependencies, single points of failure, missing retries/timeouts, unbounded queues, lack of circuit breakers) are implemented as deterministic, algebraic algorithms and graph traversals.
   - All scenario simulations (burst traffic, network partition, dual-write consistency failure) use deterministic quantitative mathematical models.
   - Every finding must be reproducible across repeated runs and provide traceable evidence (source lines, component IDs, requirement IDs).
2. **AI-Assisted Interpretation Second (Learning Mode & Adapters)**:
   - AI models are used strictly as an explanation, contextualization, and recommendation layer.
   - An LLM may explain *why* a detected circular dependency causes distributed deadlocks in payment microservices, or draft an ADR proposing an alternative.
   - AI outputs are never permitted to mark a failing deterministic check as passing or suppress an architectural finding without human intervention.

## Consequences

### Positive
- Predictable and auditable results in CI/CD pipelines (deterministic exit codes `0` or `1`).
- Eliminates flakiness and hallucinated errors.
- Low compute footprint and high speed: evaluations complete in milliseconds without requiring API keys or network calls.
- High trust among senior architects and safety-critical engineering organizations.

### Negative
- New failure modes or architectural patterns must be encoded into deterministic TypeScript rules rather than relying on an LLM to "notice" them automatically.

## Alternatives Considered
- **Pure LLM Architectural Review (Prompt-Driven)**: Fast to build, but non-reproducible, prone to false positives/negatives, expensive in CI pipelines, and risks leaking proprietary architecture.
- **Pure Rules Engine Without AI**: Reliable and fast, but lacks educational feedback, remediation drafting, and intuitive narrative explanations for junior engineers.

