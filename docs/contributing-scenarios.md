# Community Guide: Authoring Failure & Workload Scenarios

ArchBench scenarios are declarative YAML documents placed in `packs/scenarios/<pack-name>/`. You can author and contribute new scenarios without writing TypeScript code.

---

## 1. Scenario Schema Reference

Every scenario must comply with `schemas/scenario/v1.schema.json`:

```yaml
id: <pack>.<category>.<scenario_id>
version: 1
name: "Human Readable Scenario Name"
category: queue | dependency | traffic | database | network | security
level: analytical | static | simulation

preconditions:
  required_components:
    - message_queue
    - background_worker

inputs:
  arrival_rate:
    type: number
    default: 5000
  worker_throughput:
    type: number
    default: 4000
  duration_seconds:
    type: integer
    default: 300

simulation:
  lag_growth: "(inputs.arrival_rate - inputs.worker_throughput) * inputs.duration_seconds"

assertions:
  - id: check-lag-bound
    description: "Backlog must not exceed 500,000 messages during surge"
    condition: "simulation.lag_growth <= 500000"
    severity: warning

learning:
  concept: "Backpressure & Queue Sizing"
  explanation: >
    Explain why this scenario matters, how it causes production outages,
    and what remediation strategies apply.
```

---

## 2. Validation & Testing

Run your newly authored scenario with the CLI:

```bash
pnpm cli scenario run examples/notification-platform/archspec.yaml --pack <your-pack-name>
```

