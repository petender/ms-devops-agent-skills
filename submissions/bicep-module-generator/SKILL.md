---
name: bicep-module-generator
description: "Use this skill whenever the user asks to author, review, or refactor a Bicep module or main.bicep composition."
---

# Bicep Module Generator

## When to invoke

- The user asks to create a Bicep module for a specific Azure resource (storage account, key vault, AKS cluster, etc.).
- The user has an inline resource in `main.bicep` and wants it extracted into a module.

## Guardrails

- One module = one logical resource + its tightly-coupled sub-resources.
- Every parameter gets a `@description('…')` decorator. Every output does too.
- Use `@allowed([...])`, `@minLength`, `@maxLength`, `@minValue`, `@maxValue` where sensible.
- Prefer `resource ... existing = { name: ... }` over passing IDs when composing.
- Emit an `output id string = res.id` for every top-level resource.
- Location parameter defaults to `resourceGroup().location`.
- **Never** hard-code SKUs, region, or names. Everything a caller might tune → parameter.

## Skeleton

```bicep
@description('Storage account name (globally unique, 3-24 lowercase alphanumeric).')
@minLength(3)
@maxLength(24)
param name string

@description('Azure region.')
param location string = resourceGroup().location

@description('SKU tier.')
@allowed(['Standard_LRS', 'Standard_GRS', 'Standard_ZRS'])
param sku string = 'Standard_LRS'

@description('Tags applied to every resource.')
param tags object = {}

resource sa 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: name
  location: location
  tags: tags
  sku: { name: sku }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

output id string = sa.id
output name string = sa.name
```

## Process

1. Confirm the resource type + API version (use latest stable, not preview).
2. Identify the minimum viable parameters (name, location, tags) + tunables (sku, redundancy, etc.).
3. Write the module. Add `@description` to every param & output.
4. Produce a `main.bicep` snippet showing how a caller consumes it.
5. Emit a `README.md` with a parameters table.

