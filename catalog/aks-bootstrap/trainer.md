---
learningObjectives:
  - "Provision an AKS cluster with production-shaped defaults."
  - "Separate system and user workloads with nodepool taints."
  - "Enable managed + workload identity for keyless auth."
prerequisites:
  - "Azure subscription (Owner on target RG)"
  - "Azure CLI + kubectl"
demoScriptMinutes: 25
exercises:
  - title: "Bootstrap + validate"
    durationMinutes: 45
    summary: "Run the script, then deploy a sample workload restricted to the apps nodepool."
discussionQuestions:
  - "When would you skip the private cluster mode?"
  - "How do you plan for cluster upgrades on a taint-based nodepool split?"
commonPitfalls:
  - "Scheduling workloads on the system pool."
  - "Forgetting to enable OIDC issuer before workload identity."
slideTalkingPoints:
  - "System vs user nodepool separation is the single highest-leverage AKS practice."
  - "Managed identity + workload identity = zero secrets in cluster."
---

Trainer notes for **AKS Cluster Bootstrap**. See SKILL.md and copilot.instructions.md for the agent-facing content.
