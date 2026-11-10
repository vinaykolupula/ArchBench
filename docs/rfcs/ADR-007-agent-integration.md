# ADR-007: AI Agent Integration via Model Context Protocol (MCP)

- **Status**: Accepted
- **Deciders**: ArchBench Core Architecture Team
- **Date**: 2026-11-10

---

## Context

AI coding assistants (such as Claude Code, Cursor, Antigravity, and Copilot Workspace) are increasingly entrusted with proposing system changes, decomposing requirements, and implementing features. However, agents often lack architectural awareness, inadvertently adding unneeded microservices, violating consistency models, or introducing single points of failure.

To make ArchBench accessible to AI agents without creating divergent execution paths or duplicating business logic, we need a standard protocol for agentic tool use.

## Decision

We chose to implement the **Model Context Protocol (MCP)** via `@archbench/mcp-server` as a thin adapter layer over the exact same core application services used by the CLI:
1. **Shared Service Layer**:
   - Both `apps/cli` and `apps/mcp-server` invoke identical core packages (`@archbench/core`, `@archbench/archeval`, `@archbench/scenarios`).
   - Rule evaluation, scoring formulas, and validation logic remain 100% consistent regardless of whether invoked by human CLI or AI agent.
2. **Exposed MCP Tools**:
   - `archbench_validate`: Validate syntax and schema of an ArchSpec file.
   - `archbench_evaluate`: Execute full fitness evaluation and scenario suite.
   - `archbench_get_spec`: Inspect parsed components, connections, and requirements.
   - `archbench_list_scenarios`: Discover available stress scenarios.
   - `archbench_list_tests`: Inspect registered fitness test rules.
   - `archbench_propose_diff`: Generate structured architectural diffs between candidate alternatives.
3. **Transport**:
   - Standard I/O (`stdio`) transport for local execution with zero network exposure.

## Consequences

### Positive
- Any MCP-compliant client can natively inspect, evaluate, and iteratively refactor architecture specifications.
- Eliminates logic duplication: bug fixes in `@archbench/archeval` immediately benefit both CLI and MCP consumers.
- Prevents agents from silently rewriting architecture without feedback; fitness test failures are returned directly into the agent's tool-response loop.

### Negative
- Requires maintaining MCP tool schemas in sync with core API updates.
- MCP is an evolving protocol, requiring tracking specification updates from Anthropic/Model Context Protocol working group.

## Alternatives Considered
- **Direct Custom Prompt Engineering / Context Injection**: Brittle, context-window heavy, and lacks structured tool-calling validation.
- **REST / GraphQL Microservice for Agents**: Unnecessary operational overhead, exposes a local network port, and conflicts with local-first, zero-network security constraints.

