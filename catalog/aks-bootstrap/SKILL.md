---
name: aks-bootstrap
description: "Use this skill when the user asks to create, provision, or bootstrap an AKS cluster."
---

# AKS Cluster Bootstrap

## When to invoke

The user wants a new AKS cluster suitable for real workloads (not a scratch dev cluster).

## Baseline

- **Managed identity** (not service principal).
- **Azure CNI Overlay** networking.
- **Workload identity** enabled (`--enable-workload-identity --enable-oidc-issuer`).
- **System nodepool** with taint `CriticalAddonsOnly=true:NoSchedule`.
- **User nodepool** for workloads, autoscaler enabled.
- **RBAC** with AAD integration.
- **Azure Monitor** for containers enabled.
- **Private cluster** unless the user explicitly opts out.
- `kubernetesVersion`: latest patch of the LTS minor.

## az CLI recipe

```bash
RG=rg-aks-prod
LOC=westeurope
NAME=aks-prod

az group create -n $RG -l $LOC

az aks create -g $RG -n $NAME \
  --location $LOC \
  --kubernetes-version 1.30 \
  --network-plugin azure --network-plugin-mode overlay \
  --network-dataplane cilium \
  --enable-managed-identity \
  --enable-workload-identity --enable-oidc-issuer \
  --enable-aad --enable-azure-rbac \
  --nodepool-name system --node-count 3 --node-vm-size Standard_D4ds_v5 \
  --node-taints CriticalAddonsOnly=true:NoSchedule \
  --enable-addons monitoring \
  --enable-private-cluster

az aks nodepool add -g $RG --cluster-name $NAME \
  --name apps --mode User \
  --node-count 2 --min-count 2 --max-count 10 \
  --enable-cluster-autoscaler --node-vm-size Standard_D8ds_v5
```

## Process

1. Confirm region, VNet strategy (BYO vs managed), and whether the cluster must be private.
2. Emit the `az aks create` (or Bicep) that produces the baseline above.
3. Add a follow-up section for cluster essentials: ingress controller, cert-manager, external-dns, metrics-server (if not already).
4. Print how to `az aks get-credentials` and validate with `kubectl get nodes`.

