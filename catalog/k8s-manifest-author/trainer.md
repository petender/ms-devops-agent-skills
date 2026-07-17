---
learningObjectives:
  - "Compose a production-ready Deployment with probes, requests, and security context."
  - "Add HPA + PDB for resilience."
  - "Use ConfigMap + Secret correctly."
prerequisites:
  - "Access to a Kubernetes cluster"
demoScriptMinutes: 15
exercises:
  - title: "Wire probes + resources"
    durationMinutes: 20
    summary: "Take a bare Deployment and add live/ready probes plus requests/limits."
discussionQuestions:
  - "How do you pick initial resource requests without production data?"
  - "When is HPA a bad fit?"
commonPitfalls:
  - "Setting limits without requests."
  - "Same path for liveness and readiness."
slideTalkingPoints:
  - "Requests = scheduling contract; limits = enforcement."
  - "PDB protects against voluntary disruption only."
---

Trainer notes for **Kubernetes Manifest Author**. See SKILL.md and copilot.instructions.md for the agent-facing content.
