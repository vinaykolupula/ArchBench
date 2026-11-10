import Ajv2020Pkg from "ajv/dist/2020.js";
import addFormatsPkg from "ajv-formats";
import { archSpecV01Schema } from "./schema.js";
import { ArchSpec, DiagnosticError, SourceLocation } from "../types/index.js";

const Ajv2020 = (Ajv2020Pkg as any).default ?? Ajv2020Pkg;
const addFormats = (addFormatsPkg as any).default ?? addFormatsPkg;

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  verbose: true,
});
addFormats(ajv);

const validateSchema = ajv.compile(archSpecV01Schema);

export interface ValidationOptions {
  getLocationForPath?: (path: string[] | string) => SourceLocation | undefined;
}

export interface ValidationResult {
  valid: boolean;
  errors: DiagnosticError[];
  warnings: DiagnosticError[];
}

export function validateArchSpec(
  data: unknown,
  options?: ValidationOptions
): ValidationResult {
  const errors: DiagnosticError[] = [];
  const warnings: DiagnosticError[] = [];

  const getLocation = (path: string): SourceLocation | undefined => {
    if (!options?.getLocationForPath) return undefined;
    const cleanPath = path.startsWith("/") ? path.slice(1).split("/") : path.split(".");
    return options.getLocationForPath(cleanPath);
  };

  // Step 1: JSON Schema structural validation
  const isSchemaValid = validateSchema(data);
  if (!isSchemaValid && validateSchema.errors) {
    for (const err of validateSchema.errors) {
      const instancePath = err.instancePath || "/";
      const message = `${instancePath} ${err.message ?? "is invalid"}`.trim();
      errors.push({
        path: instancePath,
        message,
        rule: `schema.${err.keyword}`,
        location: getLocation(instancePath),
      });
    }
  }

  // If base schema failed critically, return early
  if (errors.length > 0 || !data || typeof data !== "object") {
    return { valid: false, errors, warnings };
  }

  const spec = data as ArchSpec;

  // Step 2: Semantic cross-reference validation
  const declaredRequirementIds = new Set<string>();
  if (spec.system?.requirements) {
    for (let i = 0; i < spec.system.requirements.length; i++) {
      const req = spec.system.requirements[i];
      if (declaredRequirementIds.has(req.id)) {
        errors.push({
          path: `/system/requirements/${i}/id`,
          message: `Duplicate requirement ID declared: "${req.id}"`,
          rule: "semantic.unique_requirement_id",
          location: getLocation(`/system/requirements/${i}/id`),
        });
      }
      declaredRequirementIds.add(req.id);
    }
  }

  // Valid external endpoints
  const validContextEndpointIds = new Set<string>();
  if (spec.system?.context?.users) {
    for (const u of spec.system.context.users) {
      validContextEndpointIds.add(u.id);
    }
  }
  if (spec.system?.context?.external_systems) {
    for (const ext of spec.system.context.external_systems) {
      validContextEndpointIds.add(ext.id);
    }
  }

  // Validate alternatives
  if (spec.architecture?.alternatives) {
    for (let altIdx = 0; altIdx < spec.architecture.alternatives.length; altIdx++) {
      const alt = spec.architecture.alternatives[altIdx];
      const altPath = `/architecture/alternatives/${altIdx}`;

      const componentIds = new Set<string>();
      for (let compIdx = 0; compIdx < alt.components.length; compIdx++) {
        const comp = alt.components[compIdx];
        const compPath = `${altPath}/components/${compIdx}`;

        if (componentIds.has(comp.id)) {
          errors.push({
            path: `${compPath}/id`,
            message: `Duplicate component ID "${comp.id}" in alternative "${alt.id}"`,
            rule: "semantic.unique_component_id",
            location: getLocation(`${compPath}/id`),
          });
        }
        componentIds.add(comp.id);

        // Check component requirements references
        if (comp.requirements) {
          for (let rIdx = 0; rIdx < comp.requirements.length; rIdx++) {
            const reqId = comp.requirements[rIdx];
            if (!declaredRequirementIds.has(reqId)) {
              errors.push({
                path: `${compPath}/requirements/${rIdx}`,
                message: `Component "${comp.id}" references undeclared requirement "${reqId}"`,
                rule: "semantic.requirement_reference",
                location: getLocation(`${compPath}/requirements/${rIdx}`),
              });
            }
          }
        }

        // Check dead letter target if declared
        const dlqTarget = comp.behavior?.retry_policy?.dead_letter_target;
        if (dlqTarget) {
          // dlqTarget must match an existing component in this alternative
          const targetExists = alt.components.some((c) => c.id === dlqTarget);
          if (!targetExists) {
            warnings.push({
              path: `${compPath}/behavior/retry_policy/dead_letter_target`,
              message: `Component "${comp.id}" specifies dead letter target "${dlqTarget}" which is not defined in this alternative`,
              rule: "semantic.dead_letter_target_missing",
              location: getLocation(`${compPath}/behavior/retry_policy/dead_letter_target`),
            });
          }
        }
      }

      // Validate connections
      const connectionIds = new Set<string>();
      for (let connIdx = 0; connIdx < alt.connections.length; connIdx++) {
        const conn = alt.connections[connIdx];
        const connPath = `${altPath}/connections/${connIdx}`;

        if (connectionIds.has(conn.id)) {
          errors.push({
            path: `${connPath}/id`,
            message: `Duplicate connection ID "${conn.id}" in alternative "${alt.id}"`,
            rule: "semantic.unique_connection_id",
            location: getLocation(`${connPath}/id`),
          });
        }
        connectionIds.add(conn.id);

        const fromValid = componentIds.has(conn.from) || validContextEndpointIds.has(conn.from);
        if (!fromValid) {
          errors.push({
            path: `${connPath}/from`,
            message: `Connection "${conn.id}" specifies unknown source endpoint "${conn.from}"`,
            rule: "semantic.connection_endpoint",
            location: getLocation(`${connPath}/from`),
          });
        }

        const toValid = componentIds.has(conn.to) || validContextEndpointIds.has(conn.to);
        if (!toValid) {
          errors.push({
            path: `${connPath}/to`,
            message: `Connection "${conn.id}" specifies unknown destination endpoint "${conn.to}"`,
            rule: "semantic.connection_endpoint",
            location: getLocation(`${connPath}/to`),
          });
        }
      }

      // Validate decisions
      if (alt.decisions) {
        const decisionIds = new Set<string>();
        for (let decIdx = 0; decIdx < alt.decisions.length; decIdx++) {
          const dec = alt.decisions[decIdx];
          const decPath = `${altPath}/decisions/${decIdx}`;

          if (decisionIds.has(dec.id)) {
            errors.push({
              path: `${decPath}/id`,
              message: `Duplicate decision ID "${dec.id}" in alternative "${alt.id}"`,
              rule: "semantic.unique_decision_id",
              location: getLocation(`${decPath}/id`),
            });
          }
          decisionIds.add(dec.id);

          if (dec.requirements) {
            for (let rIdx = 0; rIdx < dec.requirements.length; rIdx++) {
              const reqId = dec.requirements[rIdx];
              if (!declaredRequirementIds.has(reqId)) {
                errors.push({
                  path: `${decPath}/requirements/${rIdx}`,
                  message: `Decision "${dec.id}" references undeclared requirement "${reqId}"`,
                  rule: "semantic.requirement_reference",
                  location: getLocation(`${decPath}/requirements/${rIdx}`),
                });
              }
            }
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
