---
name: ir-runbook-author
description: "Use this skill when the user asks to write, refactor, or fill out an incident response runbook."
---

# Incident Runbook Author

## When to invoke

The user has an alert (or a past incident) and wants a runbook the on-call engineer can execute at 3 AM.

## Runbook shape

```markdown
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
```

## Rules

- Every command is copy-pasteable — no placeholders inline; put them in a "Variables" section at the top.
- Prefer **read-only diagnosis before mutation**.
- The runbook doesn't debug — it stabilizes.
- Every runbook links to its **postmortem template**.

## Process

1. Ask the user for the alert or incident description, blast radius, and known signals.
2. Draft sections 1-5.
3. Suggest 3-5 additional signals worth alerting on that this incident revealed.

