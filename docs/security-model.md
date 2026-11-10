# ArchBench Security, Privacy, and Trust Model

ArchBench evaluates architectural blueprints, infrastructure topology, security boundaries, and enterprise decisions. Because architecture specifications frequently model sensitive internal boundaries and business logic, ArchBench is engineered under a zero-trust, local-first security architecture.

---

## 1. Core Principles

1. **Local-First by Default**: All core evaluation engines, graph traversals, fitness tests, and scenario simulations run strictly on the local machine within the Node.js/TypeScript runtime. Zero telemetry or architecture payloads are transmitted over the wire.
2. **Deterministic & AST-Safe**: No scenario pack or fitness test executes arbitrary host commands or arbitrary JavaScript code (`eval()` or `Function()` constructor). All calculations run through an AST-safe evaluator.
3. **Zero Secrets in Specifications**: System specifications (`archspec.yaml`) define logical architecture. Secrets, credentials, private keys, and environment tokens are strictly prohibited in the schema.
4. **AI-Assisted, Never AI-Governed**: External LLM adapters are strictly optional and opt-in. AI responses are treated as untrusted inputs and validated against strict JSON schemas before being incorporated into reports or proposals.

---

## 2. Threat Model & Safeguards

| Threat Vector | Attack Scenario | ArchBench Safeguard |
|---|---|---|
| **Arbitrary Code Execution via Packs** | Malicious scenario pack attempts shell escape or host system compromise | Declarative schema validation via Ajv 2020. AST-safe formula evaluator with zero dynamic code execution (`eval()` is banned). |
| **Data Exfiltration** | Core evaluation leaks architecture schemas or proprietary design tokens | Default offline runtime. All network calls are disabled unless an explicit provider adapter (e.g. Anthropic/OpenAI) is configured via environment variables. |
| **Credential Harvesting** | User embeds production tokens or database connection strings in YAML | Schema validation enforces logical resource identifiers. Documentation and linters flag sensitive keys (`password`, `secret`, `private_key`). |
| **Untrusted AI Hallucinations / Overrides** | AI provider invents invalid components or silently marks failing checks as passing | Strict separation between deterministic finding engines (`archeval`) and explanation layers. AI can propose modifications, but only deterministic tests determine pass/fail status. |
| **Directory Traversal** | Malicious pack imports or resolves files outside the workspace repository | Path normalization and sandboxed resolution relative to project root or validated scenario pack directories. |

---

## 3. Safe Scenario Execution

Scenario evaluations (`packs/scenarios/**/*.yaml`) test resilience against surges, network partitions, and data loss. 

- **Formula Safety**: Formulas such as `surged_rps = baseline_rps * 10` are parsed into abstract syntax trees (AST) and evaluated against a whitelist of arithmetic operators (`+`, `-`, `*`, `/`, `^`, `%`).
- **Resource Limits**: Scenario graph traversals enforce cycle detection and maximum recursion depth (default: 50 hops) to prevent denial-of-service via malformed circular topologies.
- **Opt-in Infrastructure Adapters**: Any future runtime verification adapters (e.g., Docker Compose, Testcontainers, or chaos engineering runners) require explicit command-line opt-in (`--allow-runtime-execution`) and are disabled by default.

---

## 4. Secret Handling & Data Minimization

- **Logical References**: Components reference secret boundaries via abstractions:
  ```yaml
  components:
    - id: payment-gateway-adapter
      name: Payment Gateway Adapter
      security:
        secret_references:
          - ref: VAULT_STRIPE_SECRET_KEY
            vault_provider: aws-secrets-manager
  ```
- **Report Redaction**: When outputting Markdown or JSON reports, any environment variables or metadata matching regexes for tokens, bearer headers, or AWS access keys are masked as `[REDACTED]`.

---

## 5. Model Context Protocol (MCP) Security

ArchBench's MCP Server (`@archbench/mcp-server`) connects AI coding assistants (such as Claude Desktop or Antigravity) to ArchBench:

- **Standard I/O Transport**: Operates over local `stdio`. No HTTP or remote listener port is opened by default.
- **Read-Only / Sandboxed Mutations**: MCP tools expose read methods (`archbench_validate`, `archbench_evaluate`, `archbench_get_spec`, `archbench_list_scenarios`, `archbench_list_tests`) and strictly structured mutations (`archbench_propose_diff`).
- **Human Approval Boundary**: Agent-proposed diffs require developer confirmation prior to git checkout or branch commit.

