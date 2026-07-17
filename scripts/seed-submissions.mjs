#!/usr/bin/env node
/**
 * One-shot generator for the 17 seed submissions. Idempotent-ish: it
 * overwrites files under submissions/<slug>/ every run. Delete this file
 * after the seed content is committed; it isn't wired into package.json.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

async function w(rel, content) {
  const full = join(ROOT, rel);
  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, content, 'utf8');
}

/**
 * Skill definition: everything the four files need in one object.
 * Bodies are kept short (~40-80 lines) but practical.
 */
const skills = [
  // --- 1. CI ---
  {
    slug: 'ado-pipeline-author',
    name: 'Azure DevOps Pipeline Author',
    category: 'ci',
    description: 'Author idiomatic azure-pipelines.yml files with reusable templates, stages, and gated deploys — for Azure Pipelines (YAML).',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Azure DevOps', 'YAML'],
    tags: ['ci', 'azure-devops', 'yaml'],
    level: 'intermediate',
    estimatedMinutes: 25,
    learningPaths: ['new-to-cicd'],
    applyTo: '**/azure-pipelines*.yml',
    triggerClaude: 'Use this skill whenever the user asks to create, refactor, or review an Azure DevOps pipeline (azure-pipelines.yml) or a pipeline template.',
    body: `## When to invoke

The user wants to (a) create a new azure-pipelines.yml, (b) refactor an existing one into stages/jobs/templates, (c) migrate a Classic UI pipeline to YAML, or (d) add a gated deployment.

## Guardrails

- Prefer **stages → jobs → steps** hierarchy over flat pipelines.
- Extract reusable logic into **templates** under \`templates/\` (build.yml, test.yml, deploy.yml). Never inline the same 20 lines twice.
- Pin **task versions** (\`AzureCLI@2\`, not \`@2.198.0\`, not \`@\`).
- Use **environments** for deploys — they enable approvals and traceability.
- Never hard-code service connection names; put them in a variable group.

## Standard template

\`\`\`yaml
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
\`\`\`

## Process

1. Ask what the pipeline builds (language/runtime), what environments deploy targets it has, and whether approvals are needed.
2. Sketch the stage graph before writing YAML.
3. Extract build + deploy into templates from the start — even for a single environment.
4. Output the YAML plus a \`README.md\` snippet describing required variable groups and service connections.

## Anti-patterns

- One giant \`steps:\` list at the root of the file.
- \`condition: always()\` used to hide flaky steps.
- Uploading logs as artifacts instead of using \`PublishTestResults@2\`.
`,
    hasAssets: true,
    assets: {
      'azure-pipelines.template.yml': `# Copy this into the repo root and edit.
trigger:
  branches: { include: [main] }

pool: { vmImage: ubuntu-latest }

variables:
  - group: shared-secrets

stages:
- stage: Build
  jobs:
  - template: templates/build.yml
- stage: Deploy_Dev
  dependsOn: Build
  jobs:
  - deployment: dev
    environment: dev
    strategy:
      runOnce:
        deploy:
          steps:
          - template: templates/deploy.yml
            parameters: { env: dev }
`,
      'templates/build.yml': `parameters:
  - name: nodeVersion
    default: '20.x'

jobs:
- job: build
  steps:
  - task: NodeTool@0
    inputs: { versionSpec: '\${{ parameters.nodeVersion }}' }
  - script: npm ci && npm run build --if-present && npm test --if-present
    displayName: 'Build & test'
  - task: PublishBuildArtifacts@1
    inputs: { PathtoPublish: 'dist', ArtifactName: 'app' }
`,
      'templates/deploy.yml': `parameters:
  - name: env
    type: string

steps:
- download: current
  artifact: app
- task: AzureWebApp@1
  inputs:
    azureSubscription: 'sc-\${{ parameters.env }}'
    appName: 'myapp-\${{ parameters.env }}'
    package: '$(Pipeline.Workspace)/app'
`,
    },
    trainer: {
      learningObjectives: [
        'Structure an Azure DevOps YAML pipeline into stages, jobs, and steps.',
        'Extract reusable logic into pipeline templates.',
        'Configure a gated deployment using environments and approvals.',
      ],
      prerequisites: ['Azure DevOps organization + project', 'A repo with a small buildable app'],
      demoScriptMinutes: 15,
      exercises: [
        { title: 'Convert a flat pipeline to stages', durationMinutes: 20, summary: 'Take a 60-line flat azure-pipelines.yml and refactor it into Build + Deploy_Dev stages.' },
        { title: 'Add environment approvals', durationMinutes: 15, summary: 'Configure the dev environment to require one reviewer before deploy.' },
      ],
      discussionQuestions: [
        'When does a stage boundary help vs hurt pipeline speed?',
        'What belongs in a variable group vs a template parameter?',
      ],
      commonPitfalls: [
        'Copy-pasting the same steps across jobs instead of extracting a template.',
        'Using \`condition: always()\` to hide flaky steps.',
      ],
      slideTalkingPoints: [
        'Stages are the unit of promotion; jobs are the unit of parallelism.',
        'Templates make pipelines reviewable at PR time — treat them like functions.',
      ],
    },
  },

  // --- 2. CI ---
  {
    slug: 'gha-workflow-author',
    name: 'GitHub Actions Workflow Author',
    category: 'ci',
    description: 'Write clean, matrix-friendly GitHub Actions workflows with reusable jobs, concurrency guards, and least-privilege permissions.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['GitHub Actions', 'YAML'],
    tags: ['ci', 'github-actions', 'yaml'],
    level: 'beginner',
    estimatedMinutes: 20,
    learningPaths: ['new-to-cicd', 'devsecops-starter'],
    applyTo: '.github/workflows/**/*.yml',
    triggerClaude: 'Use this skill whenever the user asks to create, refactor, or review a GitHub Actions workflow file under .github/workflows/.',
    body: `## When to invoke

- Creating a new \`.github/workflows/*.yml\`.
- Reviewing a workflow for missing permissions, unpinned actions, or concurrency bugs.
- Splitting a monolithic workflow into a reusable one.

## Guardrails

- **Pin actions by full SHA** for third-party actions; \`@v4\` is fine for \`actions/*\` official actions.
- Start with **least-privilege** \`permissions:\` at the workflow level. Never leave the default read-write.
- Add a \`concurrency:\` block on any workflow that pushes tags, publishes packages, or deploys.
- Use \`matrix\` for parallel language/OS testing; avoid duplicated jobs.
- Extract build/test/deploy into a **reusable workflow** (\`workflow_call\`) when two workflows share > 30 lines.

## Skeleton

\`\`\`yaml
name: CI

on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

permissions:
  contents: read

concurrency:
  group: ci-\${{ github.ref }}
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
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
\`\`\`

## Process

1. Confirm trigger set (push/PR/tag/schedule).
2. Confirm what secrets the workflow needs and whether OIDC can replace any of them.
3. Draft the YAML top-down: name, on, permissions, concurrency, jobs.
4. If deploying, invoke the \`oidc-azure-federation\` skill for cloud auth.
`,
    hasAssets: true,
    assets: {
      'ci.reusable.yml': `# .github/workflows/ci.yml
name: CI
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '20'

permissions: { contents: read }

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ inputs.node-version }}
          cache: npm
      - run: npm ci
      - run: npm test
`,
    },
    trainer: {
      learningObjectives: [
        'Compose a GitHub Actions workflow with correct permissions and concurrency.',
        'Use matrix builds to test across versions in parallel.',
        'Extract shared jobs into a reusable workflow.',
      ],
      prerequisites: ['GitHub repo with Actions enabled'],
      demoScriptMinutes: 12,
      exercises: [
        { title: 'Add matrix + cache', durationMinutes: 15, summary: 'Turn a single-version workflow into a matrix over Node 20/22 with npm cache.' },
        { title: 'Extract a reusable build job', durationMinutes: 20, summary: 'Move the build steps into workflow_call and consume it from two callers.' },
      ],
      discussionQuestions: ['When would you disable fail-fast?', 'What are the trade-offs of composite actions vs reusable workflows?'],
      commonPitfalls: ['Leaving `permissions: write-all` by default.', 'No concurrency guard on release workflows.'],
      slideTalkingPoints: ['Pin third-party actions by SHA — supply chain matters.', 'Reusable workflows are your building block for a platform pipeline.'],
    },
  },

  // --- 3. CI ---
  {
    slug: 'pipeline-to-actions-migrator',
    name: 'Azure Pipelines → GitHub Actions Migrator',
    category: 'ci',
    description: 'Convert an azure-pipelines.yml file to an equivalent GitHub Actions workflow — mapping stages/jobs/steps, service connections, and variable groups.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Azure DevOps', 'GitHub Actions'],
    tags: ['ci', 'migration', 'github-actions', 'azure-devops'],
    level: 'intermediate',
    estimatedMinutes: 35,
    learningPaths: ['new-to-cicd'],
    applyTo: '**/azure-pipelines*.yml',
    triggerClaude: 'Use this skill when the user asks to migrate, port, or convert an Azure DevOps pipeline to GitHub Actions.',
    body: `## When to invoke

The user has an \`azure-pipelines.yml\` and wants a working GitHub Actions equivalent.

## Mapping cheat-sheet

| Azure Pipelines            | GitHub Actions                           |
|----------------------------|-------------------------------------------|
| \`trigger:\`               | \`on: push:\`                             |
| \`pr:\`                    | \`on: pull_request:\`                     |
| \`stages:\`                | \`jobs:\` with \`needs:\` for ordering    |
| \`jobs:\`                  | \`jobs:\` with \`strategy.matrix\`        |
| \`steps: - script:\`       | \`steps: - run:\`                         |
| \`task: AzureCLI@2\`       | \`azure/login@v2\` + \`az\` in \`run:\`   |
| Variable group             | Organization/repo/env secrets or vars     |
| Service connection         | OIDC federation (see \`oidc-azure-federation\`) |
| \`environment:\` (approval)| GitHub \`environment:\` (reviewers)       |
| Template file              | Reusable workflow (\`workflow_call\`)     |

## Process

1. Read the source \`azure-pipelines.yml\` end-to-end and list stages, jobs, and inline task types.
2. Ask which secrets/variables need to move (do NOT copy secret values — reference names only).
3. Generate \`.github/workflows/ci.yml\` with the mapped structure.
4. For every service connection, propose OIDC federation (\`azure/login@v2\` with \`client-id\` from secrets, \`permissions.id-token: write\`).
5. Output a **migration report** as markdown listing (a) what mapped 1:1, (b) what changed semantically (approvals, artifacts, retention), (c) TODO items requiring human decisions.

## Do not

- Silently drop a stage because there's no direct GHA equivalent — flag it in the report.
- Copy \`condition: always()\` verbatim; ask why it was there.
`,
    hasScripts: true,
    scripts: {
      'migrate.sh': `#!/usr/bin/env bash
# Placeholder scaffold — the actual migration is done by the agent.
# This just prepares the target directory.
set -euo pipefail
mkdir -p .github/workflows
echo "Point your agent at azure-pipelines.yml and ask it to migrate."
`,
    },
    trainer: {
      learningObjectives: [
        'Map Azure DevOps YAML constructs to GitHub Actions equivalents.',
        'Replace service connections with OIDC federated credentials.',
        'Produce a migration report that surfaces semantic gaps.',
      ],
      prerequisites: ['An existing azure-pipelines.yml', 'A GitHub repo the pipeline should move to'],
      demoScriptMinutes: 20,
      exercises: [
        { title: 'Port a build+deploy pipeline', durationMinutes: 45, summary: 'Migrate a two-stage ADO pipeline (build → deploy) to a GHA workflow with an OIDC-federated deploy.' },
      ],
      discussionQuestions: ['Which ADO features have no clean GHA equivalent?', 'When is a full rewrite better than a migration?'],
      commonPitfalls: ['Hard-coding secret values instead of secret names.', 'Losing artifact retention rules silently.'],
      slideTalkingPoints: ['ADO stages ≈ GHA jobs with `needs:`.', 'OIDC eliminates long-lived service principal secrets.'],
    },
  },

  // --- 4. CI ---
  {
    slug: 'reusable-workflow-refactor',
    name: 'Reusable Workflow Refactor',
    category: 'ci',
    description: 'Refactor duplicated CI logic across multiple GitHub Actions workflows into a single reusable workflow (workflow_call).',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['GitHub Actions'],
    tags: ['ci', 'github-actions', 'refactor'],
    level: 'intermediate',
    estimatedMinutes: 20,
    learningPaths: [],
    applyTo: '.github/workflows/**/*.yml',
    triggerClaude: 'Use this skill when the user wants to deduplicate CI logic across two or more GitHub Actions workflows.',
    body: `## When to invoke

The user has two or more workflows with overlapping jobs and wants to extract the shared portion into a \`workflow_call\` reusable workflow.

## Rules

- Reusable workflows live under \`.github/workflows/\` alongside caller workflows.
- Expose configuration via \`inputs:\` (typed), pass secrets via \`secrets:\` block (name-only).
- **Do not** put environment-specific values in the reusable workflow itself.
- Prefer reusable workflows over composite actions when you need \`jobs:\` composition or matrix strategies.

## Skeleton

\`\`\`yaml
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
\`\`\`

\`\`\`yaml
# .github/workflows/ci.yml (caller)
jobs:
  build:
    uses: ./.github/workflows/build.yml
    with: { node-version: '22' }
    secrets: inherit
\`\`\`

## Process

1. Diff the callers and identify the common core (usually checkout + setup + install + test).
2. Extract, add typed \`inputs:\`.
3. Rewrite each caller to invoke the reusable workflow. Keep caller files under 25 lines.
4. Verify with an intentionally-broken change in one repo to prove the reusable workflow catches it.
`,
    trainer: {
      learningObjectives: [
        'Identify duplicated CI logic ripe for extraction.',
        'Author a reusable workflow with typed inputs and secret passing.',
        'Migrate callers with minimal disruption.',
      ],
      prerequisites: ['Two or more existing workflows'],
      demoScriptMinutes: 15,
      exercises: [
        { title: 'Extract and consume', durationMinutes: 30, summary: 'Take two workflows that share a build job and produce a reusable workflow + two callers.' },
      ],
      discussionQuestions: ['When is a composite action a better fit?', 'How do you version a reusable workflow across repos?'],
      commonPitfalls: ['Leaking env-specific values into the shared workflow.', 'Forgetting `secrets: inherit`.'],
      slideTalkingPoints: ['Callers stay skinny; the reusable workflow owns the recipe.', 'Version by tag if reused cross-repo.'],
    },
  },

  // --- 5. Security ---
  {
    slug: 'oidc-azure-federation',
    name: 'OIDC Azure Federated Credentials',
    category: 'security',
    description: 'Replace long-lived Azure service principal secrets with OIDC federated credentials for GitHub Actions or Azure DevOps.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Azure', 'GitHub Actions', 'Azure DevOps'],
    tags: ['security', 'oidc', 'azure', 'github-actions'],
    level: 'advanced',
    estimatedMinutes: 30,
    learningPaths: ['devsecops-starter', 'platform-engineer'],
    applyTo: '**',
    triggerClaude: 'Use this skill when the user asks to enable OIDC / federated identity credentials for a CI pipeline authenticating to Azure.',
    body: `## When to invoke

The user is deploying to Azure from GitHub Actions or Azure Pipelines using \`AZURE_CLIENT_SECRET\` (or an equivalent secret) and wants to eliminate long-lived credentials.

## Guardrails

- Federated credentials are **scoped to a specific subject** (\`repo:owner/repo:ref:refs/heads/main\`, \`repo:owner/repo:environment:production\`, or ADO service connection subject). Never use a wildcard.
- One federation per branch/environment. Don't grant \`main\` and \`pull_request\` the same power.
- Grant the AAD app **only the RBAC roles it needs** on the target scope — never Owner at subscription root.

## Standard setup (GitHub Actions → Azure)

\`\`\`bash
# 1. Create the app + service principal
az ad app create --display-name "gha-\${REPO}"
APP_ID=$(az ad app list --display-name "gha-\${REPO}" --query '[0].appId' -o tsv)
az ad sp create --id "$APP_ID"

# 2. Assign RBAC on the target resource group
az role assignment create \\
  --assignee "$APP_ID" \\
  --role Contributor \\
  --scope /subscriptions/$SUB/resourceGroups/$RG

# 3. Add a federated credential (branch scope)
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "gha-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:owner/repo:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
\`\`\`

## Workflow snippet

\`\`\`yaml
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: azure/login@v2
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}
\`\`\`

## Process

1. List every workflow currently using \`AZURE_CLIENT_SECRET\`.
2. For each, decide the correct subject (branch or environment).
3. Create one federated credential per subject.
4. Store the three non-secret IDs (client, tenant, subscription) as repo/org **variables** (they aren't secrets) or as GitHub secrets if the org prefers uniform handling.
5. Remove \`AZURE_CLIENT_SECRET\` after a successful deploy.
`,
    hasScripts: true,
    scripts: {
      'setup-oidc.sh': `#!/usr/bin/env bash
# Usage: ./setup-oidc.sh <repo-owner> <repo-name> <branch-or-env> <sub-id> <rg-name>
set -euo pipefail
OWNER="$1"; REPO="$2"; SUB_ID="$3"; RG="$4"
SUBJECT="repo:\${OWNER}/\${REPO}:ref:refs/heads/main"

APP_ID=$(az ad app create --display-name "gha-\${REPO}" --query appId -o tsv)
az ad sp create --id "$APP_ID" >/dev/null || true
az role assignment create --assignee "$APP_ID" --role Contributor --scope "/subscriptions/\${SUB_ID}/resourceGroups/\${RG}"
az ad app federated-credential create --id "$APP_ID" --parameters "{
  \\"name\\": \\"gha-main\\",
  \\"issuer\\": \\"https://token.actions.githubusercontent.com\\",
  \\"subject\\": \\"\${SUBJECT}\\",
  \\"audiences\\": [\\"api://AzureADTokenExchange\\"]
}"

TENANT_ID=$(az account show --query tenantId -o tsv)
echo "Add these to your GitHub repo:"
echo "  AZURE_CLIENT_ID=\${APP_ID}"
echo "  AZURE_TENANT_ID=\${TENANT_ID}"
echo "  AZURE_SUBSCRIPTION_ID=\${SUB_ID}"
`,
    },
    trainer: {
      learningObjectives: [
        'Explain why OIDC federation is preferable to a long-lived client secret.',
        'Create a federated credential scoped to a specific branch or environment.',
        'Migrate an existing workflow off `AZURE_CLIENT_SECRET`.',
      ],
      prerequisites: ['Azure subscription (Owner or User Access Administrator)', 'GitHub repo with Actions enabled'],
      demoScriptMinutes: 20,
      exercises: [
        { title: 'Migrate a deploy workflow', durationMinutes: 40, summary: 'Take a workflow using AZURE_CLIENT_SECRET and swap it for OIDC federation with branch-scoped credentials.' },
      ],
      discussionQuestions: ['How would you scope credentials per-environment?', 'What happens when a fork opens a PR — does it get the token?'],
      commonPitfalls: ['Reusing the same federated credential for main and PRs.', 'Granting Owner instead of Contributor on the RG.'],
      slideTalkingPoints: ['Federation = short-lived tokens, no rotation, no exposure.', 'Subject is the security boundary.'],
    },
  },

  // --- 6. IaC ---
  {
    slug: 'bicep-module-generator',
    name: 'Bicep Module Generator',
    category: 'iac',
    description: 'Author idempotent, parameterized Azure Bicep modules with @description decorators, typed parameters, outputs, and a main.bicep composition example.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Azure', 'Bicep'],
    tags: ['iac', 'azure', 'bicep'],
    level: 'intermediate',
    estimatedMinutes: 25,
    learningPaths: ['platform-engineer', 'aks-from-zero'],
    applyTo: '**/*.bicep',
    triggerClaude: 'Use this skill whenever the user asks to author, review, or refactor a Bicep module or main.bicep composition.',
    body: `## When to invoke

- The user asks to create a Bicep module for a specific Azure resource (storage account, key vault, AKS cluster, etc.).
- The user has an inline resource in \`main.bicep\` and wants it extracted into a module.

## Guardrails

- One module = one logical resource + its tightly-coupled sub-resources.
- Every parameter gets a \`@description('…')\` decorator. Every output does too.
- Use \`@allowed([...])\`, \`@minLength\`, \`@maxLength\`, \`@minValue\`, \`@maxValue\` where sensible.
- Prefer \`resource ... existing = { name: ... }\` over passing IDs when composing.
- Emit an \`output id string = res.id\` for every top-level resource.
- Location parameter defaults to \`resourceGroup().location\`.
- **Never** hard-code SKUs, region, or names. Everything a caller might tune → parameter.

## Skeleton

\`\`\`bicep
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
\`\`\`

## Process

1. Confirm the resource type + API version (use latest stable, not preview).
2. Identify the minimum viable parameters (name, location, tags) + tunables (sku, redundancy, etc.).
3. Write the module. Add \`@description\` to every param & output.
4. Produce a \`main.bicep\` snippet showing how a caller consumes it.
5. Emit a \`README.md\` with a parameters table.
`,
    hasAssets: true,
    assets: {
      'storage.bicep': `@description('Storage account name.')
@minLength(3)
@maxLength(24)
param name string

@description('Region.')
param location string = resourceGroup().location

@description('SKU.')
@allowed(['Standard_LRS', 'Standard_GRS', 'Standard_ZRS'])
param sku string = 'Standard_LRS'

@description('Tags.')
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
`,
      'main.bicep': `param location string = resourceGroup().location
param appName string

module storage './storage.bicep' = {
  name: 'sa'
  params: {
    name: toLower(replace('\${appName}sa', '-', ''))
    location: location
    tags: { app: appName }
  }
}

output storageId string = storage.outputs.id
`,
    },
    trainer: {
      learningObjectives: [
        'Author a Bicep module with typed, documented parameters and outputs.',
        'Compose modules from a main.bicep entry point.',
        'Recognize when to promote inline resources into modules.',
      ],
      prerequisites: ['Azure subscription with Contributor rights', 'Azure CLI 2.60+ with the Bicep extension'],
      demoScriptMinutes: 15,
      exercises: [
        { title: 'Convert an ARM template', durationMinutes: 25, summary: 'Take an existing storage-account ARM template and produce a Bicep module + a main.bicep caller.' },
        { title: 'Add a Key Vault module', durationMinutes: 20, summary: 'Author a second module that outputs a URI, and reference it from main.bicep.' },
      ],
      discussionQuestions: ['When would you prefer AVM (Azure Verified Modules) over authoring your own?', 'How do you version modules across teams?'],
      commonPitfalls: ['Skipping @description — makes IntelliSense useless.', 'Hard-coding region.'],
      slideTalkingPoints: ['Modules are the reuse boundary — treat them like npm packages.', 'Outputs are your public API.'],
    },
  },

  // --- 7. IaC ---
  {
    slug: 'terraform-module-reviewer',
    name: 'Terraform Module Reviewer',
    category: 'iac',
    description: 'Review a Terraform module for idempotency, variable typing, output completeness, provider pinning, and state safety issues.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Terraform'],
    tags: ['iac', 'terraform', 'review'],
    level: 'intermediate',
    estimatedMinutes: 20,
    learningPaths: ['platform-engineer'],
    applyTo: '**/*.tf',
    triggerClaude: 'Use this skill when the user asks to review, audit, or improve an existing Terraform module or root module.',
    body: `## When to invoke

The user shares one or more \`.tf\` files and asks for a review.

## Checklist (walk it top to bottom)

1. **Provider pinning** — \`required_providers\` block with \`version = "~> X.Y"\` for every provider. No implicit provider blocks.
2. **Backend configured** — no \`local\` backend in prod modules.
3. **Variables** — every \`variable\` has \`type\`, \`description\`, and (where possible) \`validation\` rules.
4. **Outputs** — every top-level resource has an output for its \`id\` and, if useful, \`name\`.
5. **Naming** — \`locals\` compute names once. Nothing hard-coded like environment or region.
6. **Idempotency** — no \`null_resource\` with \`local-exec\` unless justified. No \`triggers = { always_run = timestamp() }\`.
7. **State safety** — no \`terraform_remote_state\` where a data source works. No \`import\` blocks left in code long-term.
8. **Tagging** — a \`local.common_tags\` merged into every taggable resource.
9. **Sensitive** — outputs referencing secrets marked \`sensitive = true\`.
10. **for_each vs count** — \`for_each\` on a stable map, \`count\` only for boolean feature flags.

## Output format

Produce a Markdown review with three sections:
- ✅ **Good** — what the module already does well.
- ⚠ **Should fix** — issues that will bite eventually.
- ❌ **Must fix** — bugs, security holes, state hazards.

Cite specific line numbers.
`,
    trainer: {
      learningObjectives: [
        'Apply a systematic review checklist to a Terraform module.',
        'Recognize state-safety anti-patterns.',
        'Recommend variable/output improvements that raise reusability.',
      ],
      prerequisites: ['A Terraform module to review', 'Terraform 1.6+'],
      demoScriptMinutes: 20,
      exercises: [
        { title: 'Review a real module', durationMinutes: 30, summary: 'Bring a module from your organization; run it through the checklist and produce a review doc.' },
      ],
      discussionQuestions: ['What review items would you add for AWS specifically?', 'How do you enforce tagging without a policy engine?'],
      commonPitfalls: ['`count` vs `for_each` confusion causing destroy-and-recreate.', 'Missing provider version constraints causing surprise upgrades.'],
      slideTalkingPoints: ['State is the source of truth — protect it first.', '`for_each` uses map keys as identity; picking bad keys creates churn.'],
    },
  },

  // --- 8. Container ---
  {
    slug: 'dockerfile-hardener',
    name: 'Dockerfile Hardener',
    category: 'container',
    description: 'Rewrite a Dockerfile to be minimal, non-root, multi-stage, pinned by digest, with a HEALTHCHECK and no build tools in the final image.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Docker'],
    tags: ['container', 'docker', 'security'],
    level: 'intermediate',
    estimatedMinutes: 25,
    learningPaths: ['devsecops-starter'],
    applyTo: '**/Dockerfile*',
    triggerClaude: 'Use this skill when the user asks to review, harden, minify, or optimize a Dockerfile.',
    body: `## When to invoke

The user shares a Dockerfile and asks to make it smaller, faster, or more secure.

## Guardrails

- **Multi-stage**: builder + runtime. Runtime image contains only what's needed at runtime.
- **Base image**: prefer \`-slim\`, \`-alpine\`, or distroless. Pin by **digest** (\`@sha256:…\`), not tag.
- **Non-root**: create a user, \`USER 10001\`. Don't run as \`root\` in the final image.
- **Layer ordering**: copy manifests + install deps *before* copying source. Maximizes cache hits.
- **HEALTHCHECK**: add one that exercises the app, not just \`curl /\`.
- **No secrets** in build args or env. Use BuildKit \`--secret\` for build-time secrets.
- **.dockerignore**: exclude \`node_modules\`, \`.git\`, tests.
- **Explicit port** with \`EXPOSE\` (doc-only, but expected).

## Before → After example

\`\`\`dockerfile
# --- builder ---
FROM node:20-slim@sha256:<digest> AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# --- runtime ---
FROM gcr.io/distroless/nodejs20-debian12@sha256:<digest>
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
USER 10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD ["node", "-e", "require('http').get('http://localhost:8080/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"]
CMD ["dist/server.js"]
\`\`\`

## Process

1. Read the source Dockerfile. Identify base image, package manager, entrypoint.
2. Split into builder + runtime. Move any build tools (compilers, npm, pip, etc.) to the builder only.
3. Pin the base image by digest (ask the user to run \`docker pull … && docker inspect --format='{{.RepoDigests}}' …\`).
4. Add \`USER\`, \`HEALTHCHECK\`, \`.dockerignore\`.
5. Report **image-size before/after** if the user can run \`docker build\`.
`,
    hasAssets: true,
    assets: {
      'Dockerfile.node.template': `# --- builder ---
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# --- runtime ---
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
USER 10001
EXPOSE 8080
CMD ["dist/server.js"]
`,
      '.dockerignore': `.git
node_modules
npm-debug.log
Dockerfile
.dockerignore
.github
tests
coverage
`,
    },
    trainer: {
      learningObjectives: [
        'Refactor a naive Dockerfile into a multi-stage, non-root build.',
        'Pin base images by digest for supply-chain safety.',
        'Add a meaningful HEALTHCHECK.',
      ],
      prerequisites: ['Docker Desktop or a Docker-in-Docker CI runner'],
      demoScriptMinutes: 15,
      exercises: [
        { title: 'Harden a Node.js Dockerfile', durationMinutes: 30, summary: 'Take a 20-line single-stage Node Dockerfile and produce a multi-stage distroless image; measure the size delta.' },
      ],
      discussionQuestions: ['When is Alpine a bad choice?', 'Where does distroless not fit?'],
      commonPitfalls: ['Copying `.env` into the image.', 'Installing curl just for HEALTHCHECK.'],
      slideTalkingPoints: ['Small images ship faster and expose less.', 'Digest pins protect you from tag hijacks.'],
    },
  },

  // --- 9. Container ---
  {
    slug: 'docker-compose-to-k8s',
    name: 'Docker Compose → Kubernetes Manifests',
    category: 'container',
    description: 'Translate a docker-compose.yml file into a set of clean Kubernetes manifests (Deployment, Service, ConfigMap, Secret) with realistic resource requests and probes.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Docker', 'Kubernetes'],
    tags: ['container', 'kubernetes', 'migration'],
    level: 'intermediate',
    estimatedMinutes: 30,
    learningPaths: ['aks-from-zero'],
    applyTo: '**/docker-compose*.yml',
    triggerClaude: 'Use this skill when the user asks to convert a docker-compose.yml file into Kubernetes manifests.',
    body: `## When to invoke

The user has a \`docker-compose.yml\` and wants a Kubernetes deployment.

## Mapping

| compose                    | Kubernetes                            |
|----------------------------|----------------------------------------|
| \`services.<x>.image\`     | Deployment container image            |
| \`ports:\`                 | Service (ClusterIP), plus Deployment containerPort |
| \`environment:\`           | ConfigMap + envFrom                   |
| \`env_file:\`              | ConfigMap generated from the file     |
| \`secrets:\`               | Secret (base64-encoded)               |
| \`volumes:\`               | PersistentVolumeClaim + volumeMount   |
| \`depends_on:\`            | initContainer or readiness probe on target |
| \`restart: unless-stopped\`| Deployment default (Always)           |
| \`networks:\`              | NetworkPolicy (only if needed)        |
| \`healthcheck:\`           | livenessProbe / readinessProbe        |

## Defaults to add

- \`resources.requests\`: 100m CPU, 128Mi memory.
- \`resources.limits\`: 500m CPU, 512Mi memory.
- \`readinessProbe\` on the app's health path.
- \`securityContext\`: \`runAsNonRoot: true\`, \`readOnlyRootFilesystem: true\` when possible.

## Process

1. Read the compose file, list services.
2. For each service, produce Deployment + Service (+ ConfigMap / PVC if applicable).
3. Split manifests into one file per kind under \`k8s/\` (e.g. \`api-deployment.yaml\`, \`api-service.yaml\`).
4. Print an \`Apply\` order: ConfigMap/Secret → PVC → Deployment → Service → Ingress.
5. Add a \`README.md\` snippet with \`kubectl apply -f k8s/\`.
`,
    trainer: {
      learningObjectives: [
        'Map every compose primitive to its Kubernetes equivalent.',
        'Add realistic resource requests, limits, and probes.',
        'Apply the manifests in the correct order.',
      ],
      prerequisites: ['A working docker-compose stack', 'Access to a Kubernetes cluster (kind/minikube/AKS)'],
      demoScriptMinutes: 20,
      exercises: [
        { title: 'Translate a two-service stack', durationMinutes: 40, summary: 'Convert a compose file with an API + Postgres into Deployments, Services, ConfigMap, PVC.' },
      ],
      discussionQuestions: ['What compose features have no clean K8s equivalent?', 'When would you use a Helm chart instead of raw manifests?'],
      commonPitfalls: ['Ignoring `depends_on` — pods start in parallel.', 'Skipping resource requests.'],
      slideTalkingPoints: ['Compose is a dev tool; K8s is a runtime.', 'Requests drive scheduling, limits drive throttling.'],
    },
  },

  // --- 10. K8s ---
  {
    slug: 'k8s-manifest-author',
    name: 'Kubernetes Manifest Author',
    category: 'k8s',
    description: 'Write production-ready Kubernetes manifests (Deployment, Service, ConfigMap, HPA, PDB) with security contexts, probes, and requests/limits.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Kubernetes'],
    tags: ['k8s', 'yaml'],
    level: 'intermediate',
    estimatedMinutes: 25,
    learningPaths: ['aks-from-zero'],
    applyTo: '**/k8s/**/*.yaml',
    triggerClaude: 'Use this skill when the user asks to write, refactor, or review Kubernetes manifests (Deployment, Service, HPA, PDB, ConfigMap, Secret).',
    body: `## When to invoke

- Authoring a new Deployment + Service pair.
- Adding autoscaling (HPA), disruption budget (PDB), or probes to an existing manifest.

## Defaults every Deployment needs

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels: { app: api }
spec:
  replicas: 2
  selector: { matchLabels: { app: api } }
  template:
    metadata:
      labels: { app: api }
    spec:
      securityContext:
        runAsNonRoot: true
        seccompProfile: { type: RuntimeDefault }
      containers:
      - name: api
        image: ghcr.io/org/api:1.2.3
        ports: [{ containerPort: 8080 }]
        env:
        - name: LOG_LEVEL
          valueFrom: { configMapKeyRef: { name: api-config, key: log_level } }
        resources:
          requests: { cpu: 100m, memory: 128Mi }
          limits:   { cpu: 500m, memory: 512Mi }
        livenessProbe:
          httpGet: { path: /health, port: 8080 }
          initialDelaySeconds: 10
        readinessProbe:
          httpGet: { path: /ready, port: 8080 }
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities: { drop: [ALL] }
\`\`\`

## HPA + PDB

- HPA on CPU 70% + Memory 80% for stateless services.
- PDB \`minAvailable: 1\` when replicas ≥ 2.

## Rules

- Always set \`resources.requests\`. Without them, the scheduler treats the pod as best-effort.
- Never use \`:latest\` in production manifests.
- Prefer \`Recreate\` strategy for stateful workloads, \`RollingUpdate\` (default) for stateless.

## Process

1. Ask replicas, port, health paths, config keys, secrets, and any storage need.
2. Emit one YAML file per resource (\`api-deployment.yaml\`, \`api-service.yaml\`, \`api-hpa.yaml\`, \`api-pdb.yaml\`).
3. Print the \`kubectl apply\` order.
`,
    trainer: {
      learningObjectives: [
        'Compose a production-ready Deployment with probes, requests, and security context.',
        'Add HPA + PDB for resilience.',
        'Use ConfigMap + Secret correctly.',
      ],
      prerequisites: ['Access to a Kubernetes cluster'],
      demoScriptMinutes: 15,
      exercises: [
        { title: 'Wire probes + resources', durationMinutes: 20, summary: 'Take a bare Deployment and add live/ready probes plus requests/limits.' },
      ],
      discussionQuestions: ['How do you pick initial resource requests without production data?', 'When is HPA a bad fit?'],
      commonPitfalls: ['Setting limits without requests.', 'Same path for liveness and readiness.'],
      slideTalkingPoints: ['Requests = scheduling contract; limits = enforcement.', 'PDB protects against voluntary disruption only.'],
    },
  },

  // --- 11. K8s ---
  {
    slug: 'helm-chart-scaffold',
    name: 'Helm Chart Scaffold',
    category: 'k8s',
    description: 'Scaffold a well-structured Helm chart with values.yaml, _helpers.tpl, templates for Deployment/Service/Ingress, and NOTES.txt.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Kubernetes', 'Helm'],
    tags: ['k8s', 'helm'],
    level: 'intermediate',
    estimatedMinutes: 20,
    learningPaths: ['aks-from-zero'],
    applyTo: '**/Chart.yaml',
    triggerClaude: 'Use this skill when the user asks to create a Helm chart or convert raw manifests into a chart.',
    body: `## When to invoke

- Creating a new Helm chart from scratch.
- Converting raw \`k8s/*.yaml\` into a parametrized chart.

## Structure

\`\`\`
charts/<name>/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── serviceaccount.yaml
│   └── NOTES.txt
└── .helmignore
\`\`\`

## Rules

- Every resource uses \`{{ include "<chart>.fullname" . }}\` for its name.
- Every resource carries the standard labels from \`_helpers.tpl\`.
- Ingress is templated on \`.Values.ingress.enabled\`.
- ServiceAccount is templated on \`.Values.serviceAccount.create\`.
- \`values.yaml\` is exhaustive — every branch in the templates has a default.
- Bump \`appVersion\` for image bumps, \`version\` for chart-schema changes.

## Process

1. Ask for chart name, image repo, service port.
2. Emit the scaffold. Prefer \`helm create\` conventions but strip the boilerplate NOTES you don't need.
3. Add a \`README.md\` with a values table.
4. Verify with \`helm template . | kubectl apply --dry-run=server -f -\`.
`,
    trainer: {
      learningObjectives: [
        'Explain the standard Helm chart layout.',
        'Author templates using _helpers.tpl for consistent labels/names.',
        'Design a values.yaml that covers every template branch.',
      ],
      prerequisites: ['Helm 3.12+', 'A running Kubernetes cluster'],
      demoScriptMinutes: 15,
      exercises: [
        { title: 'Convert raw manifests to a chart', durationMinutes: 30, summary: 'Take a set of raw Deployment/Service manifests and produce an installable chart with an ingress toggle.' },
      ],
      discussionQuestions: ['When would you prefer Kustomize over Helm?', 'How do you test template rendering?'],
      commonPitfalls: ['Hard-coding names instead of using fullname helper.', 'Untemplated ingress that always creates one.'],
      slideTalkingPoints: ['Helm is a package manager, not a config manager.', 'Every template branch needs a values default.'],
    },
  },

  // --- 12. K8s ---
  {
    slug: 'aks-bootstrap',
    name: 'AKS Cluster Bootstrap',
    category: 'k8s',
    description: 'Bootstrap a production-shaped AKS cluster with managed identity, Azure CNI Overlay, workload identity, and a system nodepool separated from user workloads.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Azure', 'AKS', 'Bicep'],
    tags: ['k8s', 'aks', 'azure', 'bootstrap'],
    level: 'advanced',
    estimatedMinutes: 40,
    learningPaths: ['aks-from-zero', 'platform-engineer'],
    applyTo: '**/*.bicep',
    triggerClaude: 'Use this skill when the user asks to create, provision, or bootstrap an AKS cluster.',
    body: `## When to invoke

The user wants a new AKS cluster suitable for real workloads (not a scratch dev cluster).

## Baseline

- **Managed identity** (not service principal).
- **Azure CNI Overlay** networking.
- **Workload identity** enabled (\`--enable-workload-identity --enable-oidc-issuer\`).
- **System nodepool** with taint \`CriticalAddonsOnly=true:NoSchedule\`.
- **User nodepool** for workloads, autoscaler enabled.
- **RBAC** with AAD integration.
- **Azure Monitor** for containers enabled.
- **Private cluster** unless the user explicitly opts out.
- \`kubernetesVersion\`: latest patch of the LTS minor.

## az CLI recipe

\`\`\`bash
RG=rg-aks-prod
LOC=westeurope
NAME=aks-prod

az group create -n $RG -l $LOC

az aks create -g $RG -n $NAME \\
  --location $LOC \\
  --kubernetes-version 1.30 \\
  --network-plugin azure --network-plugin-mode overlay \\
  --network-dataplane cilium \\
  --enable-managed-identity \\
  --enable-workload-identity --enable-oidc-issuer \\
  --enable-aad --enable-azure-rbac \\
  --nodepool-name system --node-count 3 --node-vm-size Standard_D4ds_v5 \\
  --node-taints CriticalAddonsOnly=true:NoSchedule \\
  --enable-addons monitoring \\
  --enable-private-cluster

az aks nodepool add -g $RG --cluster-name $NAME \\
  --name apps --mode User \\
  --node-count 2 --min-count 2 --max-count 10 \\
  --enable-cluster-autoscaler --node-vm-size Standard_D8ds_v5
\`\`\`

## Process

1. Confirm region, VNet strategy (BYO vs managed), and whether the cluster must be private.
2. Emit the \`az aks create\` (or Bicep) that produces the baseline above.
3. Add a follow-up section for cluster essentials: ingress controller, cert-manager, external-dns, metrics-server (if not already).
4. Print how to \`az aks get-credentials\` and validate with \`kubectl get nodes\`.
`,
    hasScripts: true,
    scripts: {
      'aks-bootstrap.sh': `#!/usr/bin/env bash
set -euo pipefail
: "\${RG:?}"; : "\${LOC:?}"; : "\${NAME:?}"

az group create -n "$RG" -l "$LOC" >/dev/null

az aks create -g "$RG" -n "$NAME" \\
  --location "$LOC" \\
  --kubernetes-version 1.30 \\
  --network-plugin azure --network-plugin-mode overlay --network-dataplane cilium \\
  --enable-managed-identity \\
  --enable-workload-identity --enable-oidc-issuer \\
  --enable-aad --enable-azure-rbac \\
  --nodepool-name system --node-count 3 --node-vm-size Standard_D4ds_v5 \\
  --node-taints CriticalAddonsOnly=true:NoSchedule \\
  --enable-addons monitoring \\
  --enable-private-cluster

az aks nodepool add -g "$RG" --cluster-name "$NAME" \\
  --name apps --mode User \\
  --node-count 2 --min-count 2 --max-count 10 \\
  --enable-cluster-autoscaler --node-vm-size Standard_D8ds_v5

az aks get-credentials -g "$RG" -n "$NAME" --overwrite-existing
kubectl get nodes -o wide
`,
    },
    trainer: {
      learningObjectives: [
        'Provision an AKS cluster with production-shaped defaults.',
        'Separate system and user workloads with nodepool taints.',
        'Enable managed + workload identity for keyless auth.',
      ],
      prerequisites: ['Azure subscription (Owner on target RG)', 'Azure CLI + kubectl'],
      demoScriptMinutes: 25,
      exercises: [
        { title: 'Bootstrap + validate', durationMinutes: 45, summary: 'Run the script, then deploy a sample workload restricted to the apps nodepool.' },
      ],
      discussionQuestions: ['When would you skip the private cluster mode?', 'How do you plan for cluster upgrades on a taint-based nodepool split?'],
      commonPitfalls: ['Scheduling workloads on the system pool.', 'Forgetting to enable OIDC issuer before workload identity.'],
      slideTalkingPoints: ['System vs user nodepool separation is the single highest-leverage AKS practice.', 'Managed identity + workload identity = zero secrets in cluster.'],
    },
  },

  // --- 13. Observability ---
  {
    slug: 'observability-wiring',
    name: 'App Observability Wiring',
    category: 'obs',
    description: 'Wire OpenTelemetry traces, metrics, and structured logs into an app and export them to Azure Monitor / Application Insights.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Azure', 'Application Insights', 'OpenTelemetry'],
    tags: ['obs', 'otel', 'app-insights'],
    level: 'intermediate',
    estimatedMinutes: 30,
    learningPaths: ['platform-engineer'],
    applyTo: '**',
    triggerClaude: 'Use this skill when the user asks to add observability (traces, metrics, structured logs) to an application.',
    body: `## When to invoke

The user wants their app to emit traces + metrics + structured logs, typically to Azure Monitor / Application Insights, or to an OpenTelemetry Collector.

## Guardrails

- Use the OpenTelemetry SDK for the app's language; use the vendor-neutral OTLP exporter.
- Prefer **auto-instrumentation** where available (Node, Python, .NET, Java).
- Emit **W3C traceparent** headers so services correlate.
- Logs are **structured JSON**, and every log line includes the current trace/span id.
- Sampling: head-based, parent-based, default 10% for prod; 100% for dev.
- Never log secrets, tokens, or PII.

## Node.js snippet

\`\`\`ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
\`\`\`

## For Azure

Two paths:
1. **Native**: use the \`@azure/monitor-opentelemetry\` distro. One line: \`useAzureMonitor()\`.
2. **OTLP → Collector → Azure**: run OpenTelemetry Collector with \`azuremonitor\` exporter.

## Process

1. Identify language + framework.
2. Pick auto-instrumentation.
3. Wire the exporter with env vars, never hard-coded endpoints.
4. Add \`resource\` attributes: \`service.name\`, \`service.version\`, \`deployment.environment\`.
5. Verify: hit the app, then \`az monitor app-insights query\` or the portal Live Metrics.
`,
    trainer: {
      learningObjectives: [
        'Explain the OTel three-signal model.',
        'Wire OpenTelemetry + Azure Monitor into an app.',
        'Correlate logs, traces, and metrics with a trace id.',
      ],
      prerequisites: ['An app you can modify', 'Application Insights resource'],
      demoScriptMinutes: 20,
      exercises: [
        { title: 'Instrument a Node service', durationMinutes: 30, summary: 'Add @azure/monitor-opentelemetry to a sample Express app; verify traces in Live Metrics.' },
      ],
      discussionQuestions: ['When is 100% sampling too much?', 'How do you handle spans across async queues?'],
      commonPitfalls: ['Logging without trace_id.', 'Missing `deployment.environment` — you can\'t filter by env.'],
      slideTalkingPoints: ['One SDK, many backends — that\'s OTel\'s value.', 'Correlation > volume.'],
    },
  },

  // --- 14. Security ---
  {
    slug: 'devsecops-preflight',
    name: 'DevSecOps Preflight',
    category: 'security',
    description: 'Add a preflight security stage to CI: secret scanning, SAST, dependency vulnerability scan, container image scan, and SBOM generation.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['GitHub Actions', 'Trivy', 'Semgrep', 'Syft'],
    tags: ['security', 'ci', 'sbom', 'sast'],
    level: 'intermediate',
    estimatedMinutes: 30,
    learningPaths: ['devsecops-starter'],
    applyTo: '.github/workflows/**/*.yml',
    triggerClaude: 'Use this skill when the user asks to add security scanning (SAST, secret scan, dependency scan, image scan, SBOM) to their CI pipeline.',
    body: `## When to invoke

The user wants a "security preflight" gate that runs before merge or deploy.

## The five checks

1. **Secret scanning** — Gitleaks or \`trufflehog\`. Fail on any high-confidence finding.
2. **SAST** — Semgrep (\`p/ci\` + language-specific rulesets) or CodeQL.
3. **Dependency scan** — \`npm audit --production\`, \`pip-audit\`, \`osv-scanner\`, or Dependabot alerts.
4. **Container image scan** — Trivy against the built image. Fail on CRITICAL by default, warn on HIGH.
5. **SBOM** — Syft to generate a CycloneDX or SPDX SBOM. Attach as workflow artifact.

## Skeleton (GitHub Actions)

\`\`\`yaml
name: Security Preflight
on:
  pull_request:
  push: { branches: [main] }

permissions:
  contents: read
  security-events: write

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Secret scan
        uses: gitleaks/gitleaks-action@v2

      - name: SAST (Semgrep)
        uses: semgrep/semgrep-action@v1
        with: { config: p/ci }

      - name: Dependency audit
        run: npm ci && npm audit --omit=dev --audit-level=high

      - name: Build image
        run: docker build -t app:pr .

      - name: Image scan (Trivy)
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: app:pr
          severity: CRITICAL
          exit-code: 1

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: app:pr
          format: cyclonedx-json
\`\`\`

## Process

1. Ask which checks are already in place (don't duplicate).
2. Add the missing ones. Fail on CRITICAL only initially; ratchet up to HIGH once the backlog is cleared.
3. Attach SBOM as an artifact so downstream tools (image signing, VEX) can consume it.
`,
    hasAssets: true,
    assets: {
      '.github/workflows/security.yml': `name: Security Preflight
on:
  pull_request:
  push: { branches: [main] }
permissions:
  contents: read
  security-events: write
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gitleaks/gitleaks-action@v2
      - uses: semgrep/semgrep-action@v1
        with: { config: p/ci }
      - run: npm ci && npm audit --omit=dev --audit-level=high
      - run: docker build -t app:pr .
      - uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: app:pr
          severity: CRITICAL
          exit-code: 1
      - uses: anchore/sbom-action@v0
        with:
          image: app:pr
          format: cyclonedx-json
`,
    },
    trainer: {
      learningObjectives: [
        'Compose a five-check security preflight into an existing CI workflow.',
        'Distinguish blocking from advisory findings.',
        'Produce an SBOM as a CI artifact.',
      ],
      prerequisites: ['A repo with a working CI workflow and a Dockerfile'],
      demoScriptMinutes: 20,
      exercises: [
        { title: 'Add the preflight job', durationMinutes: 30, summary: 'Add the security preflight to an existing repo and drive it green.' },
      ],
      discussionQuestions: ['How do you triage a HIGH finding that has no fix upstream?', 'Where does the SBOM live long-term?'],
      commonPitfalls: ['Failing on all severities from day 1 — the pipeline never goes green.', 'Skipping the image scan because the SAST already ran.'],
      slideTalkingPoints: ['Shift-left, but don\'t shift-blame — start advisory, then enforce.', 'SBOM is the receipt.'],
    },
  },

  // --- 15. Release ---
  {
    slug: 'release-strategy-advisor',
    name: 'Release Strategy Advisor',
    category: 'release',
    description: 'Recommend blue-green, canary, or rolling deployment strategy for a service and produce the concrete pipeline + K8s / traffic-manager config to implement it.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Kubernetes', 'GitHub Actions', 'Azure'],
    tags: ['release', 'k8s', 'ci'],
    level: 'advanced',
    estimatedMinutes: 30,
    learningPaths: ['platform-engineer'],
    applyTo: '**',
    triggerClaude: 'Use this skill when the user asks which release strategy to use (blue-green vs canary vs rolling) or asks to implement one.',
    body: `## When to invoke

The user is deploying a service and asks about zero-downtime, gradual, or safe-rollback strategies.

## Decision matrix

| Criterion                                 | Rolling | Canary | Blue-Green |
|-------------------------------------------|---------|--------|------------|
| Stateless service                         | ✅      | ✅     | ✅         |
| Instant rollback needed                   | ⚠      | ⚠     | ✅         |
| Traffic split by percentage/geography     | ❌      | ✅     | ⚠         |
| Cost-sensitive (2x fleet unacceptable)    | ✅      | ✅     | ❌         |
| Schema-incompatible change                | ⚠      | ⚠     | ✅ (with expand/contract) |
| Long-running sessions                     | ⚠      | ⚠     | ✅         |

## Recommend + implement

1. Ask about traffic pattern, statefulness, DB coupling, rollback SLO.
2. Recommend ONE strategy with 2-3 sentence rationale.
3. Produce the actual config:
   - **Rolling**: Deployment \`strategy.rollingUpdate\` + \`maxSurge / maxUnavailable\`.
   - **Canary**: two Deployments (\`stable\`, \`canary\`) + weighted Service (Argo Rollouts / Flagger) or Traffic Manager weighted routing.
   - **Blue-green**: two Deployments behind a Service; PR flips \`selector.color\`.
4. Add rollback: for canary/BG a single \`kubectl patch\` or workflow-dispatch rollback job.

## Anti-patterns

- Canary with no automated metric gate → it's just a slow rolling deploy.
- Blue-green without database strategy → schema break kills you.
- Rolling with \`maxUnavailable: 100%\` → outage.
`,
    trainer: {
      learningObjectives: [
        'Pick a release strategy for a given service profile.',
        'Implement the chosen strategy in Kubernetes and a CI workflow.',
        'Design a rollback path per strategy.',
      ],
      prerequisites: ['A deployable service', 'Kubernetes cluster or Azure App Service slots'],
      demoScriptMinutes: 20,
      exercises: [
        { title: 'Implement a canary', durationMinutes: 40, summary: 'Split traffic 90/10 between two Deployments using Argo Rollouts and promote based on a Prometheus metric gate.' },
      ],
      discussionQuestions: ['How would you canary a stateful service?', 'What metrics gate a canary promotion?'],
      commonPitfalls: ['No metric gate on canary.', 'Blue-green without expand/contract for the DB.'],
      slideTalkingPoints: ['Strategy is a function of state, cost, and rollback SLO.', 'Automate the promotion or you have a manual toy.'],
    },
  },

  // --- 16. IR ---
  {
    slug: 'ir-runbook-author',
    name: 'Incident Runbook Author',
    category: 'ir',
    description: 'Turn an alert or a past incident into a repeatable runbook: triage steps, diagnostic commands, mitigation, communication template, and postmortem seed.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Azure', 'Application Insights', 'Kubernetes'],
    tags: ['ir', 'runbook', 'operations'],
    level: 'intermediate',
    estimatedMinutes: 20,
    learningPaths: [],
    applyTo: '**/runbooks/**/*.md',
    triggerClaude: 'Use this skill when the user asks to write, refactor, or fill out an incident response runbook.',
    body: `## When to invoke

The user has an alert (or a past incident) and wants a runbook the on-call engineer can execute at 3 AM.

## Runbook shape

\`\`\`markdown
# Runbook: <alert name>

**Severity**: <SEV-1 / SEV-2 / SEV-3>
**Owner team**: <team>
**Alert source**: <Azure Monitor rule / GitHub / …>
**SLI/SLO impact**: <which SLO this violates>

## 1. Confirm

Commands to verify the alert isn't a false positive.

## 2. Diagnose

Ordered checks (fastest → most invasive). Each has a copy-pasteable command.

## 3. Mitigate

The **safe short-term action** (rollback, scale up, failover, disable feature flag).
The **root-cause action** goes to the postmortem — not here.

## 4. Communicate

Template message for status page / Slack / stakeholders.

## 5. Follow up

- Open a postmortem issue with the template link.
- Add any new signal to monitoring.
\`\`\`

## Rules

- Every command is copy-pasteable — no placeholders inline; put them in a "Variables" section at the top.
- Prefer **read-only diagnosis before mutation**.
- The runbook doesn't debug — it stabilizes.
- Every runbook links to its **postmortem template**.

## Process

1. Ask the user for the alert or incident description, blast radius, and known signals.
2. Draft sections 1-5.
3. Suggest 3-5 additional signals worth alerting on that this incident revealed.
`,
    trainer: {
      learningObjectives: [
        'Structure a runbook that a fresh on-call can execute.',
        'Separate mitigation from root cause.',
        'Extract additional monitoring signals from an incident.',
      ],
      prerequisites: ['One real or hypothetical alert', 'A monitoring system to reference'],
      demoScriptMinutes: 15,
      exercises: [
        { title: 'Author a runbook from an alert', durationMinutes: 30, summary: 'Take a "high 5xx rate" alert and produce a full runbook including mitigation and communication.' },
      ],
      discussionQuestions: ['How often should runbooks be exercised?', 'What belongs in the runbook vs the postmortem?'],
      commonPitfalls: ['Runbooks that try to root-cause.', 'Commands that require the reader to substitute values in three places.'],
      slideTalkingPoints: ['Runbook = stabilize. Postmortem = understand.', 'Read-only before mutation.'],
    },
  },

  // --- 17. FinOps ---
  {
    slug: 'azure-cost-rightsizer',
    name: 'Azure Cost Rightsizer',
    category: 'finops',
    description: 'Pull utilization data for Azure VMs, App Service plans, and AKS nodepools; recommend rightsizing / reserved instance / savings plan actions with dollar estimates.',
    platforms: ['Claude', 'GitHub Copilot'],
    tools: ['Azure', 'Azure Monitor', 'Cost Management'],
    tags: ['finops', 'azure', 'cost'],
    level: 'intermediate',
    estimatedMinutes: 30,
    learningPaths: [],
    applyTo: '**',
    triggerClaude: 'Use this skill when the user asks to reduce Azure spend, rightsize VMs, or evaluate reserved instances / savings plans.',
    body: `## When to invoke

The user says "the Azure bill is high", "rightsize", "which VMs are oversized", or asks about RIs / savings plans.

## Data sources

- **Cost**: \`az costmanagement query\` or Cost Management + Billing exports.
- **Utilization**: Azure Monitor metrics for CPU / memory / network on VMs; App Service metrics on App Service plans; container_cpu_usage on AKS.
- **Advisor**: \`az advisor recommendation list --category Cost\`.

## Recommendation types (in priority order)

1. **Delete unused** — stopped-but-allocated VMs, unattached disks, unused public IPs.
2. **Rightsize** — VMs with p95 CPU < 20% for 14 days → drop one SKU size.
3. **Restructure** — App Service Plan with one small app → consolidate onto a shared plan.
4. **Commit** — Reserved Instances or Savings Plans for baseline (24/7) load.
5. **Autoscale** — dev/test schedules; AKS nodepool autoscaler bounds.

## Process

1. Pull 14-30 days of utilization for the target scope.
2. Compute p50 / p95 CPU + memory per resource.
3. Bucket into: delete / rightsize-one-size / restructure / RI-candidate.
4. Estimate savings using published Azure pricing (be conservative — quote list price then discount).
5. Produce a Markdown report:
   - **Immediate wins** (delete + rightsize) — no commitment.
   - **Restructure** — engineering effort quoted.
   - **Commitments** — RI/SP recommendations with break-even.
6. Never recommend commitments without at least 30 days of usage data.

## Do not

- Recommend a smaller SKU based on 24 hours of data.
- Ignore memory-bound workloads when only CPU is low.
- Quote savings without stating the assumed pricing tier + region.
`,
    hasScripts: true,
    scripts: {
      'pull-utilization.sh': `#!/usr/bin/env bash
# Emit a CSV of avg + p95 CPU per VM over the last 14 days.
set -euo pipefail
: "\${SUB_ID:?SUB_ID required}"
az account set -s "$SUB_ID"

echo "vmId,avgCpu,p95Cpu"
for VM in $(az vm list --query '[].id' -o tsv); do
  DATA=$(az monitor metrics list \\
    --resource "$VM" \\
    --metric 'Percentage CPU' \\
    --interval PT1H \\
    --start-time "$(date -u -d '14 days ago' +%FT%TZ)" \\
    --aggregation Average \\
    --query 'value[0].timeseries[0].data[].average' -o tsv | grep -v '^$')

  if [ -z "$DATA" ]; then continue; fi
  AVG=$(echo "$DATA" | awk '{s+=$1; n++} END {if (n>0) printf "%.1f", s/n; else print "0"}')
  P95=$(echo "$DATA" | sort -n | awk 'BEGIN {c=0} {a[c++]=$1} END {if (c>0) printf "%.1f", a[int(c*0.95)]}')
  echo "$VM,$AVG,$P95"
done
`,
    },
    trainer: {
      learningObjectives: [
        'Pull utilization data from Azure Monitor at scale.',
        'Categorize resources into delete / rightsize / restructure / commit.',
        'Produce a defensible savings recommendation with assumptions stated.',
      ],
      prerequisites: ['Azure subscription (Reader + Cost Management Reader)'],
      demoScriptMinutes: 20,
      exercises: [
        { title: 'Rightsize a subscription', durationMinutes: 45, summary: 'Run the script, bucket the output, and produce the Markdown report for one target resource group.' },
      ],
      discussionQuestions: ['When is a reserved instance the wrong choice?', 'How do you handle a workload with spiky bursts?'],
      commonPitfalls: ['Rightsizing on CPU only when the workload is memory-bound.', 'Quoting savings at list price without noting EA / discount tier.'],
      slideTalkingPoints: ['Cost work is data work — 14+ days or don\'t commit.', 'Delete first, then rightsize, then commit.'],
    },
  },
];

