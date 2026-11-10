# Declarative Failure Scenarios & Safe Simulation Engine

ArchBench treats failure as a first-class design input. Before writing code or deploying infrastructure, candidate architectures are challenged with declarative failure scenarios.

---

## 1. Simulation Evaluation Levels

- **`static`:** Inspects model fields and structural relationships (e.g. verifying DLQ configuration).
- **`analytical`:** Evaluates mathematical expressions modeling arrival rates, consumer lag, and recovery times.
- **`simulation`:** Simulates multi-step queue drain or provider backpressure over discrete time windows.

---

## 2. Zero-`eval()` Safe Math Expression Grammar

To prevent arbitrary code execution vulnerabilities, the scenario engine executes a pure recursive-descent AST parser with zero use of `eval()` or `Function()`.

### Supported Operators:
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparisons: `>`, `<`, `>=`, `<=`, `==`, `!=`
- Logical: `&&`, `||`, `!`
- Parentheses: `(...)`
- Identifiers: `inputs.<field>`, `simulation.<field>`, `workload.<field>`

---

## 3. Built-In Scenario Packs

### Pack: `core-failures`
- `core.dependency.timeout_outage`: 15-minute downstream provider outage; checks circuit breakers.
- `core.queue.consumer_lag`: Worker slowdown under peak ingress; calculates lag accumulation and recovery duration.
- `core.traffic.spike_surge`: 5x peak arrival rate spike; calculates buffer saturation.

### Pack: `scalability`
- `scalability.traffic.burst`: 10x traffic surge over 5 minutes; verifies broker capacity headroom.
- `scalability.queue.consumer_lag_scaleout`: Worker autoscaling scale-out factor and backlog drain rate.

### Pack: `data-consistency`
- `data_consistency.dual_write.failure`: Quantifies potential desync records without Transactional Outbox.
- `data_consistency.message.duplicate_replay`: Models duplicate delivery volume during consumer rebalances.

---

## 4. Running Scenarios via CLI

```bash
# Run core failure scenarios against an architecture
archbench scenario run examples/notification-platform/archspec.yaml --pack core-failures

# Run scalability scenarios
archbench scenario run examples/notification-platform/archspec.yaml --pack scalability

# Run data consistency scenarios
archbench scenario run examples/notification-platform/archspec.yaml --pack data-consistency
```

