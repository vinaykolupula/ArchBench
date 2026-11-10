# ArchBench Core Concepts & Terminology Reference

The following vocabulary is used consistently across ArchBench source code, schemas, CLI commands, reports, and MCP tools.

| Concept | Formal Definition in ArchBench |
| :--- | :--- |
| **ArchSpec** | The technology-neutral, machine-readable architecture specification format and schema (Draft 2020-12). |
| **ArchEval** | The evaluation workflow and engine that checks proposed designs against requirements, invariants, and failure scenarios. |
| **JustEnough Architecture** | The decision discipline that selects the least complex architecture satisfying stated requirements and operating constraints. |
| **High-Level Design (HLD)** | System-level topology modeling components, connections, deployment boundaries, data ownership, and quality attributes. |
| **Architecture Fitness Test** | An executable, deterministic rule evaluating an invariant across requirements, structure, scalability, reliability, or consistency. |
| **Finding** | A structured evaluation result linking an outcome (`pass`, `fail`, `warning`, `unknown`), severity (`critical`, `error`, `warning`, `info`), and evidence. |
| **Evidence** | A traceable reference to a component ID, graph path, requirement ID, formula calculation, or scenario output. |
| **Failure Domain** | The structural blast radius within which an unhandled failure affects adjacent components. |
| **Articulation Point / SPOF** | A topological vertex whose removal partitions the system communication graph, creating a single point of failure if replicas $\le 1$. |
| **Synchronous Call Depth** | The length of blocking request-reply network hops on a critical path from an external entry point to a terminal datastore. |
| **Dual Write** | Mutating a local database and publishing to an asynchronous message broker without atomic coordination (Transactional Outbox). |
| **Backpressure** | Flow-control mechanisms bounding buffer accumulation when producer throughput outpaces consumer capacity. |
| **At-Least-Once Delivery** | Distributed message delivery guarantee where messages are never lost, but duplicate redeliveries may occur. |
| **Idempotency** | The property that executing an operation multiple times yields identical side effects as executing it once. |
| **Evolution Trigger** | An explicit, monitored metric threshold recorded in an ADR that justifies transitioning to a more complex architecture. |
| **Complexity Vector** | A 5-tuple measuring discrete components, independently deployed units, network boundaries, stateful stores, and external dependencies. |
| **Scenario Pack** | A versioned collection of declarative failure simulations executed without running production code. |

