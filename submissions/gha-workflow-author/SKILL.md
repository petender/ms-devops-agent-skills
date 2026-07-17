---
name: gha-workflow-author
description: "Use this skill whenever the user asks to create, refactor, or review a GitHub Actions workflow file under .github/workflows/."
---

# GitHub Actions Workflow Author

## When to invoke

- Creating a new `.github/workflows/*.yml`.
- Reviewing a workflow for missing permissions, unpinned actions, or concurrency bugs.
- Splitting a monolithic workflow into a reusable one.

## Guardrails

- **Pin actions by full SHA** for third-party actions; `@v4` is fine for `actions/*` official actions.
- Start with **least-privilege** `permissions:` at the workflow level. Never leave the default read-write.
- Add a `concurrency:` block on any workflow that pushes tags, publishes packages, or deploys.
- Use `matrix` for parallel language/OS testing; avoid duplicated jobs.
- Extract build/test/deploy into a **reusable workflow** (`workflow_call`) when two workflows share > 30 lines.

## Skeleton

```yaml
name: CI

on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix: { node: [20, 22] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
```

## Process

1. Confirm trigger set (push/PR/tag/schedule).
2. Confirm what secrets the workflow needs and whether OIDC can replace any of them.
3. Draft the YAML top-down: name, on, permissions, concurrency, jobs.
4. If deploying, invoke the `oidc-azure-federation` skill for cloud auth.

