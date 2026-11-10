# Architecture Fitness Tests & Finding Contracts

Architecture fitness tests are executable, deterministic checks evaluating whether a proposed system satisfies quality attributes, structural invariants, and reliability standards.

---

## 1. Fitness Rules Inventory

| Rule ID | Category | Title | Severity | Invariant Enforced |
| :--- | :--- | :--- | :--- | :--- |
| `REQ-COV-001` | requirement_coverage | Unmapped Architecture Requirements | `error` (must) / `warning` (should) | Every requirement must be mapped to at least one component or ADR. |
| `REQ-COV-002` | requirement_coverage | Unmeasurable Non-Functional Requirements | `warning` | NFRs must define quantifiable numeric SLO targets. |
| `STRUC-001` | structure | Deep Synchronous Dependency Chain | `warning` | Synchronous request-reply chains must not exceed 3 hops. |
| `STRUC-002` | structure | Stateful Resource Ownership & Isolation | `error` (shared DB) / `warning` (missing owner) | Every datastore must declare single bounded domain ownership. |
| `SCAL-001` | scalability | Queue Overload & Capacity Balance | `error` (no consumers) / `warning` (no overload policy) | Message queues must specify an overload policy and downstream consumers. |
| `REL-001` | reliability | Bounded Retries & Retry Storm Prevention | `critical` (unbounded) / `warning` (high attempts) | Retries must specify bounded `max_attempts` ($\le 10$) and exponential backoff. |
| `REL-002` | reliability | At-Least-Once Consumer Idempotency | `critical` (missing) / `warning` (no key) | Consumers of at-least-once queues must declare idempotency keys. |
| `REL-003` | reliability | Dead-Letter Queue for Exhausted Failures | `warning` | Retrying background workers must define a `dead_letter_target`. |
| `REL-004` | reliability | Single Point of Failure (SPOF) on Critical Path | `warning` | Articulation points on the critical path must deploy $\ge 2$ replicas. |
| `DATA-001` | data_consistency | Dual-Write Distributed Inconsistency Hazard | `warning` | Dual writes to a DB and queue must document a Transactional Outbox pattern. |

---

## 2. Finding Severity Rubric

- **`critical`:** High-impact operational or data-loss hazard (e.g. unbounded retries causing retry storms, non-idempotent consumer double-charging under redelivery).
- **`error`:** Structural contract violation (e.g. unmapped `must` requirement, shared database anti-pattern, unconsumed queue).
- **`warning`:** Latency coupling, missing DLQ, articulation point with single replica, or speculative complexity.
- **`info`:** Informational observation or tuning opportunity.

---

## 3. Finding Evidence Structure

Every finding adheres to the following contract:

```typescript
export interface ArchitectureFinding {
  id: string;
  testId: string;
  status: "pass" | "fail" | "warning" | "unknown" | "error";
  severity: "critical" | "error" | "warning" | "info";
  title: string;
  summary: string;
  evidence: Array<{
    type: "component" | "connection" | "requirement" | "graph_path" | "calculation";
    id: string;
    details?: string;
  }>;
  affectedComponents?: string[];
  relatedRequirements?: string[];
  suggestedActions?: string[];
  learningConcept?: string;
}
```

