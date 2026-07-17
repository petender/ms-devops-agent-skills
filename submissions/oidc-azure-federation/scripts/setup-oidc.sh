#!/usr/bin/env bash
# Usage: ./setup-oidc.sh <repo-owner> <repo-name> <branch-or-env> <sub-id> <rg-name>
set -euo pipefail
OWNER="$1"; REPO="$2"; SUB_ID="$3"; RG="$4"
SUBJECT="repo:${OWNER}/${REPO}:ref:refs/heads/main"

APP_ID=$(az ad app create --display-name "gha-${REPO}" --query appId -o tsv)
az ad sp create --id "$APP_ID" >/dev/null || true
az role assignment create --assignee "$APP_ID" --role Contributor --scope "/subscriptions/${SUB_ID}/resourceGroups/${RG}"
az ad app federated-credential create --id "$APP_ID" --parameters "{
  \"name\": \"gha-main\",
  \"issuer\": \"https://token.actions.githubusercontent.com\",
  \"subject\": \"${SUBJECT}\",
  \"audiences\": [\"api://AzureADTokenExchange\"]
}"

TENANT_ID=$(az account show --query tenantId -o tsv)
echo "Add these to your GitHub repo:"
echo "  AZURE_CLIENT_ID=${APP_ID}"
echo "  AZURE_TENANT_ID=${TENANT_ID}"
echo "  AZURE_SUBSCRIPTION_ID=${SUB_ID}"
