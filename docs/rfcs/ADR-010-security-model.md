# ADR-010: Security Model - Sandboxed Local Execution and Explicit AI Opt-In

- **Status**: Accepted
- **Deciders**: ArchBench Core Architecture Team
- **Date**: 2026-11-10

---

## Context

Architecture evaluation platforms process sensitive artifacts detailing internal network topologies, data store configurations, auth boundaries, and proprietary business workflows. Furthermore, community-contributed scenario packs could potentially become vectors for supply-chain attacks if allowed to execute arbitrary scripts on developer machines or CI build agents.

ArchBench requires an uncompromising security baseline to guarantee data confidentiality and execution safety.

## Decision

We instituted a strict zero-trust, local-first security architecture:
1. **No Arbitrary Code Execution**:
   - Scenario packs (`packs/scenarios/**/*.yaml`) and fitness test rules are strictly declarative.
   - Dynamic simulation formulas are evaluated via an Abstract Syntax Tree (AST) parser with a whitelisted set of arithmetic operators (`+`, `-`, `*`, `/`, `^`, `%`).
   - The use of `eval()`, `new Function()`, child process execution, or arbitrary shell script invocation in scenario packs is strictly forbidden.
2. **Local-First, Offline by Default**:
   - The core engine, CLI, and MCP server make zero external network calls by default.
   - No telemetry, analytics, or phone-home requests are embedded in any package.
3. **Explicit Opt-In for AI Integrations**:
   - AI-assisted explanation features require explicit user configuration (environment variable `ARCHBENCH_AI_PROVIDER` and corresponding API keys).
   - Prompts sent to external AI providers are sanitized to exclude any local file system paths or secret identifiers.
4. **Prohibition of Secrets in Specifications**:
   - ArchSpec schemas strictly disallow embedded credentials, private keys, or connection secrets, requiring logical identifiers instead.

## Consequences

### Positive
- ArchBench can be safely deployed in high-security, air-gapped enterprise environments and financial institutions.
- Scenario packs from third-party open-source contributors can be run safely without sandboxing overhead or risk of system compromise.
- Zero risk of accidental proprietary architecture leaks to third-party AI APIs.

### Negative
- Users desiring physical runtime chaos experiments must install optional runtime adapters with explicit command-line flags (`--allow-runtime-execution`).

## Alternatives Considered
- **WebAssembly / Docker Container Sandboxing for Scenarios**: Robust isolation, but introduces substantial operational friction, high latency, and platform-specific dependencies for a simple CLI run.
- **Always-On Cloud AI Verification**: Convenient, but introduces recurring API costs, external network dependencies, and unacceptable data exfiltration risks for proprietary enterprise architectures.