// --- writer ---
for (const s of skills) {
  const dir = `submissions/${s.slug}`;

  const metadata = {
    name: s.name,
    description: s.description,
    category: s.category,
    platforms: s.platforms,
    tools: s.tools,
    tags: s.tags,
    level: s.level,
    estimatedMinutes: s.estimatedMinutes,
    learningPaths: s.learningPaths,
    author: 'DevOps Community',
    version: '1.0.0',
  };
  await w(`${dir}/metadata.json`, JSON.stringify(metadata, null, 2) + '\n');

  const claudeFront = `---
name: ${s.slug}
description: ${JSON.stringify(s.triggerClaude)}
---

# ${s.name}

${s.body}
`;
  await w(`${dir}/SKILL.md`, claudeFront);

  const copilotFront = `---
description: ${JSON.stringify(s.description)}
applyTo: ${JSON.stringify(s.applyTo)}
---

# ${s.name}

${s.body}
`;
  await w(`${dir}/copilot.instructions.md`, copilotFront);

  // Trainer.md
  const t = s.trainer;
  const trainerFront = `---
learningObjectives:
${t.learningObjectives.map((x) => `  - ${JSON.stringify(x)}`).join('\n')}
prerequisites:
${t.prerequisites.map((x) => `  - ${JSON.stringify(x)}`).join('\n')}
demoScriptMinutes: ${t.demoScriptMinutes}
exercises:
${t.exercises.map((e) => `  - title: ${JSON.stringify(e.title)}\n    durationMinutes: ${e.durationMinutes}\n    summary: ${JSON.stringify(e.summary)}`).join('\n')}
discussionQuestions:
${t.discussionQuestions.map((x) => `  - ${JSON.stringify(x)}`).join('\n')}
commonPitfalls:
${t.commonPitfalls.map((x) => `  - ${JSON.stringify(x)}`).join('\n')}
slideTalkingPoints:
${t.slideTalkingPoints.map((x) => `  - ${JSON.stringify(x)}`).join('\n')}
---

Trainer notes for **${s.name}**. See SKILL.md and copilot.instructions.md for the agent-facing content.
`;
  await w(`${dir}/trainer.md`, trainerFront);

  if (s.assets) {
    for (const [rel, content] of Object.entries(s.assets)) {
      await w(`${dir}/assets/${rel}`, content);
    }
  }
  if (s.scripts) {
    for (const [rel, content] of Object.entries(s.scripts)) {
      await w(`${dir}/scripts/${rel}`, content);
    }
  }

  console.log(`✔ ${s.slug}`);
}

console.log(`\nGenerated ${skills.length} submissions.`);
