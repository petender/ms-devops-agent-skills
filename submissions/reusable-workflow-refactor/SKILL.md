---
name: reusable-workflow-refactor
description: "Use this skill when the user wants to deduplicate CI logic across two or more GitHub Actions workflows."
---

# Reusable Workflow Refactor

## When to invoke

The user has two or more workflows with overlapping jobs and wants to extract the shared portion into a `workflow_call` reusable workflow.

## Rules

- Reusable workflows live under `.github/workflows/` alongside caller workflows.
- Expose configuration via `inputs:` (typed), pass secrets via `secrets:` block (name-only).
- **Do not** put environment-specific values in the reusable workflow itself.
- Prefer reusable workflows over composite actions when you need `jobs:` composition or matrix strategies.

## Skeleton

```yaml
# .github/workflows/build.yml (reusable)
on:
  workflow_call:
    inputs:
      node-version: { type: string, default: '20' }
    secrets:
      NPM_TOKEN: { required: false }

jobs:
  build:
    runs-on: ubuntu-latest
    steps: [...]
```

```yaml
# .github/workflows/ci.yml (caller)
jobs:
  build:
    uses: ./.github/workflows/build.yml
    with: { node-version: '22' }
    secrets: inherit
```

## Process

1. Diff the callers and identify the common core (usually checkout + setup + install + test).
2. Extract, add typed `inputs:`.
3. Rewrite each caller to invoke the reusable workflow. Keep caller files under 25 lines.
4. Verify with an intentionally-broken change in one repo to prove the reusable workflow catches it.

