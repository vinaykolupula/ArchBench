# ArchSpec Schema v0.1

This directory hosts the authoritative JSON Schema definitions for the ArchBench Architecture Specification format (`ArchSpec`).

## Specification Files

- `v0.1.schema.json`: Formal JSON Schema Draft 2020-12 defining the ArchSpec v0.1 specification format.

## Validating an ArchSpec file

```bash
archbench validate archspec.yaml
```

Or using standard JSON Schema tooling:
```bash
ajv validate -s schemas/archspec/v0.1.schema.json -d examples/notification-platform/archspec.yaml
```

