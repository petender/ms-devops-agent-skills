---
name: azure-cost-rightsizer
description: "Use this skill when the user asks to reduce Azure spend, rightsize VMs, or evaluate reserved instances / savings plans."
---

# Azure Cost Rightsizer

## When to invoke

The user says "the Azure bill is high", "rightsize", "which VMs are oversized", or asks about RIs / savings plans.

## Data sources

- **Cost**: `az costmanagement query` or Cost Management + Billing exports.
- **Utilization**: Azure Monitor metrics for CPU / memory / network on VMs; App Service metrics on App Service plans; container_cpu_usage on AKS.
- **Advisor**: `az advisor recommendation list --category Cost`.

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

