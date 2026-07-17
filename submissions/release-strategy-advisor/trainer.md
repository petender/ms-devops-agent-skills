---
learningObjectives:
  - "Pick a release strategy for a given service profile."
  - "Implement the chosen strategy in Kubernetes and a CI workflow."
  - "Design a rollback path per strategy."
prerequisites:
  - "A deployable service"
  - "Kubernetes cluster or Azure App Service slots"
demoScriptMinutes: 20
exercises:
  - title: "Implement a canary"
    durationMinutes: 40
    summary: "Split traffic 90/10 between two Deployments using Argo Rollouts and promote based on a Prometheus metric gate."
discussionQuestions:
  - "How would you canary a stateful service?"
  - "What metrics gate a canary promotion?"
commonPitfalls:
  - "No metric gate on canary."
  - "Blue-green without expand/contract for the DB."
slideTalkingPoints:
  - "Strategy is a function of state, cost, and rollback SLO."
  - "Automate the promotion or you have a manual toy."
---

Trainer notes for **Release Strategy Advisor**. See SKILL.md and copilot.instructions.md for the agent-facing content.
