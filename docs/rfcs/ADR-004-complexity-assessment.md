# ADR-004: Explainable Multi-Dimensional Complexity Assessment (JustEnough)

- **Status**: Accepted
- **Deciders**: ArchBench Core Architecture Team
- **Date**: 2026-11-10

---

## Context

Software architectures often suffer from either under-engineering (brittle single-node systems unable to meet reliability goals) or premature over-engineering (microservices, distributed event buses, and multi-region clusters introduced before traffic or team size warrants them).

Traditional software complexity metrics (e.g. cyclomatic complexity, Halstead metrics) operate on source code ASTs rather than high-level architecture designs. Existing high-level metrics often compress evaluation into an arbitrary, opaque numerical score (e.g. "Complexity: 78/100") without explaining *why* the design is complex or what trade-offs justify that complexity.

## Decision

We designed and implemented **JustEnough**: an explainable, multi-dimensional architectural complexity evaluation framework:
1. **Six Explicit Dimensions**:
   - `component_count`: Discrete service and infrastructure nodes.
   - `connection_density`: Edge-to-node ratio and coupling intensity.
   - `data_store_count`: Polyglot persistence burden and operational overhead.
   - `state_distribution`: Stateful vs. stateless nodes and coordination requirements.
   - `operational_overhead`: Deployment, monitoring, orchestration, and disaster recovery footprint.
   - `cognitive_load`: Conceptual surface area required for a single engineer to safely reason about the system.
2. **Requirement Justification Matching**:
   - Complexity is evaluated against stated non-functional requirements (throughput, availability, team topology).
   - A complex pattern (e.g. distributed event-driven saga) is classified as **Justified** if explicit requirements demand asynchronous decoupling and high-throughput durability.
   - A complex pattern is flagged as **Premature / Over-Engineered** if requirements are modest (e.g. low-throughput internal dashboard with a 4-tier microservice architecture).
3. **Traceable Evidence**: Every complexity rating provides itemized evidence (e.g., listing all data stores, pointing out unneeded asynchronous queues, or identifying uncoordinated distributed transactions).

## Consequences

### Positive
- Transparent, educational feedback for engineering teams.
- Prevents both premature microservice decomposition and fragile monoliths.
- Clear audit trail linking architectural decisions directly to business requirements.

### Negative
- Requires maintaining heuristic thresholds and weights for different architecture domains (e.g. real-time IoT vs. internal CRUD).

## Alternatives Considered
- **Single Opaque Complexity Index**: Compressing metrics into a single arbitrary number; rejected because it fails to guide refactoring and creates mistrust among engineers.
- **Lines of Code (LOC) Heuristics**: Irrelevant for High-Level Architecture (HLD) design before code is written.

