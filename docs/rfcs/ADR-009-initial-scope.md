# ADR-009: Initial Scope - High-Level Design (HLD) and System-Level Quality Attributes

- **Status**: Accepted
- **Deciders**: ArchBench Core Architecture Team
- **Date**: 2026-11-10

---

## Context

Software architecture encompasses a vast spectrum ranging from low-level code structure (class design, package dependencies, method-level cyclomatic complexity) to enterprise portfolio management and cloud infrastructure provisioning.

Attempting to evaluate all levels simultaneously in the initial releases risks building a redundant duplicate of existing code-level linters (such as ArchUnit, ESLint, or SonarQube) while failing to solve the core missing problem: evaluating whether a proposed system topology satisfies non-functional requirements and business constraints *before* code is implemented.

## Decision

We deliberately constrained the initial scope of ArchBench to **High-Level Design (HLD)** and **system-level quality attributes**:
1. **In-Scope**:
   - **System Topology**: Logical services, worker tiers, data stores, message buses, API gateways, and external integrations.
   - **System-Level Quality Attributes**: Scalability, availability, fault tolerance, data consistency, latency, and operational complexity.
   - **Architecture-Level Decisions**: Synchronous vs. asynchronous communication, polyglot persistence, caching strategies, distributed saga patterns, and failover topologies.
   - **Cross-Cutting Constraints**: SLA compliance, regulatory data isolation, and evolutionary triggers.
2. **Explicitly Out-of-Scope (Deferred to Future Integrations)**:
   - Method-level code linting, variable naming, and class-level inheritance hierarchies.
   - Infrastructure-as-Code (IaC) syntax linting (e.g. Terraform HCL or Kubernetes YAML formatting).
   - Real-time network packet sniffing or production APM monitoring.

## Consequences

### Positive
- Laser focus on high-impact architectural flaws that are expensive to fix once code is built (e.g. distributed dual-writes, missing message brokers under burst traffic).
- Complements rather than competes with code-level tools like ArchUnit or ESLint.
- Fast evaluation speed without needing access to complete application source trees.

### Negative
- Code-level drift (where code diverges from the declared ArchSpec) must be validated via separate CI integration tests or future code-scanning adapters.

## Alternatives Considered
- **Full-Stack Static Analyzer**: Analyzing TypeScript/Java ASTs alongside architecture YAML; rejected for initial release due to massive complexity, language-lock-in, and duplication of existing language tooling.
- **Purely Infrastructure/IaC Linter**: Analyzing Terraform/CloudFormation graphs; rejected because IaC models low-level cloud resources (subnets, IAM roles) rather than functional requirements, business trade-offs, and failure scenarios.

