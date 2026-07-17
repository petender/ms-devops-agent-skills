---
name: ado-pipeline-author
description: "Use this skill whenever the user asks to create, refactor, or review an Azure DevOps pipeline (azure-pipelines.yml) or a pipeline template."
---

# Azure DevOps Pipeline Author

## When to invoke

The user wants to (a) create a new azure-pipelines.yml, (b) refactor an existing one into stages/jobs/templates, (c) migrate a Classic UI pipeline to YAML, or (d) add a gated deployment.

## Guardrails

- Prefer **stages → jobs → steps** hierarchy over flat pipelines.
- Extract reusable logic into **templates** under `templates/` (build.yml, test.yml, deploy.yml). Never inline the same 20 lines twice.
- Pin **task versions** (`AzureCLI@2`, not `@2.198.0`, not `@`).
- Use **environments** for deploys — they enable approvals and traceability.
- Never hard-code service connection names; put them in a variable group.

## Standard template

```yaml
trigger:
  branches: { include: [main] }
  paths: { exclude: [docs/*, README.md] }

pool: { vmImage: ubuntu-latest }

variables:
  - group: shared-secrets

stages:
- stage: Build
  jobs:
  - template: templates/build.yml

- stage: Deploy_Dev
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: dev
    environment: dev
    strategy:
      runOnce:
        deploy:
          steps:
          - template: templates/deploy.yml
            parameters: { env: dev }
```

## Process

1. Ask what the pipeline builds (language/runtime), what environments deploy targets it has, and whether approvals are needed.
2. Sketch the stage graph before writing YAML.
3. Extract build + deploy into templates from the start — even for a single environment.
4. Output the YAML plus a `README.md` snippet describing required variable groups and service connections.

## Anti-patterns

- One giant `steps:` list at the root of the file.
- `condition: always()` used to hide flaky steps.
- Uploading logs as artifacts instead of using `PublishTestResults@2`.

