#!/usr/bin/env bash
set -euo pipefail
: "${RG:?}"; : "${LOC:?}"; : "${NAME:?}"

az group create -n "$RG" -l "$LOC" >/dev/null

az aks create -g "$RG" -n "$NAME" \
  --location "$LOC" \
  --kubernetes-version 1.30 \
  --network-plugin azure --network-plugin-mode overlay --network-dataplane cilium \
  --enable-managed-identity \
  --enable-workload-identity --enable-oidc-issuer \
  --enable-aad --enable-azure-rbac \
  --nodepool-name system --node-count 3 --node-vm-size Standard_D4ds_v5 \
  --node-taints CriticalAddonsOnly=true:NoSchedule \
  --enable-addons monitoring \
  --enable-private-cluster

az aks nodepool add -g "$RG" --cluster-name "$NAME" \
  --name apps --mode User \
  --node-count 2 --min-count 2 --max-count 10 \
  --enable-cluster-autoscaler --node-vm-size Standard_D8ds_v5

az aks get-credentials -g "$RG" -n "$NAME" --overwrite-existing
kubectl get nodes -o wide
