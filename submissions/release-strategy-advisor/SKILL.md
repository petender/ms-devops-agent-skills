---
name: release-strategy-advisor
description: "Use this skill when the user asks which release strategy to use (blue-green vs canary vs rolling) or asks to implement one."
---

# Release Strategy Advisor

## When to invoke

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
   - **Rolling**: Deployment `strategy.rollingUpdate` + `maxSurge / maxUnavailable`.
   - **Canary**: two Deployments (`stable`, `canary`) + weighted Service (Argo Rollouts / Flagger) or Traffic Manager weighted routing.
   - **Blue-green**: two Deployments behind a Service; PR flips `selector.color`.
4. Add rollback: for canary/BG a single `kubectl patch` or workflow-dispatch rollback job.

## Anti-patterns

- Canary with no automated metric gate → it's just a slow rolling deploy.
- Blue-green without database strategy → schema break kills you.
- Rolling with `maxUnavailable: 100%` → outage.

