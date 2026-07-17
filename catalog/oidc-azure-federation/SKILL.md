---
name: oidc-azure-federation
description: "Use this skill when the user asks to enable OIDC / federated identity credentials for a CI pipeline authenticating to Azure."
---

# OIDC Azure Federated Credentials

## When to invoke

The user is deploying to Azure from GitHub Actions or Azure Pipelines using `AZURE_CLIENT_SECRET` (or an equivalent secret) and wants to eliminate long-lived credentials.

## Guardrails

- Federated credentials are **scoped to a specific subject** (`repo:owner/repo:ref:refs/heads/main`, `repo:owner/repo:environment:production`, or ADO service connection subject). Never use a wildcard.
- One federation per branch/environment. Don't grant `main` and `pull_request` the same power.
- Grant the AAD app **only the RBAC roles it needs** on the target scope — never Owner at subscription root.

## Standard setup (GitHub Actions → Azure)

```bash
# 1. Create the app + service principal
az ad app create --display-name "gha-${REPO}"
APP_ID=$(az ad app list --display-name "gha-${REPO}" --query '[0].appId' -o tsv)
az ad sp create --id "$APP_ID"

# 2. Assign RBAC on the target resource group
az role assignment create \
  --assignee "$APP_ID" \
  --role Contributor \
  --scope /subscriptions/$SUB/resourceGroups/$RG

# 3. Add a federated credential (branch scope)
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "gha-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:owner/repo:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

## Workflow snippet

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

## Process

1. List every workflow currently using `AZURE_CLIENT_SECRET`.
2. For each, decide the correct subject (branch or environment).
3. Create one federated credential per subject.
4. Store the three non-secret IDs (client, tenant, subscription) as repo/org **variables** (they aren't secrets) or as GitHub secrets if the org prefers uniform handling.
5. Remove `AZURE_CLIENT_SECRET` after a successful deploy.

