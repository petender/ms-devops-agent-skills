---
name: pipeline-to-actions-migrator
description: "Use this skill when the user asks to migrate, port, or convert an Azure DevOps pipeline to GitHub Actions."
---

# Azure Pipelines → GitHub Actions Migrator

## When to invoke

The user has an `azure-pipelines.yml` and wants a working GitHub Actions equivalent.

## Mapping cheat-sheet

| Azure Pipelines            | GitHub Actions                           |
|----------------------------|-------------------------------------------|
| `trigger:`               | `on: push:`                             |
| `pr:`                    | `on: pull_request:`                     |
| `stages:`                | `jobs:` with `needs:` for ordering    |
| `jobs:`                  | `jobs:` with `strategy.matrix`        |
| `steps: - script:`       | `steps: - run:`                         |
| `task: AzureCLI@2`       | `azure/login@v2` + `az` in `run:`   |
| Variable group             | Organization/repo/env secrets or vars     |
| Service connection         | OIDC federation (see `oidc-azure-federation`) |
| `environment:` (approval)| GitHub `environment:` (reviewers)       |
| Template file              | Reusable workflow (`workflow_call`)     |

## Process

1. Read the source `azure-pipelines.yml` end-to-end and list stages, jobs, and inline task types.
2. Ask which secrets/variables need to move (do NOT copy secret values — reference names only).
3. Generate `.github/workflows/ci.yml` with the mapped structure.
4. For every service connection, propose OIDC federation (`azure/login@v2` with `client-id` from secrets, `permissions.id-token: write`).
5. Output a **migration report** as markdown listing (a) what mapped 1:1, (b) what changed semantically (approvals, artifacts, retention), (c) TODO items requiring human decisions.

## Do not

- Silently drop a stage because there's no direct GHA equivalent — flag it in the report.
- Copy `condition: always()` verbatim; ask why it was there.

