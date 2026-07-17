---
learningObjectives:
  - "Map every compose primitive to its Kubernetes equivalent."
  - "Add realistic resource requests, limits, and probes."
  - "Apply the manifests in the correct order."
prerequisites:
  - "A working docker-compose stack"
  - "Access to a Kubernetes cluster (kind/minikube/AKS)"
demoScriptMinutes: 20
exercises:
  - title: "Translate a two-service stack"
    durationMinutes: 40
    summary: "Convert a compose file with an API + Postgres into Deployments, Services, ConfigMap, PVC."
discussionQuestions:
  - "What compose features have no clean K8s equivalent?"
  - "When would you use a Helm chart instead of raw manifests?"
commonPitfalls:
  - "Ignoring `depends_on` — pods start in parallel."
  - "Skipping resource requests."
slideTalkingPoints:
  - "Compose is a dev tool; K8s is a runtime."
  - "Requests drive scheduling, limits drive throttling."
---

Trainer notes for **Docker Compose → Kubernetes Manifests**. See SKILL.md and copilot.instructions.md for the agent-facing content.
