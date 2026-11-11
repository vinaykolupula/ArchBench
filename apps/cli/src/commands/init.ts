import * as fs from "node:fs/promises";
import * as path from "node:path";
import pc from "picocolors";

export async function initCommand(projectName?: string, options: { output?: string } = {}) {
  const baseDir = process.env.INIT_CWD || process.cwd();
  const safeName = (projectName || "my-architecture-project")
    .replace(/["\\\r\n]/g, "")
    .trim() || "my-architecture-project";
  const targetPath = path.resolve(baseDir, options.output || "archspec.yaml");

  try {
    await fs.access(targetPath);
    console.error(pc.red(`Error: File already exists at ${targetPath}. Refusing to overwrite.`));
    process.exitCode = 1;
    return;
  } catch {
    // File doesn't exist, proceed
  }

  const template = `archbench:
  spec_version: "0.1"
  project: "${safeName}"
  description: "Starter architecture specification for ${safeName}"
  authors:
    - "Your Name <you@example.com>"

system:
  context:
    users:
      - id: client-user
        name: "Application Client"
        description: "Primary client consuming system services."
    external_systems:
      - id: external-auth-provider
        name: "Identity & Auth Provider"
        category: identity_provider

  requirements:
    - id: REQ-001
      category: functional
      priority: must
      statement: "Provide core business API functionality."
      verification: architecture_check

    - id: NFR-AVAIL-001
      category: availability
      priority: must
      statement: "Maintain 99.9% uptime over a 30-day window."
      target:
        availability_percent: 99.9
      measurement_window: 30d
      verification: scenario_and_slo_review

  constraints:
    - id: CON-001
      category: team
      statement: "Initial engineering team is small (2-4 developers)."

  assumptions:
    - id: ASM-001
      statement: "Initial traffic volume will not exceed 500 requests/sec peak."
      status: assumed
      confidence: high
      impact_if_false: medium

architecture:
  alternatives:
    - id: primary-design
      name: "Modular Service Architecture"
      description: "Baseline architecture satisfying current functional and availability goals."
      components:
        - id: api-service
          name: "Core API Service"
          type: application
          technology: "TypeScript / Node.js"
          responsibility: "Process client requests and enforce business validation."
          requirements:
            - REQ-001
          deployment:
            replicas: 2
            platform: "Container"

        - id: primary-database
          name: "Relational State Store"
          type: relational_database
          technology: "PostgreSQL"
          responsibility: "Durable state persistence."
          requirements:
            - REQ-001
          data:
            ownership: "core-domain"
            retention: "permanent"

      connections:
        - id: conn-client-to-api
          from: client-user
          to: api-service
          protocol: synchronous
          purpose: "Client HTTP API requests."
          timeout_ms: 3000

        - id: conn-api-to-db
          from: api-service
          to: primary-database
          protocol: synchronous
          purpose: "Read/write application entities."
          timeout_ms: 1000

      decisions:
        - id: ADR-001
          title: "Use Single Relational Store for Initial Release"
          status: accepted
          context: "Team constraint CON-001 favors operational simplicity over distributed data partitions."
          choice: "Deploy PostgreSQL as single authoritative store."
          alternatives:
            - "Microservice-per-domain distributed databases."
          consequences:
            - "Single operational data backup target and strong ACID guarantees."
          requirements:
            - REQ-001
            - NFR-AVAIL-001

      workload:
        peak_requests_per_second: 500
        average_payload_kb: 2

      objectives:
        availability_percent: 99.9
`;

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, template, "utf-8");
  console.log(pc.green(`✔ Created ArchSpec template at ${targetPath}`));
  console.log(pc.cyan(`Next steps:`));
  console.log(`  1. Edit ${path.basename(targetPath)} to model your requirements and components.`);
  console.log(`  2. Validate with: ${pc.bold(`archbench validate ${path.basename(targetPath)}`)}`);
  console.log(`  3. Generate diagram with: ${pc.bold(`archbench diagram ${path.basename(targetPath)}`)}`);
}
